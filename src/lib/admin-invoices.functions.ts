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

const CreateInvoiceInput = z.object({
  requestId: z.string().uuid().optional(),
  customerName: z.string().trim().min(1).max(200),
  customerEmail: z.string().trim().email().max(255),
  customerPhone: z.string().trim().max(40).optional().or(z.literal("")),
  customerAddress: z.string().trim().max(300).optional().or(z.literal("")),
  customerCity: z.string().trim().max(120).optional().or(z.literal("")),
  description: z.string().trim().min(1).max(500),
  amountBeforeTax: z.number().positive().max(1_000_000),
  applyTaxes: z.boolean().default(true),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
  daysUntilDue: z.number().int().min(0).max(365).optional(),
  creditCode: z.string().trim().min(6).max(80).optional().or(z.literal("")),
});

export type CreateInvoiceData = z.infer<typeof CreateInvoiceInput>;

export type AdminInvoiceCreated = {
  invoiceId: string;
  invoiceNumber: string | null;
  status: string;
  amountDueCents: number;
  currency: string;
  hostedInvoiceUrl: string | null;
  invoicePdf: string | null;
  customerId: string;
  appliedCreditCode?: string | null;
  appliedCreditCents?: number;
};

/** Server-only reusable core used by the admin form and approved automation tasks. */
export async function createStripeInvoiceCore(
  rawData: CreateInvoiceData,
  actor?: { userId?: string | null; actorType?: "admin" | "automation" },
): Promise<AdminInvoiceCreated> {
  const data = CreateInvoiceInput.parse(rawData);
  const requestId = data.requestId ?? crypto.randomUUID();
  const { getStripe, assertStripeAccountMatches } = await import("./stripe.server");
  const stripe = getStripe();
  await assertStripeAccountMatches();
  const isLive = (process.env.STRIPE_SECRET_KEY ?? "").startsWith("sk_live_");
  const gstRegistration = (process.env.GST_REGISTRATION_NUMBER ?? "").trim();
  const qstRegistration = (process.env.QST_REGISTRATION_NUMBER ?? "").trim();
  const gstTaxRateId = (process.env.STRIPE_GST_TAX_RATE_ID || process.env.STRIPE_TAX_RATE_GST_ID || "").trim();
  const qstTaxRateId = (process.env.STRIPE_QST_TAX_RATE_ID || process.env.STRIPE_TAX_RATE_QST_ID || "").trim();
  if (data.applyTaxes && isLive) {
    if (!gstRegistration || !qstRegistration || !gstTaxRateId || !qstTaxRateId) {
      throw new Error("Facturation taxes non prête en production : configurez les numéros TPS/TVQ et les Tax Rate IDs Stripe avant de créer une facture taxable.");
    }
    const { assertTaxRatesUsable } = await import("./stripe.server");
    await assertTaxRatesUsable();
  }

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  type ClaimedCredit = { id: string; credit_code: string; credit_value_cents: number; currency: string; expires_at: string };
  let claimedCredit: ClaimedCredit | null = null;
  const requestedCreditCode = (data.creditCode ?? "").trim();
  if (requestedCreditCode) {
    const { data: claimedRows, error: claimError } = await supabaseAdmin.rpc("claim_customer_credit", {
      p_credit_code: requestedCreditCode,
      p_customer_email: data.customerEmail,
      p_request_id: requestId,
    });
    if (claimError) throw new Error(`Impossible de réserver le crédit client: ${claimError.message}`);
    claimedCredit = ((claimedRows as ClaimedCredit[] | null)?.[0] ?? null);
    if (!claimedCredit) {
      throw new Error("Crédit invalide, expiré, déjà utilisé, réservé, ou associé à un autre courriel.");
    }
    if ((claimedCredit.currency ?? "cad").toLowerCase() !== "cad") {
      await supabaseAdmin.rpc("release_customer_credit", { p_credit_id: claimedCredit.id, p_request_id: requestId });
      throw new Error("Ce crédit n’est pas libellé en dollars canadiens.");
    }
  }

  const existing = await stripe.customers.list({ email: data.customerEmail, limit: 1 });
  let customer = existing.data[0];
  if (!customer) {
    customer = await stripe.customers.create(
      {
        name: data.customerName,
        email: data.customerEmail,
        phone: data.customerPhone || undefined,
        address: data.customerAddress
          ? { line1: data.customerAddress, city: data.customerCity || undefined, country: "CA" }
          : undefined,
        metadata: { ocarina_source: "website_admin" },
      },
      { idempotencyKey: `${requestId}:customer-create` },
    );
  } else {
    customer = await stripe.customers.update(
      customer.id,
      {
        name: data.customerName,
        phone: data.customerPhone || undefined,
        address: data.customerAddress
          ? { line1: data.customerAddress, city: data.customerCity || undefined, country: "CA" }
          : undefined,
      },
      { idempotencyKey: `${requestId}:customer-update` },
    );
  }

  const subtotalCents = Math.round(data.amountBeforeTax * 100);
  if (claimedCredit && claimedCredit.credit_value_cents > subtotalCents) {
    await supabaseAdmin.rpc("release_customer_credit", { p_credit_id: claimedCredit.id, p_request_id: requestId });
    throw new Error("Le crédit dépasse le montant avant taxes de cette facture. Utilisez-le sur une facture d’un montant égal ou supérieur.");
  }

  let createdInvoiceId: string | null = null;
  let finalizedSuccessfully = false;
  try {
  const invoice = await stripe.invoices.create(
    {
      customer: customer.id,
      collection_method: "send_invoice",
      days_until_due: data.daysUntilDue ?? 15,
      description: data.description,
      footer: data.notes || undefined,
      currency: "cad",
      auto_advance: false,
      custom_fields: [
        ...(gstRegistration ? [{ name: "No TPS", value: gstRegistration }] : []),
        ...(qstRegistration ? [{ name: "No TVQ", value: qstRegistration }] : []),
      ],
      metadata: {
        ocarina_source: "website_admin",
        ocarina_request_id: requestId,
      },
    },
    { idempotencyKey: `${requestId}:invoice-create` },
  );
  createdInvoiceId = invoice.id;

  await stripe.invoiceItems.create(
    {
      customer: customer.id,
      invoice: invoice.id,
      amount: subtotalCents,
      currency: "cad",
      description: data.description,
      tax_rates: data.applyTaxes && gstTaxRateId && qstTaxRateId ? [gstTaxRateId, qstTaxRateId] : undefined,
    },
    { idempotencyKey: `${requestId}:item-service` },
  );

  if (claimedCredit) {
    await stripe.invoiceItems.create(
      {
        customer: customer.id,
        invoice: invoice.id,
        amount: -claimedCredit.credit_value_cents,
        currency: "cad",
        description: `Crédit Ocarina Spa ${claimedCredit.credit_code}`,
        metadata: { ocarina_credit_id: claimedCredit.id, ocarina_credit_code: claimedCredit.credit_code },
      },
      { idempotencyKey: `${requestId}:item-credit:${claimedCredit.id}` },
    );
  }

  if (data.applyTaxes && (!gstTaxRateId || !qstTaxRateId)) {
    // Test/dev fallback only. Live mode is blocked above until real Stripe tax rates are configured.
    const gst = Math.round(subtotalCents * 0.05);
    const qst = Math.round(subtotalCents * 0.09975);
    await stripe.invoiceItems.create(
      {
        customer: customer.id,
        invoice: invoice.id,
        amount: gst,
        currency: "cad",
        description: "TPS (5%)",
      },
      { idempotencyKey: `${requestId}:item-gst` },
    );
    await stripe.invoiceItems.create(
      {
        customer: customer.id,
        invoice: invoice.id,
        amount: qst,
        currency: "cad",
        description: "TVQ (9.975%)",
      },
      { idempotencyKey: `${requestId}:item-qst` },
    );
  }

  const finalized = await stripe.invoices.finalizeInvoice(
    invoice.id,
    {},
    { idempotencyKey: `${requestId}:invoice-finalize` },
  );
  finalizedSuccessfully = true;

  const { error: persistError } = await supabaseAdmin.from("stripe_invoices").upsert(
    {
      stripe_invoice_id: finalized.id,
      stripe_customer_id: customer.id,
      invoice_number: finalized.number ?? null,
      customer_name: customer.name ?? data.customerName,
      customer_email: customer.email ?? data.customerEmail,
      customer_phone: customer.phone ?? data.customerPhone ?? null,
      description: data.description,
      amount_cents: finalized.amount_due ?? subtotalCents,
      currency: finalized.currency ?? "cad",
      status: finalized.status ?? "open",
      hosted_invoice_url: finalized.hosted_invoice_url ?? null,
      invoice_pdf: finalized.invoice_pdf ?? null,
    },
    { onConflict: "stripe_invoice_id" },
  );
  if (persistError) throw new Error(`Facture créée dans Stripe, mais sauvegarde locale échouée: ${persistError.message}`);

  if (claimedCredit) {
    const { data: consumed, error: consumeError } = await supabaseAdmin.rpc("consume_customer_credit", {
      p_credit_id: claimedCredit.id,
      p_request_id: requestId,
    });
    if (consumeError || consumed !== true) {
      // The Stripe invoice already contains the credit. Keep the DB credit reserved
      // (never reactivate it automatically) and surface a durable admin checkpoint.
      await supabaseAdmin.from("automation_tasks").upsert(
        {
          task_type: "credit_recovery",
          status: "needs_attention",
          idempotency_key: `credit-recovery:${requestId}`,
          instruction: `Vérifier le crédit ${claimedCredit.credit_code} appliqué à la facture ${finalized.number ?? finalized.id}`,
          input: { creditId: claimedCredit.id, creditCode: claimedCredit.credit_code, invoiceId: finalized.id, requestId },
          error_message: consumeError?.message ?? "Le crédit n’a pas pu être marqué utilisé après finalisation Stripe.",
        } as any,
        { onConflict: "idempotency_key" },
      );
    }
  }

  const { appendBusinessEvent } = await import("./business-events.server");
  await appendBusinessEvent({
    entityType: "invoice",
    entityId: finalized.id,
    eventType: "invoice.created",
    actorType: actor?.actorType ?? "admin",
    actorId: actor?.userId ?? null,
    correlationId: requestId,
    payload: {
      invoiceNumber: finalized.number ?? null,
      customerId: customer.id,
      amountDueCents: finalized.amount_due ?? subtotalCents,
      currency: finalized.currency ?? "cad",
      taxesApplied: data.applyTaxes,
      appliedCreditCode: claimedCredit?.credit_code ?? null,
      appliedCreditCents: claimedCredit?.credit_value_cents ?? 0,
    },
  });

  return {
    invoiceId: finalized.id,
    invoiceNumber: finalized.number ?? null,
    status: finalized.status ?? "open",
    amountDueCents: finalized.amount_due ?? subtotalCents,
    currency: finalized.currency ?? "cad",
    hostedInvoiceUrl: finalized.hosted_invoice_url ?? null,
    invoicePdf: finalized.invoice_pdf ?? null,
    customerId: customer.id,
    appliedCreditCode: claimedCredit?.credit_code ?? null,
    appliedCreditCents: claimedCredit?.credit_value_cents ?? 0,
  };
  } catch (error) {
    if (claimedCredit && !finalizedSuccessfully) {
      // Release only when we can prove the Stripe invoice was not finalized. If a
      // cleanup step fails, leave it reserved and create a recovery task instead.
      let safeToRelease = !createdInvoiceId;
      if (createdInvoiceId) {
        try {
          const current = await stripe.invoices.retrieve(createdInvoiceId);
          if (current.status === "draft") {
            await stripe.invoices.del(createdInvoiceId);
            safeToRelease = true;
          }
        } catch {
          safeToRelease = false;
        }
      }
      if (safeToRelease) {
        await supabaseAdmin.rpc("release_customer_credit", { p_credit_id: claimedCredit.id, p_request_id: requestId });
      } else {
        await supabaseAdmin.from("automation_tasks").upsert(
          {
            task_type: "credit_recovery",
            status: "needs_attention",
            idempotency_key: `credit-recovery:${requestId}`,
            instruction: `Vérifier la réservation du crédit ${claimedCredit.credit_code}`,
            input: { creditId: claimedCredit.id, creditCode: claimedCredit.credit_code, invoiceId: createdInvoiceId, requestId },
            error_message: "Création interrompue après création Stripe; le crédit reste réservé par sécurité.",
          } as any,
          { onConflict: "idempotency_key" },
        );
      }
    }
    throw error;
  }
}

