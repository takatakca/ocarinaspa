# Work log

- 2026-11-07 | Codex — ChatGPT Work | codex/sequential-release-20261107 | active | Sequentially reconcile hosting notes and Lovable removal; freeze CI dependencies and verify native release with approved notice retained | Validate candidate and exact main, preserve rollback, record final receipt

- 2026-11-06 | Codex @ ChatGPT Work | fix/notice-match-mielaissa-20261106 → PR #6 | done; deployed on VPS1 | Ocarina notice and static preview match approved Miel Aissa typography, sizing, spacing, card and shared wording; scoped base-layer heading override; live selected computed styles identical (system heading 45px/700, body 17px, button 355px); prelive, production build and CI passed on fd0c363; image notice-style-20261106-matched; rollback saved in notice-style-20261106/docker-compose.before.yaml | Preserve VITE_TAKATAK_MIGRATION_NOTICE_HOME=true on future deployments

- 2026-11-05 | GPT-6 | feat/takatak-migration-notice-20261105 → PR #5 | PR #5 open | Add optional TAKATAK legacy moved notice and static preview to Ocarina Spa without changing existing root by default | Review CI, verify public intake, stage/activate via Coolify only after backup and approval


- 2026-10-26 | Claude | claude/coolify-node-build → PR #1 | PR #1 open | Fix Node build (missing Nitro plugin, npm peer-set crash in CI) and /services SSR crash; Coolify preview app on vps2 | owner reviews and merges; preview rebuilds from main; switch ocarinaspa.ca DNS only after owner approval

- 2026-10-14 | GPT-6 (GitHub) | main → direct commit | done | Unblocked CI public Supabase build variables using verified historical anon/browser configuration; kept all server-only credentials out of GitHub source | Watch GitHub Actions npm install, build and package; resolve any failure before enabling deployment

- 2026-10-14 | GPT-6 (GitHub) | main → direct commit | done | Corrected Node/Nitro startup and build scripts, removed obsolete editor build dependency and tracked .env, added GitHub CI packaging and opt-in MochaHost deployment, refreshed deploy docs and Supabase browser config | Configure GitHub Actions variables/secrets; watch build; validate admin QA and payment gates before production rollout

Newest first, one line per piece of work. Rule: `AGENTS.md` › Work log rule.
Format: `YYYY-MM-DD | agent | branch → PR | status | what | next step`

- 2026-10-08 | claude (owner setup) | default branch | done | Added the work log rule, this log and the stop reminder | every agent follows AGENTS.md › Work log rule