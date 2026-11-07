# Owner actions — ocarinaspa.ca

Updated 2026-10-29. Hands-on checklist for the hosting move (MochaHost → Coolify). The main file for all sites is in Google Drive › 00 — Opérations TAKATAK: “2026-10-29 — TAKATAK hosting (MochaHost → Coolify) — MAIN FILE — OWNER and CLAUDE actions”. Item numbers are the same everywhere. This repository is public: no secret values and no hosting-account details are written here, only key names, settings and steps; account-level steps are in the private Drive main file.

**Labels**

- 🔧 OWNER — you do it by hand (accounts, keys, payments, approvals, merges, WHM)
- 🤖 CLAUDE — the agent does it; usually waits for an OWNER item
- ✅ DONE — finished and verified

## Where this site runs

- Website: https://ocarinaspa.ca (www redirects) — Coolify server vps2, project OCARINASPA, app `ocarinaspa`, auto-deploys `main`
- Supabase project: `jbdkvdowxwrwyuhglxgu`
- DNS zone: the old MochaHost account until O-13, then the main MochaHost account (copy already prepared). Only the website records point to Coolify; mail stays at MochaHost
- Email is sent through Resend (no Lovable). No mailbox or forwarder exists yet for ocarinaspa.ca

## 🔧 OWNER — manual work

### O-01 · 🔧 OWNER · ⬜ TO DO — Merge the open pull requests
- ocarinaspa #3 (removes Lovable; it also contains #2, so #2 closes by itself)
- The notes/fix PRs opened on 2026-10-29: revers-canada-hope (header fix + notes), droneair (revision + health check + notes), mimtcaapp (notes), r2neet (notes)
- mimtcaapp #77 (from another agent: removes the old FTP uploads from the Deploy workflow)

### O-02 · 🔧 OWNER · ⬜ TO DO — Add the server keys in Coolify
- Where: Coolify → Projects → OCARINASPA → production → ocarinaspa → Environment Variables → + Add. Turn “Available at Buildtime” OFF except for keys starting with VITE_. Save all, then Restart (or Redeploy if a VITE_ key changed).
- SUPABASE_SERVICE_ROLE_KEY — Supabase → project jbdkvdowxwrwyuhglxgu → Project Settings → API Keys → service_role
- RESEND_API_KEY — resend.com → API Keys → Create (sending access); EMAIL_FROM = Ocarina Spa <factures@ocarinaspa.ca>
- STRIPE_SECRET_KEY (sk_…), STRIPE_PUBLISHABLE_KEY (pk_…) — Stripe → Developers → API keys
- STRIPE_ACCOUNT_ID (acct_…) — Stripe → Settings → Business → Account details
- GST_REGISTRATION_NUMBER, QST_REGISTRATION_NUMBER — your TPS/TVQ numbers
- ADMIN_EMAILS — the login email(s) of the admins, comma-separated
- INTERAC_RECIPIENT_EMAIL, INTERAC_RECIPIENT_NAME (INTERAC_SECURITY_QUESTION only if Autodeposit is off)
- GOOGLE_REVIEW_URL, FACEBOOK_PAGE_URL — public links
- *Waits on:* O-01 (merge #3 first)

### O-03 · 🔧 OWNER · ⬜ TO DO — Stripe webhook and tax rates
- Stripe → Developers → Webhooks → Add endpoint https://ocarinaspa.ca/api/public/stripe-webhook
- Events: invoice.paid, invoice.payment_succeeded, charge.refunded → copy the Signing secret into STRIPE_WEBHOOK_SECRET
- Stripe → Product catalog → Tax rates: TPS 5 % and TVQ 9.975 % (exclusive) → STRIPE_GST_TAX_RATE_ID, STRIPE_QST_TAX_RATE_ID

### O-04 · 🔧 OWNER · ⬜ TO DO — Verify the email domain in Resend
- resend.com → Domains → Add domain ocarinaspa.ca
- Send Claude a screenshot of the DNS records Resend shows (Claude adds them: C-04)

### O-05 · 🔧 OWNER · ⬜ TO DO — Choose where info@ocarinaspa.ca forwards
- New service-request alerts are sent to info@ocarinaspa.ca, which does not exist yet
- Tell Claude the destination address (Claude creates the forwarder: C-05)

### O-13 · 🔧 OWNER · ⬜ TO DO — Retire the old MochaHost account of this domain
- Only after this site works on Coolify; first download that account's backup
- The exact account, backup file and WHM steps are in the private Drive main file (item O-13)
- *Waits on:* each site working (O-02…O-11)

## 🤖 CLAUDE — agent work

### C-04 · 🤖 CLAUDE · ⏳ WAITING — Add Resend's DNS records to ocarinaspa.ca
- In the live zone and in the the main MochaHost account copy
- *Waits on:* O-04

### C-05 · 🤖 CLAUDE · ⏳ WAITING — Create the info@ocarinaspa.ca forwarder
- In the old account and in the main MochaHost account
- *Waits on:* O-05

### C-07 · 🤖 CLAUDE · ⏳ WAITING — Hourly watchdog task in Coolify
- Scheduled task calling /api/internal/automation-reconcile with AUTOMATION_CRON_SECRET_V2 (already set)
- *Waits on:* O-02, O-03 (Stripe keys)

### C-08 · 🤖 CLAUDE · ⏳ WAITING — Test each site end to end after its keys are in
- Restart/redeploy, then forms, emails, Stripe test payment, /readyz; update the GitHub notes and this main file
- *Waits on:* O-02…O-11

### C-10 · 🤖 CLAUDE · ⏳ WAITING — After the old account is retired, check that DNS and mail are served by the main MochaHost account
- Compare the served zone with the prepared copy, re-save it if needed, then check the website and mail
- *Waits on:* O-13

### C-12 · 🤖 CLAUDE · 🔁 ONGOING — Keep the notes current
- docs/OWNER_ACTIONS.md in each repo and this main file

When you finish an OWNER item, tell the agent its number (for example “O-02 done”); the agent then does the CLAUDE items waiting on it and updates this file.
