# OcarinaSpa.ca — Go-live checklist

This checklist is the release gate. Do not switch production traffic until every **BLOCKER** is green.

## 1. Runtime and deployment

- Use Node.js 22 for build/runtime.
- The uploaded lockfile was stale and has been removed. On the real deployment registry, run `npm install` once to generate a fresh `package-lock.json`, review/commit it, then use `npm ci` for repeatable CI builds.
- Build: `npm run build:node`.
- Start: `npm start` → `.output/server/index.mjs`.
- Run `npm run prelive:check` before the build.
- The repository intentionally does not ship a stale Bun lockfile; npm is the single package-manager source of truth.

## 2. Required migrations — BLOCKER

Apply all Supabase migrations, including:

`supabase/migrations/20260809090000_pre_live_hardening.sql`  
`supabase/migrations/20260809120000_credit_redemption.sql`  
`supabase/migrations/20260809133000_public_write_lockdown.sql`  
`supabase/migrations/20260809134500_refund_reconciliation.sql`

These migrations add the durable controls used by production:
- opaque payment-experience tokens,
- Stripe webhook event ledger,
- immutable business event history,
- automation/checkpoint tasks,
- public rate-limit buckets,
- uniqueness for one survey and one reward per invoice/survey,
- removal of direct public writes that bypass server validation,
- atomic reservation/consumption of the 10% store credit,
- explicit lock-down of service requests/contact/diagnostic/service-question tables so public submissions must pass the server validation + rate limit.

Confirm `/admin/qa` reports the hardening migration as applied.

## 3. Server secrets — BLOCKER

Configure in the backend/host secret manager only:

- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_ACCOUNT_ID`
- `STRIPE_PUBLISHABLE_KEY`
- `ADMIN_EMAILS`
- `PUBLIC_SITE_URL=https://ocarinaspa.ca`
- `LOVABLE_API_KEY` if backend diagnostic/operations assistant is enabled

Never expose `sk_*`, `whsec_*`, or the Supabase service-role key to the browser or Git repository.

Any Stripe secret previously shared in chat or another non-secret channel must be rotated before live mode.

## 4. Stripe live account — BLOCKER

In live mode:

1. Configure `STRIPE_SECRET_KEY` with the new live secret.
2. Configure `STRIPE_ACCOUNT_ID` with the account the site is expected to use.
3. Configure `STRIPE_PUBLISHABLE_KEY` from the same Stripe account.
4. Create a live webhook endpoint:
   `https://ocarinaspa.ca/api/public/stripe-webhook`
5. Subscribe at minimum to:
   - `invoice.paid`
   - `invoice.payment_failed`
   - `invoice.voided`
   - `invoice.finalized`
   - `charge.refunded`
6. Put that endpoint's live `whsec_...` in `STRIPE_WEBHOOK_SECRET`.
7. Configure `AUTOMATION_CRON_SECRET` and schedule an hourly authenticated POST to `/api/internal/automation-reconcile`. This reconciles Stripe/local status, retries pending follow-up delivery, expires credits, and flags recovery work.
8. Confirm `/admin/qa` says the Stripe API is reachable and the returned account matches `STRIPE_ACCOUNT_ID`.

### Card payment flow

The preferred invoice-card flow is the Stripe **Payment Element** using the invoice's `confirmation_secret` and a return URL to `/paiement-confirme` with an opaque experience token. The Hosted Invoice Page remains a fallback if the Payment Element cannot be initialized.

The webhook `invoice.paid` is the server-side source of truth. Browser return pages must never be treated as proof of payment.

### Interac flow

`J'ai envoyé le virement` only means `pending_interac`.

After the bank transfer is actually received, an admin uses **Marquer Interac reçu**. The backend then marks the Stripe invoice as paid out-of-band and records the same outcome locally. This prevents an already-paid Interac invoice from remaining collectible in Stripe.

## 5. Québec taxes — BLOCKER for taxable live invoices

Before a taxable live invoice can be created, configure:

- `GST_REGISTRATION_NUMBER`
- `QST_REGISTRATION_NUMBER`
- `STRIPE_TAX_RATE_GST_ID` — active Stripe Tax Rate at 5%
- `STRIPE_TAX_RATE_QST_ID` — active Stripe Tax Rate at 9.975%

`/admin/qa` validates that both Stripe Tax Rates exist, are active, and match the expected percentages. The backend intentionally blocks taxable live invoice creation when required tax configuration is incomplete.

The business owner/accountant remains responsible for confirming that Ocarina Spa is registered and that the tax treatment of each sale is correct.

## 6. Payment and post-payment memory

The production flow is auditable:

- `stripe_webhook_events` prevents duplicate webhook processing.
- `business_events` keeps an operational timeline for invoices, ratings, surveys, questions, credits and automation.
- `automation_tasks` stores checkpoints and delivery/recovery work.
- survey submission is single-use per invoice.
- store credit is single-use issuance per survey and is calculated as a fixed amount equal to 10% of the amount actually paid.
- if automatic credit creation fails after a completed survey, a durable `credit_recovery` task is created instead of silently losing the promised reward.

Admin views:
- `/admin/factures`
- `/admin/experience`
- `/admin/historique`
- `/admin/automation`
- `/admin/qa`

## 7. Backend AI / automation policy

