# OCARINASPA.CA — GitHub → MochaHost (Node 22 / cPanel)

> Source of truth: `package.json`, `vite.config.node.ts`, `server.cjs` and the GitHub workflow `.github/workflows/ocarinaspa-node.yml`.
> The legacy `dist/server/server.js` and Lovable Cloud deployment instructions are obsolete.

## 1. Runtime contract

- Build on GitHub Actions with Node.js **22** (not on MochaHost): `npm install --package-lock-only --ignore-scripts`, `npm ci`, `npm run prelive:check`, `npm run build:node`.
- The TanStack Start / Nitro build emits `.output/server/index.mjs` and the rest of `.output/`.
- `npm start` executes `node server.cjs`. The cPanel startup file is exactly `server.cjs`; this lightweight bridge imports Nitro's server entry and respects the cPanel-provided `PORT`.
- The CI artifact contains `.output/`, `server.cjs`, `package.json`, and `package-lock.json`.
- The workflow regenerates and commits the lockfile **only after** a successful dependency install, prelive static check and Node build.

## 2. MochaHost application

In **cPanel → Setup Node.js App**, create or select the Ocarina Spa app:

| Field | Value |
| --- | --- |
| Node.js | 22.x |
| Mode | Production |
| Application root | Actual Ocarina Spa app root under the cPanel user |
| Application URL | `ocarinaspa.ca` |
| Application startup file | `server.cjs` |

Set runtime secrets using the cPanel application environment (never commit an operational `.env`). Keep any existing production database and backups intact.

## 3. GitHub Actions configuration

Repository **Settings → Secrets and variables → Actions**:

Variables (facultatives pour les trois valeurs publiques Supabase préconfigurées dans le workflow, modifiables lors d'une migration de projet) :
- `OCARINASPA_SUPABASE_URL` (project URL, public), `OCARINASPA_SUPABASE_PROJECT_ID` (public), `OCARINASPA_SUPABASE_PUBLISHABLE_KEY` (clé anon/public browser, pas une clé service role).
- `OCARINASPA_AUTO_DEPLOY=true` **only after** cPanel has the correct Node app and the pre-live release blockers have been cleared. Default is off.
- `OCARINASPA_PRODUCTION_URL=https://ocarinaspa.ca` for post-deploy verification.

Secrets (required only for deploy):
- `OCARINASPA_SSH_HOST`, `OCARINASPA_SSH_PORT`, `OCARINASPA_SSH_USER`, `OCARINASPA_SSH_APP_ROOT`.
- `OCARINASPA_SSH_PRIVATE_KEY`: SSH private key with deployment access.
- `OCARINASPA_SSH_KNOWN_HOSTS`: **verified** host key entry. Do not auto-trust `ssh-keyscan` in a live deployment.

The workflow builds and packages on every push to `main`, uploads a downloadable artifact, and deploys via rsync/SSH **only when** `OCARINASPA_AUTO_DEPLOY` is `true`. It restarts Passenger via `tmp/restart.txt` and checks the public homepage. It does not run a heavy npm build on cPanel.

## 4. Runtime environment — never put secret values in GitHub source

At minimum: `NODE_ENV=production`, `PUBLIC_SITE_URL=https://ocarinaspa.ca`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_ACCOUNT_ID`, `STRIPE_PUBLISHABLE_KEY`, `ADMIN_EMAILS`, `AUTOMATION_CRON_SECRET_V2`, verified `RESEND_API_KEY` and `EMAIL_FROM`.

Also configure TPS/TVQ, Interac, social destinations and conversion labels as described in `LAUNCH_CHECKLIST.md`. In Supabase apply all pending migrations **before** enabling production workflows.

## 5. Deployment safeguards

- **Do not enable automatic production deployment** while Stripe/webhook, Supabase migrations, taxes or admin access remain unverified; publishing an unvalidated financial flow is not safe.
- The SSH job only replaces the build output plus the startup/package manifests; it does not replace the database or the server's environment.
- If the GitHub build fails, no production deployment occurs. The existing live site is left untouched.
- If restart/smoke check fails, inspect the GitHub job log and cPanel Passenger error log; restore the previous artifact before further edits.
- A public site responding does **not** establish which host serves it: independently check DNS, cPanel domain mapping, and deployment markers before cutover.

## 6. Manual launch validation

Use `/admin/qa` and `LAUNCH_CHECKLIST.md`: confirm the actual Stripe live account, signed webhook, invoices, Interac, refunds, TPS/TVQ, Supabase migrations/RLS, official review links, Resend delivery, EN/ES language scope and real employee imagery.
