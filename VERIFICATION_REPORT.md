# OcarinaSpa.ca — Google Tag / Maps Verification Report

## Fixed

- Google Ads ID remains: `AW-18182973757`.
- GA4 Measurement ID remains: `G-8YYZKVZBW0`.
- `src/routes/__root.tsx` now loads **one** Google tag loader and configures **both** Google Ads and GA4 in the same `gtag` instance.
- Google Tag script has a stable ID: `ocarina-google-tag`.
- Google Maps API key is **not hardcoded** in the source. The Store Locator uses `VITE_GOOGLE_MAPS_API_KEY` from environment variables, with a safe no-key fallback embed.
- `.env` and `.env.*` are now ignored in `.gitignore`; only `.env.example` should be committed.
- Tracking documentation updated in `GOOGLE_ADS_TRACKING.md`.

## Static verification performed

Commands/checks used:

```bash
grep -R "googletagmanager.com/gtag/js" -n src
grep -R "gtag('config'" -n src GOOGLE_ADS_TRACKING.md
grep -R "AW-18182973757\|G-8YYZKVZBW0" -n src
grep -R "GOOGLE_MAPS_KEY_PATTERN|mapsApiKey" -n . --exclude-dir=node_modules
```

Results:

- Exactly one `gtag.js` loader found in `src/routes/__root.tsx`.
- Both Google destinations are configured:
  - `AW-18182973757`
  - `G-8YYZKVZBW0`
- No hardcoded Google Maps browser key was present in the source after verification.

## Build note

I attempted to run the local build, but dependencies were not installed in the uploaded ZIP. `npm ci` could not run because `package-lock.json` is not synchronized with `package.json`. `npm install`/lock regeneration was blocked in this environment by package registry download issues. On your deployment machine, run:

```bash
npm install
npm run build
```

If your deployment uses `npm ci`, regenerate and commit a fresh `package-lock.json` first:

```bash
rm package-lock.json
npm install
npm run build
```

## Live verification to do after deploy

- Open Google Tag Assistant.
- Test `https://ocarinaspa.ca`.
- Confirm `AW-18182973757` loads.
- Confirm `G-8YYZKVZBW0` is receiving events in GA4 Realtime.
- Test these actions:
  - phone click = `phone_call`
  - service form success = `form_submit`
  - quick submission click = `quick_submission`
  - diagnostic result = `diagnostic_complete`
