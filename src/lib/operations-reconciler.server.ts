import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { appendBusinessEvent } from "@/lib/business-events.server";
import { enqueueTransactionalEmail, escapeEmailHtml } from "@/lib/email-queue.server";
import { assertStripeAccountMatches, getStripe } from "@/lib/stripe.server";

export type ReconcileReport = {
  checkedInvoices: number;
  repairedInvoices: number;
  expiredCredits: number;
  flaggedCreditReservations: number;
  deliveredFollowups: number;
  warnings: string[];
};

function paidAtIso(invoice: import("stripe").Stripe.Invoice) {
  const epoch = invoice.status_transitions?.paid_at;
  return epoch ? new Date(epoch * 1000).toISOString() : new Date().toISOString();
}

/**
 * Deterministic operational watchdog. No AI is used here: Stripe + DB state are reconciled
 * from canonical records so the system can recover from a missed webhook or email outage.
 */
export async function reconcileOperationsCore(actorType: "system" | "admin" = "system"): Promise<ReconcileReport> {
  const stripe = getStripe();
  await assertStripeAccountMatches();
  const report: ReconcileReport = {
    checkedInvoices: 0,
    repairedInvoices: 0,
    expiredCredits: 0,
    flaggedCreditReservations: 0,
    deliveredFollowups: 0,
    warnings: [],
  };

  const { data: invoices, error: invoicesError } = await supabaseAdmin
    .from("stripe_invoices" as any)
    .select("stripe_invoice_id,status,payment_method,paid_at,interac_received_at,invoice_number,customer_email,customer_name")
    .in("status", ["open", "pending_interac", "uncollectible"])
    .order("created_at", { ascending: false })
    .limit(100);
  if (invoicesError) throw new Error(invoicesError.message);

  for (const local of (invoices ?? []) as any[]) {
    report.checkedInvoices += 1;
    try {
      const invoice = await stripe.invoices.retrieve(local.stripe_invoice_id);
      const patch: Record<string, unknown> = {};
      if (invoice.status === "paid" && local.status !== "paid") {
        patch.status = "paid";
        patch.paid_at = paidAtIso(invoice);
        patch.payment_method = local.interac_received_at ? "interac" : "stripe";
      } else if (invoice.status === "void" && local.status !== "void") {
        patch.status = "void";
      } else if (invoice.status === "uncollectible" && local.status !== "uncollectible") {
        patch.status = "uncollectible";
      } else if (invoice.status === "open" && local.status === "uncollectible") {
        patch.status = "open";
      }

      if (Object.keys(patch).length) {
        const { error } = await supabaseAdmin
          .from("stripe_invoices" as any)
          .update({
            ...patch,
            hosted_invoice_url: invoice.hosted_invoice_url ?? null,
            invoice_pdf: invoice.invoice_pdf ?? null,
          } as any)
          .eq("stripe_invoice_id", invoice.id);
        if (error) throw error;
        report.repairedInvoices += 1;
        await appendBusinessEvent({
          entityType: "invoice",
          entityId: invoice.id,
          eventType: "operations.invoice_reconciled",
          actorType,
          payload: { fromStatus: local.status, toStatus: patch.status ?? local.status },
        });
      }

      // If the paid webhook was missed, make sure a durable follow-up task exists.
      if (invoice.status === "paid") {
        const recipient = invoice.customer_email ?? local.customer_email ?? null;
        await supabaseAdmin.from("automation_tasks" as any).upsert(
          {
            task_type: "post_payment_followup",
            idempotency_key: `post-payment:${invoice.id}`,
            status: "needs_delivery",
            instruction: "Envoyer le suivi après paiement au client.",
            input: {
              stripeInvoiceId: invoice.id,
              invoiceNumber: invoice.number ?? local.invoice_number ?? invoice.id,
              customerEmail: recipient,
              customerName: local.customer_name ?? null,
            },
          } as any,
          { onConflict: "idempotency_key", ignoreDuplicates: true },
        );
      }
    } catch (error) {
      report.warnings.push(`Facture ${local.invoice_number ?? local.stripe_invoice_id}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  const now = new Date().toISOString();
  const { data: expiredRows, error: expireError } = await supabaseAdmin
    .from("customer_credits" as any)
    .update({ status: "expired", updated_at: now } as any)
    .eq("status", "active")
    .lt("expires_at", now)
    .select("id");
  if (expireError) report.warnings.push(`Expiration crédits: ${expireError.message}`);
  else report.expiredCredits = expiredRows?.length ?? 0;

  const staleBefore = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
  const { data: reserved, error: reservedError } = await supabaseAdmin
    .from("customer_credits" as any)
    .select("id,credit_code,reserved_request_id,reserved_at")
    .eq("status", "reserved")
    .lt("reserved_at", staleBefore)
    .limit(100);
  if (reservedError) report.warnings.push(`Contrôle crédits réservés: ${reservedError.message}`);
  else {
    for (const credit of (reserved ?? []) as any[]) {
      const { error } = await supabaseAdmin.from("automation_tasks" as any).upsert(
        {
          task_type: "credit_recovery",
          status: "needs_attention",
          idempotency_key: `credit-reserved-review:${credit.id}:${credit.reserved_request_id ?? "unknown"}`,
          instruction: `Vérifier le crédit réservé ${credit.credit_code}; ne pas le réactiver sans contrôler la facture Stripe associée.`,
          input: { creditId: credit.id, creditCode: credit.credit_code, reservedAt: credit.reserved_at, requestId: credit.reserved_request_id },
        } as any,
        { onConflict: "idempotency_key", ignoreDuplicates: true },
      );
      if (!error) report.flaggedCreditReservations += 1;
    }
  }

  // Retry post-payment email delivery. The durable task remains needs_delivery when the
  // optional email infrastructure is not provisioned, so nothing is silently lost.
  const { data: followups, error: followupError } = await supabaseAdmin
    .from("automation_tasks" as any)
    .select("id,input,output,status")
    .eq("task_type", "post_payment_followup")
    .eq("status", "needs_delivery")
    .order("created_at", { ascending: true })
    .limit(50);
  if (followupError) report.warnings.push(`Suivis post-paiement: ${followupError.message}`);
  else {
    for (const task of (followups ?? []) as any[]) {
      try {
        let experienceUrl = task.output?.experienceUrl as string | undefined;
        const invoiceId = task.input?.stripeInvoiceId as string | undefined;
        if (!invoiceId) continue;
        if (!experienceUrl) {
          const { ensurePaymentExperienceToken } = await import("@/lib/invoice-security.server");
          const token = await ensurePaymentExperienceToken(invoiceId);
          const siteUrl = (process.env.PUBLIC_SITE_URL || "https://ocarinaspa.ca").replace(/\/$/, "");
          experienceUrl = `${siteUrl}/paiement-confirme?t=${encodeURIComponent(token)}`;
        }
        const recipient = typeof task.input?.customerEmail === "string" ? task.input.customerEmail : null;
        if (!recipient) continue;
        const invoiceNumber = String(task.input?.invoiceNumber || invoiceId);
        const name = typeof task.input?.customerName === "string" ? task.input.customerName.trim() : "";
        const greeting = name ? `Bonjour ${name},` : "Bonjour,";
        const queued = await enqueueTransactionalEmail({
          to: recipient,
          subject: `Merci pour votre paiement — Ocarina Spa · ${invoiceNumber}`,
          html:
            `<h2>Merci pour votre paiement</h2><p>${escapeEmailHtml(greeting)}</p>` +
            `<p>Votre facture ${escapeEmailHtml(invoiceNumber)} est payée.</p>` +
            `<p><a href="${escapeEmailHtml(experienceUrl)}">Évaluer mon expérience Ocarina Spa</a></p>` +
            `<p style="color:#666;font-size:13px">Ce lien est personnel et expire automatiquement.</p>`,
          text: `${greeting}\n\nVotre facture ${invoiceNumber} est payée.\nÉvaluez votre expérience : ${experienceUrl}`,
        });
        if (queued) {
          await supabaseAdmin.from("automation_tasks" as any).update({
            status: "completed",
            output: { ...(task.output ?? {}), experienceUrl, delivery: "email_queued" },
            error_message: null,
            completed_at: new Date().toISOString(),
          } as any).eq("id", task.id);
          report.deliveredFollowups += 1;
        } else if (experienceUrl) {
          await supabaseAdmin.from("automation_tasks" as any).update({
            output: { ...(task.output ?? {}), experienceUrl, delivery: "manual_required" },
            error_message: "Infrastructure courriel non configurée ou indisponible.",
          } as any).eq("id", task.id);
        }
      } catch (error) {
        report.warnings.push(`Suivi ${task.id}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  await appendBusinessEvent({
    entityType: "system",
    entityId: "operations-reconciler",
    eventType: "operations.reconciled",
    actorType,
    payload: report,
  });
  return report;
}