export const createAdminInvoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => CreateInvoiceInput.parse(data))
  .handler(async ({ data, context }): Promise<AdminInvoiceCreated> => {
    await assertAdmin(context);
    return createStripeInvoiceCore(data, { userId: context.userId, actorType: "admin" });
  });

export type AdminInvoiceRow = {
  id: string;
  stripe_invoice_id: string;
  invoice_number: string | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  description: string | null;
  amount_cents: number;
  currency: string;
  status: string;
  hosted_invoice_url: string | null;
  invoice_pdf: string | null;
  paid_at: string | null;
  created_at: string;
  payment_method: string | null;
  interac_received_at: string | null;
  customer_rating: number | null;
  needs_followup: boolean | null;
};

export const listAdminInvoices = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminInvoiceRow[]> => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("stripe_invoices")
      .select(
        "id,stripe_invoice_id,invoice_number,customer_name,customer_email,customer_phone,description,amount_cents,currency,status,hosted_invoice_url,invoice_pdf,paid_at,created_at,payment_method,interac_received_at,customer_rating,needs_followup",
      )
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return (data ?? []) as AdminInvoiceRow[];
  });

export const sendAdminInvoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ invoiceId: z.string().min(1) }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { getStripe, assertStripeAccountMatches } = await import("./stripe.server");
    const stripe = getStripe();
    await assertStripeAccountMatches();
    const sent = await stripe.invoices.sendInvoice(
      data.invoiceId,
      {},
      { idempotencyKey: `ocarina-send:${data.invoiceId}` },
    );
    const { appendBusinessEvent } = await import("./business-events.server");
    await appendBusinessEvent({
      entityType: "invoice",
      entityId: data.invoiceId,
      eventType: "invoice.sent",
      actorType: "admin",
      actorId: context.userId,
      payload: { status: sent.status },
    });
    return { ok: true, status: sent.status };
  });

export const checkIsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: hasAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (hasAdmin) return { isAdmin: true, userId: context.userId };

    const allow = (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    if (allow.length === 0) return { isAdmin: false, userId: context.userId };

    const claims = context.claims as Record<string, any> | undefined;
    const userEmail = String(claims?.email ?? "").toLowerCase();
    const emailVerified = Boolean(claims?.email_verified ?? claims?.user_metadata?.email_verified);
    if (!userEmail || !allow.includes(userEmail) || !emailVerified) {
      return { isAdmin: false, userId: context.userId };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error: insertErr } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: context.userId, role: "admin" });
    if (insertErr && !/duplicate|unique/i.test(insertErr.message)) {
      console.error("[admin bootstrap] failed to grant role:", insertErr.message);
      return { isAdmin: false, userId: context.userId };
    }
    return { isAdmin: true, userId: context.userId, bootstrapped: true };
  });
