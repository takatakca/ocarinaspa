export const AW_ID = "AW-18182973757";
export const GA4_ID = "G-8YYZKVZBW0";

/**

/**
 * Google Ads conversion labels.
 * Once you create the conversion actions in Google Ads, replace each
 * "REMPLACER_LABEL_ICI" with the real label (the part after the "/").
 * Example: "AW-18182973757/abcDEF123_XYZ"
 *
 * Leave the placeholder as-is to use the fallback event-name tracking.
 */
export const AW_LABELS: Record<EventName, string> = {
  phone_call: "REMPLACER_LABEL_ICI",
  form_submit: "REMPLACER_LABEL_ICI",
  quick_submission: "REMPLACER_LABEL_ICI",
  diagnostic_complete: "REMPLACER_LABEL_ICI",
};

export type EventName =
  | "phone_call"
  | "form_submit"
  | "quick_submission"
  | "diagnostic_complete";

const EVENT_LABELS: Record<EventName, string> = {
  phone_call: "Phone Click",
  form_submit: "Form Submit",
  quick_submission: "Quick Submission",
  diagnostic_complete: "Diagnostic Complete",
};

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
    __ocarinaFiredEvents?: Set<string>;
  }
}

function rawGtag(...args: any[]) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag(...args);
  }
}

export function gtag(...args: any[]) {
  rawGtag(...args);
}

/**
 * Fire a Google Ads / GA4 event.
 * - Always sends a named event (phone_call, form_submit, etc.) which GA4 picks up
 *   automatically as a custom event.
 * - If a real Google Ads label is configured, also sends the "conversion" event
 *   with the proper send_to value.
 * - Dedupes per page load so a single click never fires twice.
 */
function trackEvent(name: EventName, opts?: { dedupeKey?: string }) {
  if (typeof window === "undefined") return;

  const key = opts?.dedupeKey ?? name;
  window.__ocarinaFiredEvents = window.__ocarinaFiredEvents ?? new Set<string>();
  if (window.__ocarinaFiredEvents.has(key)) return;
  window.__ocarinaFiredEvents.add(key);

  const label = AW_LABELS[name];
  const hasRealLabel = label && label !== "REMPLACER_LABEL_ICI";

  if (hasRealLabel) {
    rawGtag("event", "conversion", {
      send_to: `${AW_ID}/${label}`,
      event_category: "Ocarina Spa",
      event_label: EVENT_LABELS[name],
    });
  }

  // Always send the named event (works as fallback before labels are set,
  // and remains useful for GA4 + Tag Assistant debugging).
  rawGtag("event", name, {
    event_category: "Ocarina Spa",
    event_label: EVENT_LABELS[name],
  });
}

/** Google Ads conversion — phone call */
export function trackPhoneCall() {
  // Dedupe by timestamp bucket so repeated calls in same second are collapsed,
  // but a later genuine click still fires.
  trackEvent("phone_call", { dedupeKey: `phone_call:${Math.floor(Date.now() / 1000)}` });
}

/** Google Ads conversion — form submission */
export function trackFormSubmit() {
  trackEvent("form_submit", { dedupeKey: `form_submit:${Date.now()}` });
}

/** Google Ads conversion — quick submission button */
export function trackQuickSubmission() {
  trackEvent("quick_submission", { dedupeKey: `quick_submission:${Math.floor(Date.now() / 1000)}` });
}

/** Google Ads conversion — diagnostic AI completed */
export function trackDiagnosticComplete() {
  trackEvent("diagnostic_complete", { dedupeKey: `diagnostic_complete:${Date.now()}` });
}
