import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error || !data) {
    throw new Response("Forbidden: admin only", { status: 403 });
  }
}

const CreateInvoiceInput = z.object({
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
});

export type AdminInvoiceCreated = {
  invoiceId: string;
  invoiceNumber: string | null;
  status: string;
  amountDueCents: number;
  currency: string;
  hostedInvoiceUrl: string | null;
  invoicePdf: string | null;
  customerId: string;
};

export const createAdminInvoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => CreateInvoiceInput.parse(data))
  .handler(async ({ data, context }): Promise<AdminInvoiceCreated> => {
    await assertAdmin(context);

    const { getStripe } = await import("./stripe.server");
    const stripe = getStripe();

    // Find or create Stripe customer by email
    const existing = await stripe.customers.list({ email: data.customerEmail, limit: 1 });
    let customer = existing.data[0];
    if (!customer) {
      customer = await stripe.customers.create({
        name: data.customerName,
        email: data.customerEmail,
        phone: data.customerPhone || undefined,
        address: data.customerAddress
          ? { line1: data.customerAddress, city: data.customerCity || undefined, country: "CA" }
          : undefined,
      });
    } else {
      // Keep customer info in sync
      customer = await stripe.customers.update(customer.id, {
        name: data.customerName,
        phone: data.customerPhone || undefined,
        address: data.customerAddress
          ? { line1: data.customerAddress, city: data.customerCity || undefined, country: "CA" }
          : undefined,
      });
    }

    // Amount in cents
    const subtotalCents = Math.round(data.amountBeforeTax * 100);

    // Create invoice first (so we can attach items to it)
    const invoice = await stripe.invoices.create({
      customer: customer.id,
      collection_method: "send_invoice",
      days_until_due: data.daysUntilDue ?? 15,
      description: data.description,
      footer: data.notes || undefined,
      currency: "cad",
      auto_advance: false,
    });

    // Create invoice item attached to invoice
    await stripe.invoiceItems.create({
      customer: customer.id,
      invoice: invoice.id,
      amount: subtotalCents,
      currency: "cad",
      description: data.description,
    });

    // Add QC taxes (GST 5% + QST 9.975%) if requested
    if (data.applyTaxes) {
      const gst = Math.round(subtotalCents * 0.05);
      const qst = Math.round(subtotalCents * 0.09975);
      await stripe.invoiceItems.create({
        customer: customer.id,
        invoice: invoice.id,
        amount: gst,
        currency: "cad",
        description: "TPS (5%)",
      });
      await stripe.invoiceItems.create({
        customer: customer.id,
        invoice: invoice.id,
        amount: qst,
        currency: "cad",
        description: "TVQ (9.975%)",
      });
    }

    // Finalize
    const finalized = await stripe.invoices.finalizeInvoice(invoice.id);

    // Persist locally
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("stripe_invoices").upsert(
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

    return {
      invoiceId: finalized.id,
      invoiceNumber: finalized.number ?? null,
      status: finalized.status ?? "open",
      amountDueCents: finalized.amount_due ?? subtotalCents,
      currency: finalized.currency ?? "cad",
      hostedInvoiceUrl: finalized.hosted_invoice_url ?? null,
      invoicePdf: finalized.invoice_pdf ?? null,
      customerId: customer.id,
    };
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
    const { getStripe } = await import("./stripe.server");
    const stripe = getStripe();
    const sent = await stripe.invoices.sendInvoice(data.invoiceId);
    return { ok: true, status: sent.status };
  });

export const checkIsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // 1) Existing role check
    const { data: hasAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (hasAdmin) return { isAdmin: true, userId: context.userId };

    // 2) Bootstrap via ADMIN_EMAILS allow-list (server-side only)
    const allow = (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    if (allow.length === 0) return { isAdmin: false, userId: context.userId };

    const userEmail = (context.claims?.email ?? "").toLowerCase();
    if (!userEmail || !allow.includes(userEmail)) {
      return { isAdmin: false, userId: context.userId };
    }

    // Grant admin role using service role (bypasses RLS on user_roles).
    // Safe: gated by verified session email + server-side env allow-list.
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
