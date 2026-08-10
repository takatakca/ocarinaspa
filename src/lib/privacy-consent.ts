export const PRIVACY_CONSENT_STORAGE_KEY = "ocarina_privacy_consent_v1";

export type PrivacyConsent = {
  version: 1;
  analytics: boolean;
  marketing: boolean;
  decidedAt: string;
};

export function readPrivacyConsent(): PrivacyConsent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PRIVACY_CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PrivacyConsent>;
    if (parsed.version !== 1 || typeof parsed.analytics !== "boolean" || typeof parsed.marketing !== "boolean") return null;
    return {
      version: 1,
      analytics: parsed.analytics,
      marketing: parsed.marketing,
      decidedAt: typeof parsed.decidedAt === "string" ? parsed.decidedAt : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function savePrivacyConsent(input: Pick<PrivacyConsent, "analytics" | "marketing">): PrivacyConsent {
  const value: PrivacyConsent = { version: 1, ...input, decidedAt: new Date().toISOString() };
  if (typeof window !== "undefined") {
    window.localStorage.setItem(PRIVACY_CONSENT_STORAGE_KEY, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent("ocarina:privacy-consent", { detail: value }));
  }
  return value;
}

export function clearPrivacyConsent() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(PRIVACY_CONSENT_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent("ocarina:privacy-consent-reset"));
}
