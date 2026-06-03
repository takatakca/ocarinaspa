export const AW_ID = "AW-18182973757";

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

export function gtag(...args: any[]) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag(...args);
  }
}

/** Google Ads conversion — phone call */
export function trackPhoneCall() {
  gtag("event", "conversion", { send_to: AW_ID });
}

/** Google Ads conversion — form submission */
export function trackFormSubmit() {
  gtag("event", "conversion", { send_to: AW_ID });
}

/** Google Ads conversion — quick submission button */
export function trackQuickSubmission() {
  gtag("event", "conversion", { send_to: AW_ID });
}

/** Google Ads conversion — diagnostic AI completed */
export function trackDiagnosticComplete() {
  gtag("event", "conversion", { send_to: AW_ID });
}