The AI assistant lives server-side. It may prepare an invoice draft from an admin instruction, identify missing information, and record the task/history.

**Financial writes require an authenticated admin checkpoint.** The assistant must not invent a client, amount, tax status or silently send a financial document. A request ID/idempotency key protects approved invoice creation from double-click/network retries.

This is intentional production control, not a missing automation feature.

## 8. Post-payment customer follow-through

For a paid invoice:

1. Stripe webhook records payment.
2. The backend prepares an opaque `/paiement-confirme?t=...` experience link.
3. If transactional email infrastructure is available and a recipient exists, the follow-up is queued automatically.
4. Otherwise a durable task remains visible as `needs_delivery` for admin follow-up.
5. Internal rating → recovery for low ratings + optional public review link for every paid customer.
6. Survey → fixed store credit equal to 10% of the amount paid, independent of the Google review.
7. Optional Facebook follow and service question.

Google review and Facebook URLs must be the real official business destinations:
- `GOOGLE_REVIEW_URL`
- `FACEBOOK_PAGE_URL`

Do not use guessed/fallback social URLs in production.

## 9. Google Ads / GA4

Global IDs:
- Google Ads: `AW-18182973757`
- GA4: `G-8YYZKVZBW0`

There must be one `gtag.js` loader only.

GA4 named events can run with the global tag. Dedicated Google Ads conversions only fire when the real conversion-action label is configured in the matching `VITE_AW_LABEL_*` variable. Placeholder labels are not accepted.

Validate with Tag Assistant / GA4 DebugView using a real browser session.

## 10. Interac configuration

Configure:
- `INTERAC_RECIPIENT_EMAIL`
- `INTERAC_RECIPIENT_NAME`

If Autodeposit is enabled, leave security question/answer blank. Never display a security answer publicly.

## 11. Brand/content integrity

Public brand claims are conservative:
- Canadian manufacturing is only claimed for brands where it was verified.
- International/US brands are described as brands present in the Canadian market, not as Canadian manufacturers.
- A brand card may only use that brand's own configured image; no cross-brand image fallback.
- Compatibility is confirmed by model/components rather than claiming every brand/model is repairable.

**Visual blocker:** generated technician imagery is still synthetic. If the release requirement is “real human/company photography,” replace the hero/service technician asset with a genuine Ocarina Spa employee photo before launch. Do not label an AI-generated person as an actual employee.

## 12. Manual end-to-end QA — BLOCKER

Use `/admin/qa` and complete at least these tests in the exact live candidate build:

### Stripe test mode
- Create test invoice.
- Find it from `/payer-facture` using invoice number + matching email/phone.
- Confirm wrong identity gets the same generic not-found response.
- Pay via Payment Element.
- Confirm Stripe webhook receives `invoice.paid` and local status becomes paid.
- Confirm `/paiement-confirme` only works with the opaque token and verifies the canonical Stripe invoice is paid.
- Submit rating/survey twice and confirm no duplicate survey or credit is created.

### Interac
- Mark transfer sent → `pending_interac` only.
- Admin marks money actually received.
- Confirm Stripe invoice is also paid out-of-band and can no longer be paid again.

### Admin
- Confirm a non-admin cannot access admin routes.
- Confirm `/admin/historique` shows the event timeline.
- Confirm `/admin/automation` shows invoice/checkpoint and recovery/delivery tasks.

### Browser/UX
- Desktop and mobile header.
- `/payer-facture` above-the-fold form.
- FR/EN/ES language selector.
- No raw technical errors or secret names shown publicly.
- No broken images/links.

## 13. Refunds / credit notes — OPERATING PROCEDURE

The webhook now reconciles `charge.refunded`: it records refunded cents on the local invoice, cancels unused store credit after a full refund, and creates a durable `refund_credit_review` task after a partial refund so the business does not guess how much promotional credit should remain.

The Ocarina admin still does **not** originate refunds itself. Process refunds and credit notes from Stripe Dashboard until a dedicated authenticated refund UI is designed and tested. Stripe credit notes remain the accounting mechanism for adjusting finalized invoices. Verify one test refund before live.

## 14. Language scope — BLOCKER IF MARKETED AS FULLY TRILINGUAL

`/en` and `/es` are language landing pages, but the entire application is not yet localized route-by-route. The language dropdown must not be represented as a complete translator until invoice, diagnostic, survey, legal/privacy and all service flows are actually localized. Either complete full i18n before launch or label EN/ES as language assistance/overview pages.

## 15. Automated follow-up delivery — BLOCKER FOR “fully automatic” claim

Configure and test the transactional-email provider used by `email-queue.server.ts`. The webhook creates durable `needs_delivery` work if email is unavailable, so payment is safe, but customer follow-up is not fully automatic until a live email has been received end-to-end.

## 16. Release decision

Press live only when:

- `npm run prelive:check` passes,
- a fresh `package-lock.json` has been generated from this `package.json`, and `npm ci` passes on the real deployment runner,
- `npm run build:node` passes,
- all Supabase migrations are applied,
- `/admin/qa` production checks are green,
- the live webhook has been tested,
- the correct Google/Facebook destinations are configured,
- tax registration/rates are confirmed if taxable invoices are enabled,
- and the final visual photography decision is accepted.
