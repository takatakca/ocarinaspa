/**
 * Public post-payment server functions.
 * Customer identity is verified before a payment access token is issued. The token, not PII,
 * is then used for the post-payment experience. Credits are issued only for a Stripe-paid invoice.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

function secureCreditCode() {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (const b of bytes) suffix += alphabet[b % alphabet.length];
  return `OCARINA10-${suffix}`;
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
    return {
      recipientEmail: email,
      recipientName: name,
      securityQuestion: question,
      autodepositEnabled: !question,
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
    const { consumePublicRateLimit } = await import("./public-security.server");
    if (!(await consumePublicRateLimit("interac_select", 6, 10 * 60, data.invoiceNumber))) {
      return { ok: false as const, reason: "rate_limited" };
    }

    const { verifyInvoiceIdentity, customerFromInvoice } = await import("./invoice-security.server");
    const verified = await verifyInvoiceIdentity(data.invoiceNumber, data.emailOrPhone);
    if (!verified.ok) return { ok: false as const, reason: "not_found" };

    const invoice = verified.invoice;
    if (invoice.status === "paid") return { ok: false as const, reason: "already_paid" };
    if (invoice.status !== "open") return { ok: false as const, reason: "not_payable" };

    const customer = customerFromInvoice(invoice);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("stripe_invoices").upsert(
      {
        stripe_invoice_id: invoice.id,
        stripe_customer_id:
          typeof invoice.customer === "string" ? invoice.customer : customer?.id ?? null,
        invoice_number: invoice.number ?? null,
        customer_name: customer?.name ?? null,
        customer_email: customer?.email ?? invoice.customer_email ?? null,
        customer_phone: customer?.phone ?? null,
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
    if (error) throw new Error("Impossible d'enregistrer le choix Interac.");

    const { appendBusinessEvent } = await import("./business-events.server");
    await appendBusinessEvent({
      entityType: "invoice",
      entityId: invoice.id,
      eventType: "invoice.interac_selected",
      actorType: "customer",
      payload: { invoiceNumber: invoice.number ?? invoice.id },
    });

    return {
      ok: true as const,
      invoiceNumber: invoice.number ?? invoice.id,
      amountDueCents: invoice.amount_due ?? 0,
      currency: invoice.currency ?? "cad",
    };
  });

// ------------------------------ Post-payment status ------------------------------

export const getPostPaymentStatus = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ token: z.string().trim().min(32).max(180) }).parse(d))
  .handler(async ({ data }) => {
    const { consumePublicRateLimit } = await import("./public-security.server");
    if (!(await consumePublicRateLimit("post_payment_status", 30, 60 * 60, data.token.slice(0, 16)))) {
      return { ok: false as const, reason: "rate_limited" as const };
    }
    const { invoiceFromExperienceToken } = await import("./invoice-security.server");
    const invoice = await invoiceFromExperienceToken(data.token);
    if (!invoice) return { ok: false as const, reason: "invalid_token" as const };
    return {
      ok: true as const,
      paid: invoice.status === "paid",
      invoiceNumber: invoice.number ?? invoice.id,
      amountPaidCents: invoice.amount_paid ?? 0,
      currency: invoice.currency ?? "cad",
    };
  });

// ------------------------------ Post-payment rating ------------------------------

const RatingInput = z.object({
  token: z.string().trim().min(32).max(180),
  rating: z.number().int().min(1).max(5),
});

export const submitPostPaymentRating = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => RatingInput.parse(d))
  .handler(async ({ data }) => {
    const { consumePublicRateLimit } = await import("./public-security.server");
    if (!(await consumePublicRateLimit("post_payment_rating", 10, 60 * 60, data.token.slice(0, 16)))) {
      return { ok: false as const, reason: "rate_limited" };
    }

    const { invoiceFromExperienceToken, customerFromInvoice } = await import(
      "./invoice-security.server"
    );
    const invoice = await invoiceFromExperienceToken(data.token);
    if (!invoice) return { ok: false as const, reason: "invalid_token" };
    if (invoice.status !== "paid") return { ok: false as const, reason: "not_paid" };

    const customer = customerFromInvoice(invoice);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const now = new Date().toISOString();

    // One survey per invoice. Once submitted, the recorded experience is immutable so a
    // replayed rating request cannot rewrite the customer's completed survey or follow-up state.
    const { data: existing } = await supabaseAdmin
      .from("customer_surveys" as any)
      .select("id, token, submitted_at, overall_rating")
      .eq("stripe_invoice_id", invoice.id)
      .maybeSingle();

    const effectiveRating =
      existing && (existing as any).submitted_at && (existing as any).overall_rating
        ? Number((existing as any).overall_rating)
        : data.rating;
    const needsFollowup = effectiveRating <= 3;

    await supabaseAdmin.from("stripe_invoices").upsert(
      {
        stripe_invoice_id: invoice.id,
        stripe_customer_id:
          typeof invoice.customer === "string" ? invoice.customer : customer?.id ?? null,
        invoice_number: invoice.number ?? null,
        customer_name: customer?.name ?? null,
        customer_email: customer?.email ?? invoice.customer_email ?? null,
        customer_phone: customer?.phone ?? null,
        amount_cents: invoice.amount_due ?? invoice.amount_paid ?? 0,
        currency: invoice.currency ?? "cad",
        status: "paid",
        customer_rating: effectiveRating,
        customer_rating_at: now,
        needs_followup: needsFollowup,
        hosted_invoice_url: invoice.hosted_invoice_url ?? null,
        invoice_pdf: invoice.invoice_pdf ?? null,
      },
      { onConflict: "stripe_invoice_id" },
    );

    let surveyToken: string;
    if (existing) {
      surveyToken = (existing as any).token;
      if (!(existing as any).submitted_at) {
        await supabaseAdmin
          .from("customer_surveys" as any)
          .update({ overall_rating: effectiveRating })
          .eq("id", (existing as any).id);
      }
    } else {
      const token = `${crypto.randomUUID().replace(/-/g, "")}${crypto.randomUUID().replace(/-/g, "")}`;
      const { data: survey, error } = await supabaseAdmin
        .from("customer_surveys" as any)
        .insert({
          invoice_number: invoice.number ?? null,
          stripe_invoice_id: invoice.id,
          customer_name: customer?.name ?? null,
          customer_email: customer?.email ?? invoice.customer_email ?? null,
          customer_phone: customer?.phone ?? null,
          token,
          overall_rating: effectiveRating,
        } as any)
        .select("token")
        .single();
      if (error) {
        const { data: concurrent } = await supabaseAdmin
          .from("customer_surveys" as any)
          .select("token, overall_rating")
          .eq("stripe_invoice_id", invoice.id)
          .single();
        if (!concurrent) throw new Error("Impossible de préparer le sondage.");
        surveyToken = (concurrent as any).token;
      } else {
        surveyToken = (survey as any).token;
      }
    }

    const { appendBusinessEvent } = await import("./business-events.server");
    await appendBusinessEvent({
      entityType: "invoice",
      entityId: invoice.id,
      eventType: "customer.rating_recorded",
      actorType: "customer",
      payload: { rating: effectiveRating, needsFollowup, replayProtected: effectiveRating !== data.rating },
    });

    return {
      ok: true as const,
      rating: effectiveRating,
      needsFollowup,
      surveyToken,
      amountPaidCents: invoice.amount_paid ?? 0,
      currency: invoice.currency ?? "cad",
      invoiceNumber: invoice.number ?? invoice.id,
    };
  });

// ------------------------------ Survey ------------------------------

export const getSurveyByToken = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ token: z.string().min(32).max(180) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("customer_surveys" as any)
      .select("submitted_at")
      .eq("token", data.token)
      .maybeSingle();
    if (error || !row) return { found: false as const };
    // Do not return customer PII to the browser. The opaque token is enough to render the
    // survey state; all customer/invoice data remains server-side.
    return { found: true as const, survey: { submitted_at: (row as any).submitted_at } };
  });

const SurveyInput = z.object({
  token: z.string().min(32).max(180),
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
    const { consumePublicRateLimit } = await import("./public-security.server");
    if (!(await consumePublicRateLimit("survey_submit", 5, 60 * 60, data.token.slice(0, 16)))) {
      return { ok: false as const, reason: "rate_limited" };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: survey, error: loadErr } = await supabaseAdmin
      .from("customer_surveys" as any)
      .select("*")
      .eq("token", data.token)
      .maybeSingle();
    if (loadErr || !survey) return { ok: false as const, reason: "invalid_token" };

    const invoiceId = (survey as any).stripe_invoice_id as string | null;
    if (!invoiceId) return { ok: false as const, reason: "invoice_missing" };

    // Verify settlement against Stripe before any reward is issued.
    const { getStripe } = await import("./stripe.server");
    const stripe = getStripe();
    let invoice: import("stripe").Stripe.Invoice;
    try {
      invoice = await stripe.invoices.retrieve(invoiceId);
    } catch {
      return { ok: false as const, reason: "invoice_missing" };
    }
    if (invoice.status !== "paid" || (invoice.amount_paid ?? 0) <= 0) {
      return { ok: false as const, reason: "not_paid" };
    }

    const now = new Date().toISOString();
    // Atomic claim: only the first request can change submitted_at from NULL.
    const { data: claimed, error: updErr } = await supabaseAdmin
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
      .eq("id", (survey as any).id)
      .is("submitted_at", null)
      .select("id")
      .maybeSingle();
    if (updErr) return { ok: false as const, reason: "update_failed" };
    if (!claimed) return { ok: false as const, reason: "already_submitted" };

    const paidCents = invoice.amount_paid ?? 0;
    const creditValueCents = Math.round(paidCents * 0.1);
    const currency = invoice.currency ?? "cad";

    // One fixed-value store credit equal to 10% of the amount actually paid.
    let credit: any = null;
    for (let attempt = 0; attempt < 3 && !credit; attempt++) {
      const code = secureCreditCode();
      const { data: created, error: credErr } = await supabaseAdmin
        .from("customer_credits" as any)
        .upsert(
          {
            customer_name: (survey as any).customer_name,
            customer_email: (survey as any).customer_email,
            customer_phone: (survey as any).customer_phone,
            invoice_number: (survey as any).invoice_number,
            stripe_invoice_id: invoiceId,
            survey_id: (survey as any).id,
            credit_code: code,
            credit_type: "fixed_store_credit",
            credit_value_percent: 10,
            credit_value_cents: creditValueCents,
            currency,
            status: "active",
          } as any,
          { onConflict: "survey_id" },
        )
        .select("credit_code, credit_value_cents, currency, expires_at")
        .single();
      if (!credErr) credit = created;
      else if (!/credit_code|unique/i.test(credErr.message)) {
        console.error("[submitSurvey] credit creation failed", credErr.message);
        break;
      }
    }

    if (!credit) {
      // The customer completed the survey, so never silently lose the promised credit.
      // Record a durable recovery task that an admin can retry/review without creating duplicates.
      await supabaseAdmin.from("automation_tasks" as any).upsert(
        {
          task_type: "credit_recovery",
          idempotency_key: `credit-recovery:${(survey as any).id}`,
          status: "needs_attention",
          instruction: "Créer le crédit client de 10 % promis après sondage.",
          input: {
            surveyId: (survey as any).id,
            stripeInvoiceId: invoiceId,
            invoiceNumber: (survey as any).invoice_number,
            creditValueCents,
            currency,
          },
          error_message: "La création automatique du crédit a échoué après la soumission du sondage.",
        } as any,
        { onConflict: "idempotency_key" },
      );
    }

    if (data.serviceQuestion?.trim()) {
      await supabaseAdmin.from("service_questions" as any).insert({
        invoice_number: (survey as any).invoice_number,
        customer_name: (survey as any).customer_name,
        customer_email: (survey as any).customer_email,
        customer_phone: (survey as any).customer_phone,
        question: data.serviceQuestion.trim(),
        status: "new",
      } as any);
    }

    const { appendBusinessEvent } = await import("./business-events.server");
    await appendBusinessEvent({
      entityType: "invoice",
      entityId: invoiceId,
      eventType: "customer.survey_completed",
      actorType: "customer",
      payload: {
        surveyId: (survey as any).id,
        creditCode: credit?.credit_code ?? null,
        creditValueCents,
        wantsCallback: data.wantsCallback,
      },
    });

    return { ok: true as const, credit };
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
    const { consumePublicRateLimit } = await import("./public-security.server");
    if (!(await consumePublicRateLimit("service_question", 5, 60 * 60, data.customerEmail))) {
      return { ok: false as const, error: "Trop de demandes. Réessayez plus tard." };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: created, error } = await supabaseAdmin
      .from("service_questions" as any)
      .insert({
        invoice_number: data.invoiceNumber ?? null,
        customer_name: data.customerName,
        customer_email: data.customerEmail,
        customer_phone: data.customerPhone ?? null,
        question: data.question,
        status: "new",
      } as any)
      .select("id")
      .single();
    if (error) return { ok: false as const, error: "Impossible d'envoyer la question." };

    const { appendBusinessEvent } = await import("./business-events.server");
    await appendBusinessEvent({
      entityType: "service_question",
      entityId: (created as any).id,
      eventType: "service_question.created",
      actorType: "customer",
      payload: { invoiceNumber: data.invoiceNumber ?? null },
    });
    return { ok: true as const };
  });
