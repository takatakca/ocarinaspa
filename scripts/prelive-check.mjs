import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
let failed = 0;
const pass = (m) => console.log(`PASS  ${m}`);
const warn = (m) => console.log(`WARN  ${m}`);
const fail = (m) => { failed++; console.error(`FAIL  ${m}`); };
const exists = (p) => fs.existsSync(path.join(root, p));
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

console.log('Ocarina Spa — static pre-live gate\n');

// Deployment contract
const pkg = JSON.parse(read('package.json'));
pkg.scripts?.start === 'node .output/server/index.mjs'
  ? pass('production start points to .output/server/index.mjs')
  : fail('production start command is not aligned with Node/Nitro output');
exists('vite.config.node.ts') ? pass('Node build config exists') : fail('vite.config.node.ts missing');
exists('server.cjs') ? fail('obsolete server.cjs is present') : pass('no obsolete server.cjs entrypoint');
exists('bun.lockb') ? fail('stale bun.lockb can override npm dependency resolution') : pass('npm is the only lockfile strategy');
exists('wrangler.jsonc') ? fail('stale Cloudflare wrangler config is present in Node release') : pass('no stale Cloudflare wrangler deployment config');

// Lockfile sanity. This audited archive intentionally removes the original stale lockfile.
// The deployment runner must generate a fresh lock from package.json, then CI should use npm ci.
if (!exists('package-lock.json')) {
  warn('package-lock.json is intentionally absent because the uploaded lockfile was stale; run npm install once in the real dependency registry and commit the regenerated lock before production CI');
} else {
  try {
    const lock = JSON.parse(read('package-lock.json'));
    const lockRoot = lock.packages?.[''] ?? {};
    const a = JSON.stringify(pkg.dependencies ?? {});
    const b = JSON.stringify(lockRoot.dependencies ?? {});
    const c = JSON.stringify(pkg.devDependencies ?? {});
    const d = JSON.stringify(lockRoot.devDependencies ?? {});
    a === b && c === d ? pass('package.json and package-lock root dependencies agree') : fail('package-lock root dependencies are stale');
    for (const dep of [...Object.keys(pkg.dependencies ?? {}), ...Object.keys(pkg.devDependencies ?? {})]) {
      const key = `node_modules/${dep}`;
      lock.packages?.[key] ? null : fail(`package-lock is missing installed metadata for root dependency ${dep}`);
    }
  } catch (e) {
    fail(`package-lock.json cannot be validated: ${e.message}`);
  }
}

// Required production hardening
const migration = 'supabase/migrations/20260809090000_pre_live_hardening.sql';
exists(migration) ? pass('pre-live Supabase hardening migration exists') : fail('pre-live hardening migration missing');
for (const marker of ['payment_experience_tokens','stripe_webhook_events','business_events','automation_tasks','consume_rate_limit']) {
  read(migration).includes(marker) ? pass(`migration contains ${marker}`) : fail(`migration missing ${marker}`);
}

const creditMigration = 'supabase/migrations/20260809120000_credit_redemption.sql';
exists(creditMigration) ? pass('store-credit redemption migration exists') : fail('store-credit redemption migration missing');
for (const marker of ['claim_customer_credit','release_customer_credit','consume_customer_credit']) {
  exists(creditMigration) && read(creditMigration).includes(marker) ? pass(`credit migration contains ${marker}`) : fail(`credit migration missing ${marker}`);
}

const refundMigration = 'supabase/migrations/20260809134500_refund_reconciliation.sql';
exists(refundMigration) ? pass('refund reconciliation migration exists') : fail('refund reconciliation migration missing');
for (const marker of ['refunded_cents','refund_status','refunded_at']) {
  exists(refundMigration) && read(refundMigration).includes(marker) ? pass(`refund migration contains ${marker}`) : fail(`refund migration missing ${marker}`);
}
const webhookSource = read('src/routes/api/public/stripe-webhook.ts');
webhookSource.includes('charge.refunded') ? pass('Stripe refund webhook reconciliation is wired') : fail('Stripe refund reconciliation is missing');

const lockdownMigration = 'supabase/migrations/20260809133000_public_write_lockdown.sql';
exists(lockdownMigration) ? pass('public-write lockdown migration exists') : fail('public-write lockdown migration missing');
for (const table of ['service_requests','contact_messages','diagnostic_leads','service_questions']) {
  const txt = exists(lockdownMigration) ? read(lockdownMigration) : '';
  txt.includes(`REVOKE INSERT ON public.${table}`) ? pass(`direct public INSERT locked down for ${table}`) : fail(`public INSERT lockdown missing for ${table}`);
}

