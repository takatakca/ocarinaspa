import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type TransactionalEmail = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

/**
 * Queue a transactional email through the existing Lovable/Supabase email infrastructure.
 * Returns false when the optional email RPC has not been provisioned instead of throwing.
 */
export async function enqueueTransactionalEmail(message: TransactionalEmail) {
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
