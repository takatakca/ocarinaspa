import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const FindInvoiceInput = z.object({
  invoiceNumber: z.string().trim().min(1).max(120),
  emailOrPhone: z.string().trim().min(3).max(255),
});

export type InvoiceLookupResult =
  | {
      found: true;
      invoiceNumber: string;
      amountDueCents: number;
      currency: string;
      status: string;
      hostedInvoiceUrl: string | null;
      payable: boolean;
      customerName: string | null;
      description: string | null;
      experienceToken: string | null;
      paymentClientSecret: string | null;
      stripePublishableKey: string | null;
      paymentElementReady: boolean;
    }
  | { found: false; reason: "not_found" | "not_payable" | "rate_limited" };

export const findInvoice = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => FindInvoiceInput.parse(data))
  .handler(async ({ data }): Promise<InvoiceLookupResult> => {
    const { consumePublicRateLimit } = await import("./public-security.server");
    // Two independent buckets: a global client fingerprint limit prevents broad invoice-number
    // enumeration, while the per-invoice bucket slows repeated guessing against one invoice.
    const [globalAllowed, invoiceAllowed] = await Promise.all([
      consumePublicRateLimit("invoice_lookup_global", 40, 10 * 60),
      consumePublicRateLimit(
        "invoice_lookup_invoice",
        12,
        10 * 60,
        data.invoiceNumber.toLowerCase(),
      ),
    ]);
    if (!globalAllowed || !invoiceAllowed) return { found: false, reason: "rate_limited" };

    const { verifyInvoiceIdentity, ensurePaymentExperienceToken, customerFromInvoice } =
      await import("./invoice-security.server");
    const verified = await verifyInvoiceIdentity(data.invoiceNumber, data.emailOrPhone);
    if (!verified.ok) return { found: false, reason: "not_found" };

    const invoice = verified.invoice;
    const customer = customerFromInvoice(invoice);
    const payable = invoice.status === "open" && !!invoice.hosted_invoice_url;
    // Prepare an opaque return token for both open and paid invoices. It contains no PII, and
    // the post-payment endpoint re-checks Stripe before allowing any rating/reward action.
    const experienceToken =
      invoice.status === "open" || invoice.status === "paid"
        ? await ensurePaymentExperienceToken(invoice.id)
        : null;
    const paymentClientSecret =
      invoice.status === "open"
        ? (((invoice as any).confirmation_secret?.client_secret as string | undefined) ?? null)
        : null;
    // Publishable keys are designed for browser use; the secret key remains server-only.
    const { stripeModesMatch } = await import("./stripe.server");
    const configuredPublishableKey =
      (process.env.STRIPE_PUBLISHABLE_KEY || process.env.VITE_STRIPE_PUBLISHABLE_KEY || "").trim() || null;
    const stripePublishableKey = stripeModesMatch() ? configuredPublishableKey : null;
    const paymentElementReady = Boolean(
      payable && paymentClientSecret && stripePublishableKey && experienceToken,
    );

    // Keep the local index synchronized even for invoices created directly in Stripe Dashboard.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("stripe_invoices").upsert(
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
        status: invoice.status ?? "unknown",
        hosted_invoice_url: invoice.hosted_invoice_url ?? null,
        invoice_pdf: invoice.invoice_pdf ?? null,
      },
      { onConflict: "stripe_invoice_id" },
    );

    const { appendBusinessEvent } = await import("./business-events.server");
    await appendBusinessEvent({
      entityType: "invoice",
      entityId: invoice.id,
      eventType: "invoice.lookup_verified",
      actorType: "customer",
      payload: { invoiceNumber: invoice.number ?? invoice.id, status: invoice.status ?? "unknown" },
    });

    return {
      found: true,
      invoiceNumber: invoice.number ?? invoice.id,
      amountDueCents: invoice.amount_due ?? 0,
      currency: invoice.currency ?? "cad",
      status: invoice.status ?? "unknown",
      hostedInvoiceUrl: invoice.hosted_invoice_url ?? null,
      payable,
      customerName: customer?.name ?? null,
      description: invoice.description ?? null,
      experienceToken,
      paymentClientSecret,
      stripePublishableKey,
      paymentElementReady,
    };
  });
