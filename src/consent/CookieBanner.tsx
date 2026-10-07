/**
 * SEO + consent kit: cookie banner (Québec Law 25), Ocarina adapter.
 * Ocarina keeps its existing banner (src/components/PrivacyConsentBanner.tsx, mounted once in
 * src/routes/__root.tsx). This alias only keeps the kit file name; never mount a second banner.
 */
export { PrivacyConsentBanner as CookieBanner } from "@/components/PrivacyConsentBanner";
