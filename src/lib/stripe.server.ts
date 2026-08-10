// Server-only Stripe client. Never import from client code.
import Stripe from "stripe";

let _stripe: Stripe | undefined;

export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  _stripe = new Stripe(key, { typescript: true });
  return _stripe;
}


let _accountCheck: { expected: string; actual: string; checkedAt: number } | null = null;

/** Guard Stripe writes against accidentally pointing production at the wrong account. */
export async function assertStripeAccountMatches(options: { requireConfiguredInLive?: boolean } = {}) {
  const stripe = getStripe();
  const expected = (process.env.STRIPE_ACCOUNT_ID ?? "").trim();
  const live = (process.env.STRIPE_SECRET_KEY ?? "").startsWith("sk_live_");
  if (live && options.requireConfiguredInLive !== false && !expected) {
    throw new Error("STRIPE_ACCOUNT_ID doit être configuré avant toute écriture Stripe en production.");
  }
  if (_accountCheck && Date.now() - _accountCheck.checkedAt < 5 * 60 * 1000 && _accountCheck.expected === expected) {
    if (expected && _accountCheck.actual !== expected) throw new Error("La clé Stripe active ne correspond pas au STRIPE_ACCOUNT_ID configuré.");
    return _accountCheck.actual;
  }
  const account = await (stripe.accounts.retrieve as unknown as () => Promise<{ id: string }>)();
  const actual = account.id;
  _accountCheck = { expected, actual, checkedAt: Date.now() };
  if (expected && actual !== expected) {
    throw new Error(`Compte Stripe incorrect: la clé active pointe vers ${actual}, pas vers le compte configuré.`);
  }
  return actual;
}

export function stripeModesMatch() {
  const secret = process.env.STRIPE_SECRET_KEY ?? "";
  const publishable = process.env.STRIPE_PUBLISHABLE_KEY || process.env.VITE_STRIPE_PUBLISHABLE_KEY || "";
  if (!secret || !publishable) return false;
  return (secret.startsWith("sk_live_") && publishable.startsWith("pk_live_")) ||
    (secret.startsWith("sk_test_") && publishable.startsWith("pk_test_"));
}
