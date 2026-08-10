# OcarinaSpa.ca — Deep pre-live audit

**Audit date:** 2026-08-09  
**Release verdict:** **DO NOT press Live yet.** The codebase is materially hardened, but the runtime/deployment gates in this report must be green first.

## Executive finding

The uploaded project had several cases where the interface looked finished but the backend contract was weaker than the UI implied. The main work in this audit was to make Stripe the financial source of truth, make public flows replay/abuse resistant, create durable operational memory, and remove public claims/content that could undermine trust.

## Critical issues found and fixed

### Stripe / money

1. Added account guard so live Stripe writes must match the configured expected account.
2. Added request IDs and Stripe idempotency keys to invoice/customer/line/finalize/send operations.
3. Public invoice lookup now verifies invoice number + customer identity and returns non-enumerating errors.
4. Payment confirmation no longer trusts a browser redirect as proof of payment; it verifies Stripe server-side.
5. Card and Interac sources are no longer confused when a customer first selects Interac and later pays by card.
6. Admin-confirmed Interac now marks the Stripe invoice paid out-of-band, preventing double collection.
7. Webhooks use a durable event ledger and reread the current Stripe object instead of trusting event order.
8. Added `charge.refunded` reconciliation. Full refunds cancel unused promotional credits; partial refunds create a human review task.
9. Store credit is now a real single-use redeemable value with atomic claim/reserve/consume behavior instead of a decorative code.
10. Taxable **live** invoice creation is blocked until TPS/TVQ registration values and Stripe Tax Rate IDs are configured.

### Public security / data

1. Added fail-closed, DB-backed rate limiting to sensitive public flows.
2. Closed legacy Supabase direct-write policies for service requests, contact messages, diagnostic leads, service questions, and survey writes so the browser cannot bypass server validation/rate limits.
3. Removed PII from post-payment URLs; opaque expiring tokens are used instead.
4. Admin auth now verifies the live Supabase user/session in addition to JWT claims.
5. Admin bootstrap requires both allow-listed email and verified email.
6. No Stripe secret, webhook secret, or Supabase service-role key is present in public/source files.

### Operational memory / follow-through

1. Added immutable `business_events` timeline.
2. Added `automation_tasks` with statuses/checkpoints/idempotency.
3. Added `/admin/historique` search across invoices, service requests, diagnostic leads, automation tasks, and events.
4. Added `/admin/automation`: backend AI may prepare an invoice draft, but financial creation requires an authenticated admin approval checkpoint.
5. Added deterministic reconciliation endpoint `/api/internal/automation-reconcile` for scheduled self-checks.
6. Post-payment follow-up becomes a durable task if email delivery is unavailable.
7. Failed service-request notification now becomes a durable `service_request_delivery` task instead of disappearing into logs.
8. High-urgency/recommended-callback diagnostic leads create durable follow-up tasks; AI failures also create a callback task.

### Google / privacy / reviews

1. GA4 + Google Ads now load only after the visitor's relevant consent choice; a privacy preference UI and policy page were added.
2. `invoice_paid` tracking was defined but not actually wired; it is now emitted only after server-side paid verification.
3. The Google-review flow no longer selectively hides the public review option from lower ratings. The 10% credit is tied to the internal survey, not to posting a Google review.
4. One global `gtag.js` loader is used for both `AW-18182973757` and `G-8YYZKVZBW0`.

### SEO / public claims

1. Removed province-wide claims such as “every municipality / all regions” where the code could not prove operational coverage.
2. Reduced search-indexed templated city/service pages to a curated set of core repair markets; other routes remain usable but noindex.
3. Production sitemap uses `https://ocarinaspa.ca` and no Lovable preview domain.
4. `llms.txt`, footer, EN copy and zone pages now use bounded service-area language.

### Spa brands / image integrity

