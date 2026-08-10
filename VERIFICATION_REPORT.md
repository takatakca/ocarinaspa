# OcarinaSpa.ca — Current verification report

## Google measurement

- Google Ads global ID: `AW-18182973757`.
- GA4 Measurement ID: `G-8YYZKVZBW0`.
- There is one `gtag.js` loader in `src/lib/gtag.ts`.
- The root route does **not** load Google tracking before the visitor's privacy choice.
- `PrivacyConsentBanner` is mounted globally and analytics/marketing consent can be changed later.
- Dedicated Google Ads conversions require their real `AW-.../label` values; fake placeholder labels are not accepted.

## Stripe / invoices

- Stripe secret operations are server-side.
- Live writes are guarded by `STRIPE_ACCOUNT_ID`.
- Invoice creation uses a durable request UUID + Stripe idempotency keys.
- Public invoice lookup requires invoice number + matching email/phone and uses generic failure responses.
- Payment confirmation uses an opaque token and verifies the canonical Stripe invoice state server-side.
- Stripe webhook processing has a durable event ledger, canonical object rereads, post-payment follow-up tasks, and refund reconciliation.
- Interac is not treated as paid until an admin confirms receipt; Stripe is then marked paid out-of-band.

## Operational memory / automation

- `business_events`: immutable operational history.
- `automation_tasks`: checkpoints, recovery work, delivery work, and admin-approved invoice automation.
- `/admin/historique`: search invoices, service requests, diagnostics, tasks and related events.
- `/admin/automation`: backend AI drafting with explicit approval before financial writes.
- `/api/internal/automation-reconcile`: authenticated deterministic reconciliation endpoint for a scheduler/cron.

## Static verification performed in this audit

- `node scripts/prelive-check.mjs`: PASS, with one expected warning that a fresh `package-lock.json` must be generated in the real npm registry.
- TypeScript/TSX syntax transpile: 139 files, 0 syntax errors.
- Local/external import scan: 138 source files, 0 missing local imports, 0 undeclared package roots.
- No Stripe secret/webhook/service-role secret values found in `src/` or `public/`.
- No hardcoded Google Maps API key found in `src/` or `public/`.
- No Lovable preview domain found in public production URLs.
- No broad “all Quebec / every region” coverage claims remain in public source text.

## Build limitation in this audit environment

A real dependency install/build could not be completed because the sandbox npm registry returned HTTP 404 for a declared package (`@eslint/js`). This is an environment/registry limitation, not evidence that the production build passes.

Before live, use the real Lovable/production registry:

```bash
npm install
npm run prelive:check
npm run build:node
npm test
```

Then commit the regenerated `package-lock.json` and use `npm ci` for repeatable deployment builds.

## Runtime checks still mandatory

Use `/admin/qa` in the exact live-candidate environment and validate:

- expected Stripe account matches active key,
- secret/public keys are both live,
- live webhook signature works,
- required Supabase migrations are applied,
- TPS/TVQ registration and Stripe Tax Rates are correct if taxable invoices are enabled,
- Interac recipient values are correct,
- official Google Review and Facebook destinations are configured,
- automation cron secret/scheduler is active,
- transactional email follow-up is actually delivered,
- one Stripe refund is reconciled correctly.
