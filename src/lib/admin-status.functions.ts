import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type SystemStatus = {
  stripeSecret: boolean;
  stripeWebhookSecret: boolean;
  interacEmail: boolean;
  interacName: boolean;
  interacSecurityQuestion: boolean;
  adminEmails: boolean;
};

export const getSystemStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SystemStatus> => {
    const { data: isAdmin, error } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (error || !isAdmin) throw new Response("Forbidden: admin only", { status: 403 });

    const has = (v: string | undefined) => Boolean(v && v.trim().length > 0);
    return {
      stripeSecret: has(process.env.STRIPE_SECRET_KEY),
      stripeWebhookSecret: has(process.env.STRIPE_WEBHOOK_SECRET),
      interacEmail: has(process.env.INTERAC_RECIPIENT_EMAIL),
      interacName: has(process.env.INTERAC_RECIPIENT_NAME),
      interacSecurityQuestion: has(process.env.INTERAC_SECURITY_QUESTION),
      adminEmails: has(process.env.ADMIN_EMAILS),
    };
  });
