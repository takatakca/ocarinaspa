# Ocarina Spa → TAKATAK legacy transfer notice

**Prepared 2026-11-05. No live activation by this PR.** Based on merged [TAKATAK PR #254](https://github.com/takatakca/takatak-v1/pull/254).

## Why
The owner wants `ocarinaspa.ca` to show “Bonjour, notre serveur a déménagé !” with a clear **Demander mon transfert** button pointing to `https://takatak.ca/transfert`. Customers must **not** be locked into a MochaHost login, charged, or transferred automatically.

## Implemented
- `src/components/TakatakMigrationNotice.tsx`: branded, responsive notice with TAKATAK CTA and an Ocarina emergency/service fallback.
- `src/routes/index.tsx`: **opt-in** homepage replacement via build-time `VITE_TAKATAK_MIGRATION_NOTICE_HOME=true`. Default is off; the existing Ocarina homepage continues to render.
- `public/serveur-demenage.html`: static staging/preview copy, served at `/serveur-demenage.html` after this version is deployed. It is *not* automatically the homepage.

## Preconditions before activating the homepage
1. Verify `https://takatak.ca/transfert` is live, usable without login, and a controlled test request appears in TAKATAK's authorized lead inbox. Confirm `WEBSITE_LEADS_ENABLED` and its workspace routing.
2. Confirm a recent restorable Ocarina production backup and the rollback route. Do not modify domain DNS, mail records, database, Stripe, or service endpoints.
3. Deploy the app version to **staging**, verify `/serveur-demenage.html`, test in desktop/mobile and confirm service links and 819-913-7727 work.
4. Obtain owner/operations approval to replace this *active business homepage*. Ocarina Spa advertises emergency repair; maintain customer access to `/services` and phone support.
5. In the build environment of the **verified active Ocarina Coolify app**, set `VITE_TAKATAK_MIGRATION_NOTICE_HOME=true` and rebuild/redeploy. This is a compile-time `VITE_` flag, not an SSH/runtime secret. Verify both apex and www routing after deployment.
6. Check root is notice, `/services` remains available, `/serveur-demenage.html` is available, transfer CTA lands at TAKATAK and creates a lead. Observe errors.

## Rollback
Remove the flag or set it to `false`, rebuild and redeploy the previously validated application. The original homepage React code is preserved unmodified behind the toggle. No irreversible migration is done.

## Current hosting source of truth
Repository PR #2 documents Coolify vps2 for ocarinaspa.ca (rather than assuming current public site is served by MochaHost). Reconfirm live routing on release day. Do not deploy by copying static HTML onto an unknown cPanel root.

**Note:** GitHub merge or CI success alone does not prove live activation. This PR leaves the homepage in its original state by default.
