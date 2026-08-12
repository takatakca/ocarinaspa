import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type SystemStatus = {
  stripeSecret: boolean;
  stripePublishableKey: boolean;
  stripeWebhookSecret: boolean;
  stripeApiReachable: boolean;
  stripeAccountMatches: boolean;
  stripeLiveMode: boolean;
  stripeKeyModesMatch: boolean;
  interacEmail: boolean;
  interacName: boolean;
  interacSecurityQuestion: boolean;
  adminEmails: boolean;
  gstRegistration: boolean;
  qstRegistration: boolean;
  stripeGstTaxRate: boolean;
  stripeQstTaxRate: boolean;
  stripeTaxRatesValid: boolean;
  stripeGstTaxRateVerified: boolean;
  stripeQstTaxRateVerified: boolean;
  googleReviewCompliance: boolean;
  lovableAi: boolean;
  hardeningMigrationApplied: boolean;
  googleReviewUrl: boolean;
  facebookPageUrl: boolean;
  publicSiteUrl: boolean;
  automationCronSecret: boolean;
  creditRedemptionMigrationApplied: boolean;
  refundReconciliationMigrationApplied: boolean;
  emailDelivery: boolean;
  adminAccessVerified: boolean;
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
    const gstRateEnv = () =>
      (process.env.STRIPE_TAX_RATE_GST_ID || process.env.STRIPE_GST_TAX_RATE_ID || "").trim();
    const qstRateEnv = () =>
      (process.env.STRIPE_TAX_RATE_QST_ID || process.env.STRIPE_QST_TAX_RATE_ID || "").trim();
    const stripeSecret = has(process.env.STRIPE_SECRET_KEY);
    const stripePublishableKey = has(
      process.env.STRIPE_PUBLISHABLE_KEY || process.env.VITE_STRIPE_PUBLISHABLE_KEY,
    );
    const expectedAccount = (process.env.STRIPE_ACCOUNT_ID || "").trim();
    let stripeApiReachable = false;
    let stripeAccountMatches = false;
    let stripeTaxRatesValid = false;
    let stripeGstTaxRateVerified = false;
    let stripeQstTaxRateVerified = false;

    if (stripeSecret) {
      try {
        const { getStripe, verifyStripeTaxRates } = await import("./stripe.server");
        const stripe = getStripe();
        const account = await (stripe.accounts.retrieve as unknown as () => Promise<{ id: string }>)();
        stripeApiReachable = Boolean(account?.id);
        stripeAccountMatches = Boolean(expectedAccount && account?.id === expectedAccount);

        const requireLive = (process.env.STRIPE_SECRET_KEY ?? "").startsWith("sk_live_");
        const rates = await verifyStripeTaxRates(requireLive);
        stripeGstTaxRateVerified = rates.gst.ok;
        stripeQstTaxRateVerified = rates.qst.ok;
        stripeTaxRatesValid = rates.ok;
      } catch (err) {
        console.error("[admin-status] Stripe self-check failed", err);
      }
    }

    let hardeningMigrationApplied = false;
    let creditRedemptionMigrationApplied = false;
    let refundReconciliationMigrationApplied = false;
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const checks = await Promise.all([
        supabaseAdmin.from("business_events" as any).select("id", { head: true, count: "exact" }).limit(1),
        supabaseAdmin.from("stripe_webhook_events" as any).select("event_id", { head: true, count: "exact" }).limit(1),
        supabaseAdmin.from("payment_experience_tokens" as any).select("id", { head: true, count: "exact" }).limit(1),
        supabaseAdmin.from("automation_tasks" as any).select("id", { head: true, count: "exact" }).limit(1),
      ]);
      hardeningMigrationApplied = checks.every((r) => !r.error);
      const creditCheck = await supabaseAdmin
        .from("customer_credits" as any)
        .select("id,reserved_at,reserved_request_id", { head: true, count: "exact" })
        .limit(1);
      creditRedemptionMigrationApplied = !creditCheck.error;
      const refundCheck = await supabaseAdmin
        .from("stripe_invoices" as any)
        .select("id,refunded_cents,refund_status,refunded_at", { head: true, count: "exact" })
        .limit(1);
      refundReconciliationMigrationApplied = !refundCheck.error;
    } catch (err) {
      console.error("[admin-status] DB self-check failed", err);
    }

    return {
      stripeSecret,
      stripePublishableKey,
      stripeWebhookSecret: has(process.env.STRIPE_WEBHOOK_SECRET),
      stripeApiReachable,
      stripeAccountMatches,
      stripeLiveMode: (process.env.STRIPE_SECRET_KEY ?? "").startsWith("sk_live_"),
      stripeKeyModesMatch: (() => {
        const secret = process.env.STRIPE_SECRET_KEY ?? "";
        const pub = process.env.STRIPE_PUBLISHABLE_KEY || process.env.VITE_STRIPE_PUBLISHABLE_KEY || "";
        return (secret.startsWith("sk_live_") && pub.startsWith("pk_live_")) || (secret.startsWith("sk_test_") && pub.startsWith("pk_test_"));
      })(),
      interacEmail: has(process.env.INTERAC_RECIPIENT_EMAIL),
      interacName: has(process.env.INTERAC_RECIPIENT_NAME),
      interacSecurityQuestion: has(process.env.INTERAC_SECURITY_QUESTION),
      adminEmails: has(process.env.ADMIN_EMAILS),
      gstRegistration: has(process.env.GST_REGISTRATION_NUMBER),
      qstRegistration: has(process.env.QST_REGISTRATION_NUMBER),
      stripeGstTaxRate: has(gstRateEnv()),
      stripeQstTaxRate: has(qstRateEnv()),
      stripeTaxRatesValid,
      lovableAi: has(process.env.LOVABLE_API_KEY),
      hardeningMigrationApplied,
      googleReviewUrl: has(process.env.GOOGLE_REVIEW_URL || process.env.VITE_GOOGLE_REVIEW_URL),
      facebookPageUrl: has(process.env.FACEBOOK_PAGE_URL || process.env.VITE_FACEBOOK_PAGE_URL),
      publicSiteUrl: has(process.env.PUBLIC_SITE_URL),
      automationCronSecret: has(process.env.AUTOMATION_CRON_SECRET),
      creditRedemptionMigrationApplied,
      refundReconciliationMigrationApplied,
      emailDelivery: has(process.env.RESEND_API_KEY) || has(process.env.TRANSACTIONAL_EMAIL_PROVIDER),
      adminAccessVerified: true,
    };
  });


export const runAdminReconciliation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin, error } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (error || !isAdmin) throw new Response("Forbidden: admin only", { status: 403 });
    const { reconcileOperationsCore } = await import("./operations-reconciler.server");
    return reconcileOperationsCore("admin");
  });
