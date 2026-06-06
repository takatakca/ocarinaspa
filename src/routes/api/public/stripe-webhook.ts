import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/stripe-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.STRIPE_WEBHOOK_SECRET;
        if (!secret) {
          return new Response("Webhook secret not configured", { status: 500 });
        }

        const signature = request.headers.get("stripe-signature");
        if (!signature) {
          return new Response("Missing signature", { status: 400 });
        }

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

        // Helpers
        const upsertInvoice = async (
          invoice: import("stripe").Stripe.Invoice,
          extra: Record<string, unknown> = {},
        ) => {
          const customer =
            typeof invoice.customer === "object" && invoice.customer && !("deleted" in invoice.customer)
              ? (invoice.customer as import("stripe").Stripe.Customer)
              : null;

          const row = {
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
            status: invoice.status ?? "unknown",
            hosted_invoice_url: invoice.hosted_invoice_url ?? null,
            invoice_pdf: invoice.invoice_pdf ?? null,
            ...extra,
          };

          await supabaseAdmin
            .from("stripe_invoices")
            .upsert(row, { onConflict: "stripe_invoice_id" });
        };

        try {
          switch (event.type) {
            case "invoice.finalized":
            case "invoice.payment_failed":
            case "invoice.voided": {
              const invoice = event.data.object as import("stripe").Stripe.Invoice;
              await upsertInvoice(invoice);
              break;
            }
            case "invoice.paid":
            case "invoice.payment_succeeded": {
              const invoice = event.data.object as import("stripe").Stripe.Invoice;
              await upsertInvoice(invoice, {
                paid_at: new Date().toISOString(),
                status: "paid",
              });
              break;
            }
            default:
              // ignore unrelated events
              break;
          }
        } catch (err) {
          console.error("[stripe-webhook] processing error", err);
          return new Response("Processing error", { status: 500 });
        }

        return new Response("ok", { status: 200 });
      },
    },
  },
});
