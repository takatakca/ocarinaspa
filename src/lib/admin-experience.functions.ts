/**
 * Admin-only server functions for the post-payment experience:
 * - Mark Interac payment received
 * - Generate & retrieve a survey link for an invoice
 * - List surveys, credits, service_questions, followup alerts
 * - Resolve/dismiss followup alerts
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error || !data) throw new Response("Forbidden: admin only", { status: 403 });
}

// -------- Mark Interac received --------

export const markInteracReceived = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        invoiceId: z.string().min(1),
        note: z.string().max(2000).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: local, error: localErr } = await supabaseAdmin
      .from("stripe_invoices")
      .select("status,payment_method,interac_received_at")
      .eq("stripe_invoice_id", data.invoiceId)
      .maybeSingle();
    if (localErr || !local) throw new Error("Facture locale introuvable.");

    // Idempotent retry after the Interac payment has already been confirmed.
    if ((local as any).status === "paid" && (local as any).payment_method === "interac" && (local as any).interac_received_at) {
      return { ok: true, receivedAt: (local as any).interac_received_at as string, stripeStatus: "paid" };
    }

    // Selecting Interac is not the same as receiving it. Only a pending Interac invoice can be
    // manually confirmed; this prevents accidentally relabelling an actual card payment.
    if ((local as any).status !== "pending_interac" || (local as any).payment_method !== "interac") {
      throw new Error("Cette facture n'est pas en attente d'un virement Interac.");
    }

    const { getStripe, assertStripeAccountMatches } = await import("./stripe.server");
    const stripe = getStripe();
    await assertStripeAccountMatches();
    const invoice = await stripe.invoices.retrieve(data.invoiceId);
    if (invoice.status === "paid") {
      // Stripe already considers it paid before an admin Interac confirmation. Treat Stripe as
      // canonical and refuse to overwrite the payment method; the reconciler will mark it Stripe.
      throw new Error("Stripe indique déjà cette facture comme payée. Vérifiez le paiement avant de confirmer Interac.");
    }
    if (invoice.status !== "open") {
      throw new Error(`La facture Stripe n'est pas payable (statut: ${invoice.status ?? "inconnu"}).`);
    }

    // Record the external Interac payment in Stripe as paid out of band. This closes the invoice
    // and prevents a second card payment through the hosted page.
    const paidInvoice = await stripe.invoices.pay(
      data.invoiceId,
      { paid_out_of_band: true },
      { idempotencyKey: `ocarina-interac-paid:${data.invoiceId}` },
    );

    const now = new Date().toISOString();
    const { error } = await supabaseAdmin
      .from("stripe_invoices")
      .update({
        status: "paid",
        payment_method: "interac",
        interac_received_at: now,
        paid_at: now,
        internal_note: data.note ?? null,
        hosted_invoice_url: paidInvoice.hosted_invoice_url ?? null,
        invoice_pdf: paidInvoice.invoice_pdf ?? null,
      } as any)
      .eq("stripe_invoice_id", data.invoiceId)
      .in("status", ["pending_interac", "paid"]);
    if (error) throw new Error(error.message);

    const { appendBusinessEvent } = await import("./business-events.server");
    await appendBusinessEvent({
      entityType: "invoice",
      entityId: data.invoiceId,
      eventType: "invoice.interac_received",
      actorType: "admin",
      actorId: context.userId,
      payload: { stripeStatus: paidInvoice.status, note: data.note ?? null },
    });

    return { ok: true, receivedAt: now, stripeStatus: paidInvoice.status };
  });

// -------- Generate / fetch a survey link for an invoice --------

export const ensureSurveyLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ invoiceId: z.string().min(1) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { getStripe } = await import("./stripe.server");
    const stripe = getStripe();
    const stripeInvoice = await stripe.invoices.retrieve(data.invoiceId, { expand: ["customer"] });
    if (stripeInvoice.status !== "paid") {
      throw new Error("Le sondage post-paiement est disponible seulement après confirmation du paiement.");
    }

    const { data: inv, error } = await supabaseAdmin
      .from("stripe_invoices")
      .select("stripe_invoice_id, invoice_number, customer_name, customer_email, customer_phone")
      .eq("stripe_invoice_id", data.invoiceId)
      .maybeSingle();
    if (error || !inv) throw new Error("Invoice not found");

    const { data: existing } = await supabaseAdmin
      .from("customer_surveys" as any)
      .select("token")
      .eq("stripe_invoice_id", data.invoiceId)
      .maybeSingle();
    if (existing && (existing as any).token) {
      const { appendBusinessEvent } = await import("./business-events.server");
      await appendBusinessEvent({ entityType: "invoice", entityId: data.invoiceId, eventType: "survey.link_requested", actorType: "admin", actorId: context.userId, payload: { reused: true } });
      return { ok: true, token: (existing as any).token as string };
    }

    const token = `${crypto.randomUUID().replace(/-/g, "")}${crypto.randomUUID().replace(/-/g, "")}`;
    const { error: insErr } = await supabaseAdmin.from("customer_surveys" as any).insert({
      invoice_number: (inv as any).invoice_number,
      stripe_invoice_id: (inv as any).stripe_invoice_id,
      customer_name: (inv as any).customer_name,
      customer_email: (inv as any).customer_email,
      customer_phone: (inv as any).customer_phone,
      token,
    } as any);
    if (insErr) {
      const { data: concurrent } = await supabaseAdmin
        .from("customer_surveys" as any)
        .select("token")
        .eq("stripe_invoice_id", data.invoiceId)
        .maybeSingle();
      if (concurrent) return { ok: true, token: (concurrent as any).token as string };
      throw new Error(insErr.message);
    }
    const { appendBusinessEvent } = await import("./business-events.server");
    await appendBusinessEvent({ entityType: "invoice", entityId: data.invoiceId, eventType: "survey.link_created", actorType: "admin", actorId: context.userId, payload: {} });
    return { ok: true, token };
  });

// -------- List surveys --------

export type AdminSurveyRow = {
  id: string;
  invoice_number: string | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  overall_rating: number | null;
  would_recommend: string | null;
  wants_callback: boolean;
  submitted_at: string | null;
  created_at: string;
  improvement_comment: string | null;
  service_question: string | null;
};

export const listSurveys = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminSurveyRow[]> => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("customer_surveys")
      .select(
        "id, invoice_number, customer_name, customer_email, customer_phone, overall_rating, would_recommend, wants_callback, submitted_at, created_at, improvement_comment, service_question",
      )
      .order("created_at", { ascending: false })
      .limit(300);
    if (error) throw new Error(error.message);
    return (data ?? []) as AdminSurveyRow[];
  });

// -------- List credits --------

export type AdminCreditRow = {
  id: string;
  credit_code: string;
  customer_name: string | null;
  customer_email: string | null;
  invoice_number: string | null;
  credit_value_percent: number;
  credit_value_cents: number | null;
  currency: string;
  status: string;
  expires_at: string;
  used_at: string | null;
  created_at: string;
};

export const listCredits = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminCreditRow[]> => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("customer_credits")
      .select(
        "id, credit_code, customer_name, customer_email, invoice_number, credit_value_percent, credit_value_cents, currency, status, expires_at, used_at, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(300);
    if (error) throw new Error(error.message);
    return (data ?? []) as AdminCreditRow[];
  });

export const setCreditStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["active", "used", "expired", "cancelled"]),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const patch: Record<string, any> = { status: data.status };
    if (data.status === "used") patch.used_at = new Date().toISOString();
    const { error } = await context.supabase
      .from("customer_credits")
      .update(patch as any)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    const { appendBusinessEvent } = await import("./business-events.server");
    await appendBusinessEvent({ entityType: "customer_credit", entityId: data.id, eventType: `credit.${data.status}`, actorType: "admin", actorId: context.userId, payload: {} });
    return { ok: true };
  });

// -------- List service questions --------

export type AdminServiceQuestionRow = {
  id: string;
  invoice_number: string | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  question: string;
  status: string;
  internal_note: string | null;
  created_at: string;
};

export const listServiceQuestions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminServiceQuestionRow[]> => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("service_questions")
      .select(
        "id, invoice_number, customer_name, customer_email, customer_phone, question, status, internal_note, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(300);
    if (error) throw new Error(error.message);
    return (data ?? []) as AdminServiceQuestionRow[];
  });

export const setServiceQuestionStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["new", "in_progress", "answered", "closed"]),
        internalNote: z.string().max(3000).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const patch: Record<string, any> = { status: data.status };
    if (data.status === "answered") patch.answered_at = new Date().toISOString();
    if (data.internalNote != null) patch.internal_note = data.internalNote;
    const { error } = await context.supabase
      .from("service_questions")
      .update(patch as any)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    const { appendBusinessEvent } = await import("./business-events.server");
    await appendBusinessEvent({ entityType: "service_question", entityId: data.id, eventType: `service_question.${data.status}`, actorType: "admin", actorId: context.userId, payload: { hasInternalNote: data.internalNote != null } });
    return { ok: true };
  });

// -------- List followup alerts (low ratings) --------

export type AdminFollowupRow = {
  stripe_invoice_id: string;
  invoice_number: string | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  customer_rating: number | null;
  customer_rating_at: string | null;
  needs_followup: boolean;
  internal_note: string | null;
};

export const listFollowups = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminFollowupRow[]> => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("stripe_invoices")
      .select(
        "stripe_invoice_id, invoice_number, customer_name, customer_email, customer_phone, customer_rating, customer_rating_at, needs_followup, internal_note",
      )
      .eq("needs_followup", true)
      .order("customer_rating_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return (data ?? []) as AdminFollowupRow[];
  });

export const resolveFollowup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ invoiceId: z.string().min(1), note: z.string().max(3000).optional() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const patch: Record<string, any> = { needs_followup: false };
    if (data.note) patch.internal_note = data.note;
    const { error } = await context.supabase
      .from("stripe_invoices")
      .update(patch as any)
      .eq("stripe_invoice_id", data.invoiceId);
    if (error) throw new Error(error.message);
    const { appendBusinessEvent } = await import("./business-events.server");
    await appendBusinessEvent({ entityType: "invoice", entityId: data.invoiceId, eventType: "customer_followup.resolved", actorType: "admin", actorId: context.userId, payload: { note: data.note ?? null } });
    return { ok: true };
  });