1. Canadian-made brands are separated from other brands merely present in the Canadian market.
2. Priority Canadian group: Hydropool, Arctic Spas, Beachcomber, Coast Spas, Sunrise Spas.
3. Removed cross-brand image fallbacks (for example, one manufacturer's image being used under another brand).
4. Featured cards only use an image specifically mapped to that manufacturer.

### Deployment

1. Removed obsolete `server.cjs`, stale Bun lock strategy and stale Cloudflare `wrangler.jsonc` from the Node release path.
2. Production start points to `.output/server/index.mjs`.
3. Vite/TanStack/Nitro configuration no longer depends on the private Lovable Vite config package.
4. The stale uploaded npm lockfile was removed; a fresh lockfile must be generated in the real registry.

## Static verification result

- Pre-live static gate: **PASS**.
- TS/TSX syntax transpile: **139 files / 0 errors**.
- Import scan: **0 missing local imports / 0 undeclared package roots**.
- Secret scan of `src/` + `public/`: **clean**.
- Broad coverage/preview-domain/hardcoded Maps-key scans: **clean**.

## Remaining blockers before pressing Live

### BLOCKER 1 — Real dependency install + build

The audit sandbox registry returned HTTP 404 for a valid declared npm package, so a real `npm install`, `npm run build:node`, tests and start smoke-test could not be completed here. Do this in the exact Lovable/production runner. Do not treat the static PASS as a production build PASS.

### BLOCKER 2 — Rotate the previously exposed Stripe secret

A Stripe secret was shared outside a secret manager earlier. Rotate it before production and configure only the new live secret in the backend secret store.

### BLOCKER 3 — Confirm the exact live Stripe account

Different Stripe account identifiers appeared during the project history. The code now fails live writes if the active key does not match `STRIPE_ACCOUNT_ID`. `/admin/qa` must show the expected account match before live.

### BLOCKER 4 — Apply all new Supabase migrations

Required latest migrations include:

- `20260809090000_pre_live_hardening.sql`
- `20260809120000_credit_redemption.sql`
- `20260809133000_public_write_lockdown.sql`
- `20260809134500_refund_reconciliation.sql`

### BLOCKER 5 — Live webhook + refund event

Create/test the live webhook and subscribe to the invoice events used by the application **plus `charge.refunded`**. Confirm signature verification and a real test delivery.

### BLOCKER 6 — Québec tax configuration

If Ocarina Spa invoices taxable services, confirm the business registration/tax treatment with the responsible accounting professional, configure the TPS/TVQ identifiers and the exact Stripe Tax Rate IDs, then verify `/admin/qa` is green.

### BLOCKER 7 — Automation scheduler

Set `AUTOMATION_CRON_SECRET` and configure the host scheduler to POST periodically (recommended hourly for this workflow) to `/api/internal/automation-reconcile` with the Bearer secret. Without the scheduler, the reconciliation exists but is not automatic.

### BLOCKER 8 — Transactional email delivery

The code can queue through `enqueue_email` when that infrastructure exists and preserves failed deliveries as tasks. However, “fully automatic follow-up” is not true until a real email has been delivered end-to-end in production.

### BLOCKER 9 — Real employee photography

The current technician hero is a generated asset, not a verified photograph of an Ocarina Spa employee. If the release standard is “real human/company visual”, replace the generated technician/service imagery with actual staff/job-site photography before launch. Code cannot make a synthetic person authentic.

### BLOCKER 10 — FR / EN / ES scope

The header has FR/EN/ES and `/en` + `/es` landing pages, but this is **not yet a complete route-by-route translation system**. Invoice, diagnostic, survey, privacy/legal and service flows are not fully localized. Either complete full i18n or present EN/ES as assistance/overview pages rather than a full-site translator.

### BLOCKER 11 — Google/Social production destinations + conversion labels

Configure the real official Google Review URL, Facebook page URL, and any dedicated Google Ads conversion-action labels. Do not rely on guessed/fallback destinations.

### BLOCKER 12 — Refund operating test

Refund reconciliation is coded, but run at least one Stripe test-mode partial/full refund before live. The Ocarina admin does not originate refunds; use Stripe Dashboard for refunds/credit notes until a dedicated refund UI is separately designed and tested.

## Visual/UX verdict

The navigation and invoice-payment surface are much cleaner than the uploaded baseline. The remaining item most likely to make the public site feel “AI-generated” is not the layout; it is the use of generated staff/service photography. Replace those with actual Ocarina Spa photos for the biggest credibility improvement.

## Automation verdict

The backend now has the memory/retrievability layer the original build lacked: invoices, leads, diagnostics, customer experience, credits, Stripe events and automation tasks can be tied together and searched. The system can draft financial work from an admin instruction and can automatically reconcile/check state, but it deliberately keeps an approval checkpoint before creating financial obligations. That is the recommended release posture.

## Final release rule

Only press Live after:

1. real `npm install` + fresh lockfile,
2. `npm run prelive:check`,
3. `npm run build:node`, tests, and server start smoke-test,
4. migrations applied,
5. `/admin/qa` all required production checks green,
6. live Stripe webhook tested (including refund),
7. exact Stripe account/tax configuration confirmed,
8. cron + transactional email tested,
9. real-photo and language-scope decisions accepted.