// Google tag + Quebec privacy consent contract
const rootRoute = read('src/routes/__root.tsx');
const gtag = read('src/lib/gtag.ts');
const directRootLoaders = rootRoute.match(/googletagmanager\.com\/gtag\/js/g) ?? [];
directRootLoaders.length === 0 ? pass('Google tags are not loaded directly before consent') : fail('Google tags still load directly in root before consent');
(gtag.match(/googletagmanager\.com\/gtag\/js/g) ?? []).length === 1 ? pass('one consent-gated gtag.js loader exists') : fail('consent-gated Google tag loader is missing or duplicated');
rootRoute.includes('PrivacyConsentBanner') ? pass('privacy consent UI is mounted globally') : fail('privacy consent UI is not mounted globally');
exists('src/routes/confidentialite.tsx') ? pass('privacy policy route exists') : fail('privacy policy route missing');
gtag.includes('AW-18182973757') ? pass('Google Ads global ID present') : fail('Google Ads global ID missing');
gtag.includes('G-8YYZKVZBW0') ? pass('GA4 measurement ID present') : fail('GA4 measurement ID missing');

gtag.includes('REMPLACER_LABEL_ICI') ? fail('placeholder Google Ads conversion label remains') : pass('no placeholder Google Ads conversion labels');

// Secrets in public source tree. Publishable/browser IDs are intentionally excluded.
const secretPatterns = [
  /sk_(?:live|test)_[A-Za-z0-9]{16,}/g,
  /whsec_[A-Za-z0-9]{12,}/g,
  /SUPABASE_SERVICE_ROLE_KEY\s*[:=]\s*["'][^"']+["']/g,
];
const textExt = new Set(['.ts','.tsx','.js','.jsx','.json','.html','.css','.md']);
const scanDirs = ['src','public'];
let secretHits = [];
function walk(dir) {
  const abs = path.join(root, dir);
  if (!fs.existsSync(abs)) return;
  for (const e of fs.readdirSync(abs, { withFileTypes: true })) {
    const rel = path.join(dir, e.name);
    if (e.isDirectory()) walk(rel);
    else if (textExt.has(path.extname(e.name).toLowerCase())) {
      const txt = fs.readFileSync(path.join(root, rel), 'utf8');
      for (const re of secretPatterns) {
        re.lastIndex = 0;
        if (re.test(txt)) secretHits.push(rel);
      }
    }
  }
}
for (const d of scanDirs) walk(d);
secretHits.length ? fail(`secret-like values found in public/source files: ${[...new Set(secretHits)].join(', ')}`) : pass('no Stripe/webhook/service-role secret values found in src/public');

// Route + automation/memory contract
const routeTree = read('src/routeTree.gen.ts');
for (const r of ['/admin/automation','/admin/historique','/admin/qa','/admin/factures','/admin/experience','/api/internal/automation-reconcile','/es','/confidentialite']) {
  routeTree.includes(`'${r}'`) ? pass(`route tree includes ${r}`) : fail(`route tree missing ${r}`);
}

for (const f of [
  'src/lib/business-events.server.ts',
  'src/lib/admin-automation.functions.ts',
  'src/lib/admin-memory.functions.ts',
  'src/lib/invoice-security.server.ts',
  'src/lib/public-security.server.ts',
  'src/lib/operations-reconciler.server.ts',
]) {
  exists(f) ? pass(`${f} exists`) : fail(`${f} missing`);
}

const sitemap = read('src/routes/sitemap[.]xml.tsx');
sitemap.includes('ocarinaspa.lovable.app') ? fail('sitemap still points at Lovable preview domain') : pass('sitemap uses production domain');
const authRoute = read('src/routes/auth.tsx');
authRoute.includes('signUp(') ? fail('public admin self-signup remains enabled') : pass('admin auth is sign-in only in production source');
const security = read('src/lib/public-security.server.ts');
security.includes('return false;') && security.includes('enforcePublicRateLimit') ? pass('sensitive public rate limiting fails closed') : fail('public rate limiting is not fail-closed');

// Static content guardrails
const brandImages = read('src/data/brandImages.ts');
brandImages.includes('BRAND_IMAGES') && brandImages.includes('Only map a brand to its own asset')
  ? pass('brand image mapping explicitly prohibits cross-brand fallbacks')
  : warn('brand image mapping guardrail comment/structure not detected');


const citySeo = read('src/data/quebecMunicipalities.ts');
citySeo.includes('isSeoIndexedServicePage') ? pass('city/service SEO indexing is explicitly gated') : fail('city/service SEO indexing gate missing');
const llms = read('public/llms.txt');
/partout au Québec|toutes les régions|17 régions/i.test(llms) ? fail('llms.txt still overclaims province-wide coverage') : pass('llms.txt uses bounded service-area claims');
const confirmRoute = read('src/routes/paiement-confirme.tsx');
confirmRoute.includes('trackInvoicePaid') ? pass('invoice_paid analytics event is wired after payment confirmation') : fail('invoice_paid analytics event is not wired');
const reconciler = read('src/lib/operations-reconciler.server.ts');
reconciler.includes('post_payment_followup') ? pass('operations reconciler covers post-payment follow-up') : fail('operations reconciler follow-up recovery missing');

// Real production values cannot be validated statically.
console.log('\nRuntime checks still required in /admin/qa: Stripe account match/live mode, webhook secret, taxes, Interac, official review/social URLs, hardening migration.');

if (failed) {
  console.error(`\nPRE-LIVE STATIC GATE: FAILED (${failed} blocker${failed === 1 ? '' : 's'})`);
  process.exit(1);
}
console.log('\nPRE-LIVE STATIC GATE: PASS');
