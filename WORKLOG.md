# Work log

- 2026-10-27 | Claude | claude/remove-lovable-ai → PR | active | Remove Lovable: rule-based pre-diagnostic from the error-code reference, admin invoice form instead of AI text parsing, service-request emails via Resend (no Lovable queue) | owner merges; set RESEND_API_KEY + EMAIL_FROM and SUPABASE_SERVICE_ROLE_KEY in Coolify, then test a real diagnostic and service request
- 2026-10-27 | Claude | claude/domain-on-coolify → PR #2 | PR #2 open | ocarinaspa.ca switched to Coolify (app ocarinaspa, vps2), www → apex; HTTPS /services 30 KB; mail unchanged at MochaHost | owner adds server secrets (service role, Resend, Stripe, Interac, admin) in Coolify
- 2026-10-26 | Claude | claude/coolify-node-build → PR #1 | done: merged b65c550, CI green | Fix Node build (missing Nitro plugin, npm peer-set crash in CI) and /services SSR crash; Coolify preview app on vps2 | owner reviews and merges; preview rebuilds from main; switch ocarinaspa.ca DNS only after owner approval

- 2026-10-14 | GPT-6 (GitHub) | main → direct commit | done | Unblocked CI public Supabase build variables using verified historical anon/browser configuration; kept all server-only credentials out of GitHub source | Watch GitHub Actions npm install, build and package; resolve any failure before enabling deployment

- 2026-10-14 | GPT-6 (GitHub) | main → direct commit | done | Corrected Node/Nitro startup and build scripts, removed obsolete editor build dependency and tracked .env, added GitHub CI packaging and opt-in MochaHost deployment, refreshed deploy docs and Supabase browser config | Configure GitHub Actions variables/secrets; watch build; validate admin QA and payment gates before production rollout

Newest first, one line per piece of work. Rule: `AGENTS.md` › Work log rule.
Format: `YYYY-MM-DD | agent | branch → PR | status | what | next step`

- 2026-10-08 | claude (owner setup) | default branch | done | Added the work log rule, this log and the stop reminder | every agent follows AGENTS.md › Work log rule
