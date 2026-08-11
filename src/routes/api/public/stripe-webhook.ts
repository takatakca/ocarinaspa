import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/stripe-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.STRIPE_WEBHOOK_SECRET;
        if (!secret) return new Response("Webhook not configured", { status: 500 });

        const signature = request.headers.get("stripe-signature");
        if (!signature) return new Response("Missing signature", { status: 400 });
        const body = await request.text();

        const { getStripe } = await import("@/lib/stripe.server");
        const stripe = getStripe();
        let event: import("stripe").Stripe.Event;
        try {
          event = await stripe.webhooks.constructEventAsync(body, signature, secret);
        } catch (err) {
          console.error("[stripe-webhook] signature verification failed", err);
          return new Response("Invalid signature", { status: 401 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const objectId = (event.data.object as any)?.id ?? null;

        // Claim this event ID exactly once. Stripe may retry the same event.
        const { error: claimErr } = await supabaseAdmin.from("stripe_webhook_events" as any).insert({
          event_id: event.id,
          event_type: event.type,
          stripe_object_id: objectId,
          status: "processing",
        } as any);
        if (claimErr) {
          if (/duplicate|unique/i.test(claimErr.message)) {
            const { data: existing, error: existingErr } = await supabaseAdmin
              .from("stripe_webhook_events" as any)
              .select("status, received_at")
              .eq("event_id", event.id)
              .maybeSingle();
            if (existingErr) return new Response("Ledger error", { status: 500 });
            if ((existing as any)?.status === "processed") return new Response("ok", { status: 200 });
            const processingSince = Date.parse((existing as any)?.received_at ?? "");
            const staleProcessing =
              (existing as any)?.status === "processing" &&
              Number.isFinite(processingSince) &&
              Date.now() - processingSince > 2 * 60 * 1000;
            if ((existing as any)?.status === "processing" && !staleProcessing) {
              return new Response("Already processing", { status: 409 });
            }
            const reclaimable = (existing as any)?.status === "failed" || staleProcessing;
            if (!reclaimable) return new Response("Retry later", { status: 500 });
            const { data: reclaimed, error: reclaimErr } = await supabaseAdmin
              .from("stripe_webhook_events" as any)
              .update({
                status: "processing",
                received_at: new Date().toISOString(),
                processed_at: null,
                error_message: null,
              })
              .eq("event_id", event.id)
              .eq("status", (existing as any).status)
              .select("event_id")
              .maybeSingle();
            if (reclaimErr || !reclaimed) return new Response("Retry later", { status: 500 });
          } else {
            console.error("[stripe-webhook] event ledger error", claimErr.message);
            return new Response("Ledger error", { status: 500 });
          }
        }

        try {
          // Refunds happen after the original invoice is already paid. Reconcile them separately
          // so rewards/history do not silently drift from Stripe accounting.
          if (event.type === "charge.refunded") {
            const charge = event.data.object as import("stripe").Stripe.Charge;
            const currentCharge = await stripe.charges.retrieve(charge.id);
            let invoiceId = typeof (currentCharge as any).invoice === "string" ? (currentCharge as any).invoice : null;

            // Newer Stripe invoice/payment APIs can associate the invoice through InvoicePayment
            // instead of exposing invoice directly on Charge. Use that mapping when available.
            if (!invoiceId && currentCharge.payment_intent) {
              const paymentIntentId = typeof currentCharge.payment_intent === "string"
                ? currentCharge.payment_intent
                : currentCharge.payment_intent.id;
              try {
                const payments = await (stripe as any).invoicePayments.list({
                  payment: { type: "payment_intent", payment_intent: paymentIntentId },
                  limit: 10,
                });
                const matched = payments?.data?.find((p: any) => p?.invoice);
                invoiceId = typeof matched?.invoice === "string" ? matched.invoice : matched?.invoice?.id ?? null;
              } catch (mappingErr) {
                console.warn("[stripe-webhook] refund invoice mapping unavailable", mappingErr);
              }
            }

            if (invoiceId) {
              const refundedCents = Math.max(0, currentCharge.amount_refunded ?? 0);
              const fullRefund = refundedCents >= currentCharge.amount;
              const refundStatus = fullRefund ? "full" : refundedCents > 0 ? "partial" : null;
              const { error: refundUpdateErr } = await supabaseAdmin
                .from("stripe_invoices" as any)
                .update({
                  refunded_cents: refundedCents,
                  refund_status: refundStatus,
                  refunded_at: refundedCents > 0 ? new Date().toISOString() : null,
                } as any)
                .eq("stripe_invoice_id", invoiceId);
              if (refundUpdateErr) throw refundUpdateErr;

              if (fullRefund) {
                // A fully refunded sale cannot keep an unused promotional reward active.
                await supabaseAdmin
                  .from("customer_credits" as any)
                  .update({ status: "cancelled", updated_at: new Date().toISOString() } as any)
                  .eq("stripe_invoice_id", invoiceId)
                  .in("status", ["active", "reserved"]);
              } else if (refundedCents > 0) {
                // Partial refunds need a human decision about the reward amount. Keep the
                // financial action explicit instead of guessing a business policy.
                await supabaseAdmin.from("automation_tasks" as any).upsert({
                  task_type: "refund_credit_review",
                  idempotency_key: `refund-credit-review:${invoiceId}:${currentCharge.id}:${refundedCents}`,
                  status: "needs_input",
                  instruction: "Réviser le crédit magasin après remboursement partiel Stripe.",
                  input: { stripeInvoiceId: invoiceId, chargeId: currentCharge.id, refundedCents },
                } as any, { onConflict: "idempotency_key", ignoreDuplicates: true });
              }

              const { appendBusinessEvent } = await import("@/lib/business-events.server");
              await appendBusinessEvent({
                entityType: "invoice",
                entityId: invoiceId,
                eventType: "stripe.charge.refunded",
                actorType: "stripe",
                correlationId: event.id,
                payload: {
                  chargeId: currentCharge.id,
                  refundedCents,
                  chargeAmountCents: currentCharge.amount,
                  refundStatus,
                },
              });
            }
          }

          const relevant = new Set([
            "invoice.finalized",
            "invoice.payment_failed",
            "invoice.voided",
            "invoice.paid",
            "invoice.payment_succeeded",
          ]);

          if (relevant.has(event.type) && objectId) {
            // Always retrieve the current canonical invoice. Webhook delivery order is not guaranteed.
            const invoice = await stripe.invoices.retrieve(objectId, { expand: ["customer"] });
            const customer =
              typeof invoice.customer === "object" && invoice.customer && !("deleted" in invoice.customer)
                ? (invoice.customer as import("stripe").Stripe.Customer)
                : null;

            const { data: local } = await supabaseAdmin
              .from("stripe_invoices")
              .select("payment_method, customer_name, customer_email, customer_phone, interac_received_at")
              .eq("stripe_invoice_id", invoice.id)
              .maybeSingle();

            const paidAtEpoch = invoice.status_transitions?.paid_at;
            const isPaid = invoice.status === "paid";
            const existingMethod = (local as any)?.payment_method as string | null | undefined;
            const interacWasActuallyReceived = Boolean((local as any)?.interac_received_at);
            const paymentMethod = isPaid
              ? interacWasActuallyReceived
                ? "interac"
                : "stripe"
              : existingMethod ?? null;

            const row = {
              stripe_invoice_id: invoice.id,
              stripe_customer_id:
                typeof invoice.customer === "string" ? invoice.customer : customer?.id ?? null,
              invoice_number: invoice.number ?? null,
              // Preserve known local profile fields if Stripe doesn't include them in this event/object.
              customer_name: customer?.name ?? (local as any)?.customer_name ?? null,
              customer_email:
                customer?.email ?? invoice.customer_email ?? (local as any)?.customer_email ?? null,
              customer_phone: customer?.phone ?? (local as any)?.customer_phone ?? null,
              description: invoice.description ?? null,
              amount_cents: invoice.amount_due ?? 0,
              currency: invoice.currency ?? "cad",
              status: invoice.status ?? "unknown",
              payment_method: paymentMethod,
              hosted_invoice_url: invoice.hosted_invoice_url ?? null,
              invoice_pdf: invoice.invoice_pdf ?? null,
              paid_at:
                isPaid && paidAtEpoch
                  ? new Date(paidAtEpoch * 1000).toISOString()
                  : isPaid
                    ? new Date().toISOString()
                    : null,
            };

            const { error: upsertErr } = await supabaseAdmin
              .from("stripe_invoices")
              .upsert(row, { onConflict: "stripe_invoice_id" });
            if (upsertErr) throw upsertErr;

            const { appendBusinessEvent } = await import("@/lib/business-events.server");
            await appendBusinessEvent({
              entityType: "invoice",
              entityId: invoice.id,
              eventType: `stripe.${event.type}`,
              actorType: "stripe",
              correlationId: event.id,
              payload: {
                invoiceNumber: invoice.number ?? null,
                status: invoice.status ?? "unknown",
                amountPaid: invoice.amount_paid ?? 0,
                amountDue: invoice.amount_due ?? 0,
                paymentMethod,
              },
            });

            // A paid invoice starts the post-payment journey automatically. Claim one durable
            // follow-up task per invoice, create an opaque experience link, then queue an email
            // when the optional transactional-email infrastructure is available. Payment
            // processing never fails because email delivery is unavailable.
            if ((event.type === "invoice.paid" || event.type === "invoice.payment_succeeded") && isPaid) {
              const followupKey = `post-payment:${invoice.id}`;
              const { data: followupTask, error: followupClaimErr } = await supabaseAdmin
                .from("automation_tasks" as any)
                .insert({
                  task_type: "post_payment_followup",
                  idempotency_key: followupKey,
                  status: "executing",
                  instruction: "Envoyer le suivi après paiement au client.",
                  input: {
                    stripeInvoiceId: invoice.id,
                    invoiceNumber: invoice.number ?? invoice.id,
                    customerEmail: customer?.email ?? invoice.customer_email ?? null,
                    customerName: customer?.name ?? null,
                  },
                } as any)
                .select("id")
                .maybeSingle();

              if (!followupClaimErr && followupTask) {
                const { ensurePaymentExperienceToken } = await import("@/lib/invoice-security.server");
                const token = await ensurePaymentExperienceToken(invoice.id);
                const siteUrl = (process.env.PUBLIC_SITE_URL || "https://ocarinaspa.ca").replace(/\/$/, "");
                const experienceUrl = `${siteUrl}/paiement-confirme?t=${encodeURIComponent(token)}`;
                const recipient = customer?.email ?? invoice.customer_email ?? null;
                let deliveryStatus = "needs_delivery";
                let deliveryError: string | null = null;

                if (recipient) {
                  try {
                    const { enqueueTransactionalEmail, escapeEmailHtml } = await import("@/lib/email-queue.server");
                    const clientName = customer?.name?.trim() || "";
                    const greeting = clientName ? `Bonjour ${clientName},` : "Bonjour,";
                    const queued = await enqueueTransactionalEmail({
                      to: recipient,
                      subject: `Merci pour votre paiement — Ocarina Spa${invoice.number ? ` · ${invoice.number}` : ""}`,
                      html:
                        `<h2>Merci pour votre paiement</h2>` +
                        `<p>${escapeEmailHtml(greeting)}</p>` +
                        `<p>Votre facture ${escapeEmailHtml(invoice.number ?? invoice.id)} est maintenant payée.</p>` +
                        `<p>Vous pouvez évaluer votre expérience et accéder au sondage client ici :</p>` +
                        `<p><a href="${escapeEmailHtml(experienceUrl)}">Évaluer mon expérience Ocarina Spa</a></p>` +
                        `<p style="color:#666;font-size:13px">Ce lien est personnel et expire automatiquement.</p>`,
                      text:
                        `${greeting}\n\nVotre facture ${invoice.number ?? invoice.id} est maintenant payée.\n` +
                        `Évaluez votre expérience Ocarina Spa : ${experienceUrl}\n\n` +
                        `Ce lien est personnel et expire automatiquement.`,
                    });
                    deliveryStatus = queued ? "completed" : "needs_delivery";
                    if (!queued) deliveryError = "Infrastructure courriel non configurée ou indisponible.";
                  } catch (emailErr) {
                    deliveryError = emailErr instanceof Error ? emailErr.message : String(emailErr);
                  }
                } else {
                  deliveryError = "Aucun courriel client disponible sur la facture Stripe.";
                }

                await supabaseAdmin
                  .from("automation_tasks" as any)
                  .update({
                    status: deliveryStatus,
                    output: {
                      experienceUrl,
                      delivery: deliveryStatus === "completed" ? "email_queued" : "manual_required",
                    },
                    error_message: deliveryError?.slice(0, 2000) ?? null,
                    completed_at: deliveryStatus === "completed" ? new Date().toISOString() : null,
                  } as any)
                  .eq("id", (followupTask as any).id);

                await appendBusinessEvent({
                  entityType: "invoice",
                  entityId: invoice.id,
                  eventType: "post_payment.followup_prepared",
                  actorType: "system",
                  correlationId: event.id,
                  payload: {
                    invoiceNumber: invoice.number ?? invoice.id,
                    delivery: deliveryStatus === "completed" ? "email_queued" : "manual_required",
                  },
                });
              } else if (followupClaimErr && !/duplicate|unique/i.test(followupClaimErr.message)) {
                console.error("[stripe-webhook] follow-up task claim failed", followupClaimErr.message);
              }
            }
          }

          await supabaseAdmin
            .from("stripe_webhook_events" as any)
            .update({ status: "processed", processed_at: new Date().toISOString(), error_message: null })
            .eq("event_id", event.id);
          return new Response("ok", { status: 200 });
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          console.error("[stripe-webhook] processing error", err);
          await supabaseAdmin
            .from("stripe_webhook_events" as any)
            .update({ status: "failed", processed_at: new Date().toISOString(), error_message: message.slice(0, 2000) })
            .eq("event_id", event.id);
          return new Response("Processing error", { status: 500 });
        }
      },
    },
  },
});
