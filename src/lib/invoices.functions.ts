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
    }
  | { found: false; reason: "not_found" | "mismatch" | "not_payable" };

function normalize(s: string) {
  return s.trim().toLowerCase().replace(/\s+|[-().]/g, "");
}

function lastDigits(s: string, n: number) {
  const d = s.replace(/\D/g, "");
  return d.slice(-n);
}

export const findInvoice = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => FindInvoiceInput.parse(data))
  .handler(async ({ data }): Promise<InvoiceLookupResult> => {
    const { getStripe } = await import("./stripe.server");
    const stripe = getStripe();

    // Stripe invoice "number" (e.g. OCAR-0001) is searchable via the search API.
    // Fall back to retrieve by id if user pasted an in_... id.
    let invoice: import("stripe").Stripe.Invoice | null = null;

    if (data.invoiceNumber.startsWith("in_")) {
      try {
        invoice = await stripe.invoices.retrieve(data.invoiceNumber, {
          expand: ["customer"],
        });
      } catch {
        invoice = null;
      }
    } else {
      const escaped = data.invoiceNumber.replace(/"/g, '\\"');
      const res = await stripe.invoices.search({
        query: `number:"${escaped}"`,
        limit: 1,
        expand: ["data.customer"],
      });
      invoice = res.data[0] ?? null;
    }

    if (!invoice) return { found: false, reason: "not_found" };

    // Validate identity: customer email or phone must match
    const customer =
      typeof invoice.customer === "object" && invoice.customer && !("deleted" in invoice.customer)
        ? (invoice.customer as import("stripe").Stripe.Customer)
        : null;

    const candidateEmail = (customer?.email || invoice.customer_email || "").toLowerCase();
    const candidatePhone = customer?.phone || "";

    const input = normalize(data.emailOrPhone);
    const looksLikeEmail = data.emailOrPhone.includes("@");

    let identityOk = false;
    if (looksLikeEmail) {
      identityOk = candidateEmail !== "" && normalize(candidateEmail) === input;
    } else {
      const inputDigits = lastDigits(data.emailOrPhone, 7);
      identityOk = inputDigits.length >= 7 && lastDigits(candidatePhone, 7) === inputDigits;
    }

    if (!identityOk) return { found: false, reason: "mismatch" };

    const payable = invoice.status === "open" && !!invoice.hosted_invoice_url;

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
    };
  });
