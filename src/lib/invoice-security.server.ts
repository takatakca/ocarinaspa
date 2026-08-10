import type Stripe from "stripe";

export function normalizeContact(s: string) {
  return s.trim().toLowerCase().replace(/\s+|[-().]/g, "");
}

export function lastDigits(s: string, n: number) {
  return s.replace(/\D/g, "").slice(-n);
}

export async function retrieveInvoiceByNumberOrId(invoiceNumber: string): Promise<Stripe.Invoice | null> {
  const { getStripe } = await import("./stripe.server");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const stripe = getStripe();
  const value = invoiceNumber.trim();

  // Prefer our strongly-consistent local index, then retrieve the canonical object from Stripe.
  if (!value.startsWith("in_")) {
    const { data: local } = await supabaseAdmin
      .from("stripe_invoices")
      .select("stripe_invoice_id")
      .eq("invoice_number", value)
      .maybeSingle();
    const stripeId = (local as any)?.stripe_invoice_id as string | undefined;
    if (stripeId) {
      try {
        return await stripe.invoices.retrieve(stripeId, { expand: ["customer", "confirmation_secret"] });
      } catch (err) {
        console.error("[invoice] local->Stripe retrieve failed", err);
      }
    }
  }

  if (value.startsWith("in_")) {
    try {
      return await stripe.invoices.retrieve(value, { expand: ["customer", "confirmation_secret"] });
    } catch {
      return null;
    }
  }

  // Compatibility fallback for invoices created outside this app. Stripe Search is eventually
  // consistent, so it is deliberately not the primary lookup path.
  try {
    const escaped = value.replace(/"/g, '\\"');
    const res = await stripe.invoices.search({
      query: `number:"${escaped}"`,
      limit: 1,
      expand: ["data.customer", "data.confirmation_secret"],
    });
    return res.data[0] ?? null;
  } catch (err) {
    console.error("[invoice] Stripe search failed", err);
    return null;
  }
}

export function customerFromInvoice(invoice: Stripe.Invoice): Stripe.Customer | null {
  return typeof invoice.customer === "object" && invoice.customer && !("deleted" in invoice.customer)
    ? (invoice.customer as Stripe.Customer)
    : null;
}

export function invoiceIdentityMatches(invoice: Stripe.Invoice, emailOrPhone: string) {
  const customer = customerFromInvoice(invoice);
  const candidateEmail = (customer?.email || invoice.customer_email || "").toLowerCase();
  const candidatePhone = customer?.phone || "";
  const looksLikeEmail = emailOrPhone.includes("@");
  if (looksLikeEmail) {
    return candidateEmail !== "" && normalizeContact(candidateEmail) === normalizeContact(emailOrPhone);
  }
  // Requiring 10 digits materially reduces invoice-number enumeration versus a 7-digit suffix.
  const inputDigits = lastDigits(emailOrPhone, 10);
  return inputDigits.length >= 10 && lastDigits(candidatePhone, 10) === inputDigits;
}

export async function verifyInvoiceIdentity(invoiceNumber: string, emailOrPhone: string) {
  const invoice = await retrieveInvoiceByNumberOrId(invoiceNumber);
  if (!invoice) return { ok: false as const, reason: "not_found" as const };
  if (!invoiceIdentityMatches(invoice, emailOrPhone)) {
    // Never reveal whether the invoice number itself exists.
    return { ok: false as const, reason: "not_found" as const };
  }
  return { ok: true as const, invoice, customer: customerFromInvoice(invoice) };
}

export async function ensurePaymentExperienceToken(stripeInvoiceId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: existing } = await supabaseAdmin
    .from("payment_experience_tokens" as any)
    .select("token, expires_at")
    .eq("stripe_invoice_id", stripeInvoiceId)
    .maybeSingle();

  if (existing && new Date((existing as any).expires_at).getTime() > Date.now()) {
    return (existing as any).token as string;
  }

  const token = `${crypto.randomUUID().replace(/-/g, "")}${crypto.randomUUID().replace(/-/g, "")}`;
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabaseAdmin
    .from("payment_experience_tokens" as any)
    .upsert(
      { token, stripe_invoice_id: stripeInvoiceId, expires_at: expiresAt },
      { onConflict: "stripe_invoice_id" },
    )
    .select("token")
    .single();
  if (error) throw new Error("Impossible de préparer le suivi après paiement.");
  return (data as any).token as string;
}

export async function invoiceFromExperienceToken(token: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: access } = await supabaseAdmin
    .from("payment_experience_tokens" as any)
    .select("stripe_invoice_id, expires_at")
    .eq("token", token)
    .maybeSingle();
  if (!access || new Date((access as any).expires_at).getTime() <= Date.now()) return null;

  const { getStripe } = await import("./stripe.server");
  const stripe = getStripe();
  try {
    const invoice = await stripe.invoices.retrieve((access as any).stripe_invoice_id, {
      expand: ["customer"],
    });
    await supabaseAdmin
      .from("payment_experience_tokens" as any)
      .update({ last_used_at: new Date().toISOString() })
      .eq("token", token);
    return invoice;
  } catch {
    return null;
  }
}
