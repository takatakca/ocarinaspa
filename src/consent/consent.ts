/**
 * SEO + consent kit: visitor's cookie choice (Québec Law 25), Ocarina adapter.
 *
 * Ocarina already has ONE consent store (src/lib/privacy-consent.ts) and ONE banner
 * (src/components/PrivacyConsentBanner.tsx). This file only exposes that store with the kit API,
 * so kit files (ManageCookiesLink, tracking/loadTags) share the same choice. No second store.
 * Stored in this browser only: categories, version and date. No name, no email.
 */
import {
  PRIVACY_CONSENT_EVENT,
  PRIVACY_CONSENT_RESET_EVENT,
  PRIVACY_CONSENT_STORAGE_KEY,
  clearPrivacyConsent,
  readPrivacyConsent,
  savePrivacyConsent,
  type PrivacyConsent,
} from "@/lib/privacy-consent";

export const CONSENT_VERSION = 1;
export const CONSENT_STORAGE_KEY = PRIVACY_CONSENT_STORAGE_KEY;
export const CONSENT_EVENT = PRIVACY_CONSENT_EVENT;

/** analytics = Google Analytics 4 / Tag Manager; marketing = Google Ads, Meta Pixel, TikTok Pixel. */
export type Consent = PrivacyConsent;

export function readConsent(): Consent | null {
  return readPrivacyConsent();
}

export function saveConsent(choice: { analytics: boolean; marketing: boolean }): Consent {
  return savePrivacyConsent(choice);
}

/** "Gérer mes témoins": forget the choice and show the banner again. */
export function resetConsent() {
  clearPrivacyConsent();
}

export function onConsentChange(cb: (consent: Consent | null) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const saved = (e: Event) => cb((e as CustomEvent<Consent | null>).detail ?? null);
  const reset = () => cb(null);
  window.addEventListener(PRIVACY_CONSENT_EVENT, saved);
  window.addEventListener(PRIVACY_CONSENT_RESET_EVENT, reset);
  return () => {
    window.removeEventListener(PRIVACY_CONSENT_EVENT, saved);
    window.removeEventListener(PRIVACY_CONSENT_RESET_EVENT, reset);
  };
}
