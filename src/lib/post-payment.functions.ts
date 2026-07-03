/**
 * Public post-payment server functions.
 *
 * These functions are called from public routes (/payer-facture,
 * /paiement-confirme, /sondage). Identity checks always require BOTH an
 * invoice number and a contact (email or last-7-digits phone), verified
 * against Stripe. The admin service-role client is used only after that
 * check passes.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// ------------------------------ Helpers ------------------------------

function normalize(s: string) {
  return s.trim().toLowerCase().replace(/\s+|[-().]/g, "");
}

function lastDigits(s: string, n: number) {
  return s.replace(/\D/g, "").slice(-n);
}

async function verifyIdentityAndFetchInvoice(
  invoiceNumber: string,
  emailOrPhone: string,
): Promise<{
  ok: boolean;
  invoice?: import("stripe").Stripe.Invoice;
  customer?: import("stripe").Stripe.Customer | null;
  reason?: "not_found" | "mismatch";
}> {
  const { getStripe } = await import("./stripe.server");
  const stripe = getStripe();

  let invoice: import("stripe").Stripe.Invoice | null = null;
  if (invoiceNumber.startsWith("in_")) {
    try {
      invoice = await stripe.invoices.retrieve(invoiceNumber, { expand: ["customer"] });
    } catch {
      invoice = null;
    }
  } else {
    const escaped = invoiceNumber.replace(/"/g, '\\"');
    const res = await stripe.invoices.search({
      query: `number:"${escaped}"`,
      limit: 1,
      expand: ["data.customer"],
    });
    invoice = res.data[0] ?? null;
  }
  if (!invoice) return { ok: false, reason: "not_found" };

  const customer =
    typeof invoice.customer === "object" && invoice.customer && !("deleted" in invoice.customer)
      ? (invoice.customer as import("stripe").Stripe.Customer)
      : null;

  const candidateEmail = (customer?.email || invoice.customer_email || "").toLowerCase();
  const candidatePhone = customer?.phone || "";
  const looksLikeEmail = emailOrPhone.includes("@");

  let ok = false;
  if (looksLikeEmail) {
    ok = candidateEmail !== "" && normalize(candidateEmail) === normalize(emailOrPhone);
  } else {
    const inputDigits = lastDigits(emailOrPhone, 7);
    ok = inputDigits.length >= 7 && lastDigits(candidatePhone, 7) === inputDigits;
  }
  if (!ok) return { ok: false, reason: "mismatch" };
  return { ok: true, invoice, customer };
}

function randomCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 8; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return `OCARINA10-${s}`;
}

// ------------------------------ Interac config ------------------------------

export type InteracConfig = {
  recipientEmail: string | null;
  recipientName: string;
  securityQuestion: string | null;
  autodepositEnabled: boolean;
};

export const getInteracConfig = createServerFn({ method: "GET" }).handler(
  async (): Promise<InteracConfig> => {
    const email = process.env.INTERAC_RECIPIENT_EMAIL || null;
    const name = process.env.INTERAC_RECIPIENT_NAME || "Ocarina Spa";
    const question = process.env.INTERAC_SECURITY_QUESTION || null;
    // Answer is NEVER returned to the client — Autodeposit means no question needed.
    const autodeposit = !question;
    return {
      recipientEmail: email,
      recipientName: name,
      securityQuestion: question,
      autodepositEnabled: autodeposit,
    };
  },
);

// ------------------------------ Select Interac payment ------------------------------

const SelectInteracInput = z.object({
  invoiceNumber: z.string().trim().min(1).max(120),
  emailOrPhone: z.string().trim().min(3).max(255),
});

export const selectInteracPayment = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => SelectInteracInput.parse(d))
  .handler(async ({ data }) => {
    const v = await verifyIdentityAndFetchInvoice(data.invoiceNumber, data.emailOrPhone);
    if (!v.ok || !v.invoice) return { ok: false as const, reason: v.reason ?? "not_found" };

    const invoice = v.invoice;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Only mark pending_interac if the invoice isn't already paid.
    if (invoice.status === "paid") {
      return { ok: false as const, reason: "already_paid" };
    }

    await supabaseAdmin.from("stripe_invoices").upsert(
      {
        stripe_invoice_id: invoice.id,
        invoice_number: invoice.number ?? null,
        customer_name: v.customer?.name ?? null,
        customer_email: v.customer?.email ?? invoice.customer_email ?? null,
        customer_phone: v.customer?.phone ?? null,
        description: invoice.description ?? null,
        amount_cents: invoice.amount_due ?? 0,
        currency: invoice.currency ?? "cad",
        status: "pending_interac",
        payment_method: "interac",
        hosted_invoice_url: invoice.hosted_invoice_url ?? null,
        invoice_pdf: invoice.invoice_pdf ?? null,
      },
      { onConflict: "stripe_invoice_id" },
    );

    return {
      ok: true as const,
      invoiceNumber: invoice.number ?? invoice.id,
      amountDueCents: invoice.amount_due ?? 0,
      currency: invoice.currency ?? "cad",
    };
  });

// ------------------------------ Post-payment rating ------------------------------

const RatingInput = z.object({
  invoiceNumber: z.string().trim().min(1).max(120),
  emailOrPhone: z.string().trim().min(3).max(255),
  rating: z.number().int().min(1).max(5),
});

export const submitPostPaymentRating = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => RatingInput.parse(d))
  .handler(async ({ data }) => {
    const v = await verifyIdentityAndFetchInvoice(data.invoiceNumber, data.emailOrPhone);
    if (!v.ok || !v.invoice) return { ok: false as const, reason: v.reason ?? "not_found" };

    const invoice = v.invoice;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Upsert rating on the invoice row
    const needsFollowup = data.rating <= 3;
    await supabaseAdmin.from("stripe_invoices").upsert(
      {
        stripe_invoice_id: invoice.id,
        invoice_number: invoice.number ?? null,
        customer_name: v.customer?.name ?? null,
        customer_email: v.customer?.email ?? invoice.customer_email ?? null,
        customer_phone: v.customer?.phone ?? null,
        amount_cents: invoice.amount_due ?? 0,
        currency: invoice.currency ?? "cad",
        status: invoice.status ?? "open",
        customer_rating: data.rating,
        customer_rating_at: new Date().toISOString(),
        needs_followup: needsFollowup,
        hosted_invoice_url: invoice.hosted_invoice_url ?? null,
        invoice_pdf: invoice.invoice_pdf ?? null,
      },
      { onConflict: "stripe_invoice_id" },
    );

    // Create a survey token so the client can continue to the survey
    const token = crypto.randomUUID().replace(/-/g, "") + Math.random().toString(36).slice(2, 8);
    const { data: survey, error: surveyErr } = await supabaseAdmin
      .from("customer_surveys" as any)
      .insert({
        invoice_number: invoice.number ?? null,
        stripe_invoice_id: invoice.id,
        customer_name: v.customer?.name ?? null,
        customer_email: v.customer?.email ?? invoice.customer_email ?? null,
        customer_phone: v.customer?.phone ?? null,
        token,
        overall_rating: data.rating,
      } as any)
      .select("id, token")
      .single();

    if (surveyErr) {
      console.error("[submitPostPaymentRating] failed to create survey", surveyErr.message);
    }

    return {
      ok: true as const,
      rating: data.rating,
      needsFollowup,
      surveyToken: (survey as any)?.token ?? token,
      amountPaidCents: invoice.amount_paid ?? invoice.amount_due ?? 0,
      currency: invoice.currency ?? "cad",
      invoiceNumber: invoice.number ?? invoice.id,
    };
  });

// ------------------------------ Survey ------------------------------

export const getSurveyByToken = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ token: z.string().min(8).max(80) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("customer_surveys" as any)
      .select(
        "id, token, invoice_number, customer_name, customer_email, overall_rating, submitted_at",
      )
      .eq("token", data.token)
      .maybeSingle();
    if (error || !row) return { found: false as const };
    return { found: true as const, survey: row as any };
  });

const SurveyInput = z.object({
  token: z.string().min(8).max(80),
  overallRating: z.number().int().min(1).max(5).optional(),
  technicianProfessional: z.string().max(500).optional(),
  problemResolved: z.enum(["oui", "partiellement", "non"]).optional(),
  delayAcceptable: z.enum(["oui", "non"]).optional(),
  priceClear: z.enum(["oui", "non"]).optional(),
  wouldRecommend: z.enum(["oui", "non"]).optional(),
  improvementComment: z.string().max(2000).optional(),
  serviceQuestion: z.string().max(2000).optional(),
  wantsCallback: z.boolean().default(false),
  callbackTime: z.string().max(200).optional(),
});

export const submitSurvey = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => SurveyInput.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Load the survey shell
    const { data: survey, error: loadErr } = await supabaseAdmin
      .from("customer_surveys" as any)
      .select("*")
      .eq("token", data.token)
      .maybeSingle();
    if (loadErr || !survey) return { ok: false as const, reason: "invalid_token" };

    if ((survey as any).submitted_at) {
      return { ok: false as const, reason: "already_submitted" };
    }

    const now = new Date().toISOString();
    const { error: updErr } = await supabaseAdmin
      .from("customer_surveys" as any)
      .update({
        overall_rating: data.overallRating ?? (survey as any).overall_rating ?? null,
        technician_professional: data.technicianProfessional ?? null,
        problem_resolved: data.problemResolved ?? null,
        delay_acceptable: data.delayAcceptable ?? null,
        price_clear: data.priceClear ?? null,
        would_recommend: data.wouldRecommend ?? null,
        improvement_comment: data.improvementComment ?? null,
        service_question: data.serviceQuestion ?? null,
        wants_callback: data.wantsCallback,
        callback_time: data.callbackTime ?? null,
        submitted_at: now,
      })
      .eq("token", data.token);
    if (updErr) return { ok: false as const, reason: "update_failed" };

    // Compute credit value from the linked invoice (10% of paid amount)
    let creditValueCents: number | null = null;
    let currency = "cad";
    const invoiceId = (survey as any).stripe_invoice_id as string | null;
    if (invoiceId) {
      const { data: inv } = await supabaseAdmin
        .from("stripe_invoices")
        .select("amount_cents, currency")
        .eq("stripe_invoice_id", invoiceId)
        .maybeSingle();
      if (inv) {
        creditValueCents = Math.round((inv as any).amount_cents * 0.1);
        currency = (inv as any).currency ?? "cad";
      }
    }

    // Issue credit — 10% flat
    const code = randomCode();
    const { data: credit, error: credErr } = await supabaseAdmin
      .from("customer_credits" as any)
      .insert({
        customer_name: (survey as any).customer_name,
        customer_email: (survey as any).customer_email,
        customer_phone: (survey as any).customer_phone,
        invoice_number: (survey as any).invoice_number,
        stripe_invoice_id: invoiceId,
        survey_id: (survey as any).id,
        credit_code: code,
        credit_type: "percent",
        credit_value_percent: 10,
        credit_value_cents: creditValueCents,
        currency,
        status: "active",
      } as any)
      .select("credit_code, credit_value_cents, currency, expires_at")
      .single();

    if (credErr) {
      console.error("[submitSurvey] credit creation failed", credErr.message);
    }

    // If the customer had a service question, also create a service_questions record
    if (data.serviceQuestion && data.serviceQuestion.trim().length > 0) {
      await supabaseAdmin.from("service_questions" as any).insert({
        invoice_number: (survey as any).invoice_number,
        customer_name: (survey as any).customer_name,
        customer_email: (survey as any).customer_email,
        customer_phone: (survey as any).customer_phone,
        question: data.serviceQuestion.trim(),
        status: "new",
      } as any);
    }

    return {
      ok: true as const,
      credit: credit as any,
    };
  });

// ------------------------------ Service question (standalone) ------------------------------

const ServiceQuestionInput = z.object({
  invoiceNumber: z.string().trim().max(120).optional(),
  customerName: z.string().trim().min(1).max(200),
  customerEmail: z.string().trim().email().max(255),
  customerPhone: z.string().trim().max(40).optional(),
  question: z.string().trim().min(3).max(3000),
});

export const submitServiceQuestion = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => ServiceQuestionInput.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("service_questions" as any).insert({
      invoice_number: data.invoiceNumber ?? null,
      customer_name: data.customerName,
      customer_email: data.customerEmail,
      customer_phone: data.customerPhone ?? null,
      question: data.question,
      status: "new",
    } as any);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });
