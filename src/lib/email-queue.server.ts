import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type TransactionalEmail = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

function senderAddress() {
  const configured = (process.env.EMAIL_FROM ?? "").trim();
  return configured || "Ocarina Spa <factures@ocarinaspa.ca>";
}

async function sendWithResend(message: TransactionalEmail): Promise<boolean> {
  const resendKey = (process.env.RESEND_API_KEY ?? "").trim();
  if (!resendKey) return false;

  const payload = {
    from: senderAddress(),
    to: [message.to],
    subject: message.subject,
    html: message.html,
    text: message.text,
  };

  const direct = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${resendKey}`,
    },
    body: JSON.stringify(payload),
  });
  if (direct.ok) return true;
  // Do not log provider response bodies: they can contain customer data.
  console.error(`[email] resend api failed [${direct.status}]`);
  return false;
}

/**
 * Deliver a transactional email.
 * Resend is the configured provider; the Supabase email queue stays as a fallback
 * so nothing is lost when the provider is momentarily unavailable.
 */
export async function enqueueTransactionalEmail(message: TransactionalEmail) {
  try {
    if (await sendWithResend(message)) return true;
  } catch (error) {
    console.error("[email] resend send threw", error instanceof Error ? error.message : String(error));
  }

  const { error } = await supabaseAdmin.rpc("enqueue_email" as never, {
    queue_name: "transactional_emails",
    message: message as never,
  } as never);
  if (error) {
    console.error("[email-queue] enqueue failed", error.message);
    return false;
  }
  return true;
}

export function escapeEmailHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
