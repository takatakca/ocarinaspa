import { readPrivacyConsent, type PrivacyConsent } from "@/lib/privacy-consent";
export const AW_ID = "AW-18182973757";
export const GA4_ID = "G-8YYZKVZBW0";

export type EventName =
  | "phone_call"
  | "form_submit"
  | "quick_submission"
  | "diagnostic_lead_submit"
  | "diagnostic_complete"
  | "invoice_payment_page_view"
  | "invoice_lookup"
  | "invoice_found"
  | "invoice_pay_click"
  | "invoice_paid"
  | "invoice_interac_selected"
  | "invoice_interac_received"
  | "post_payment_rating_started"
  | "post_payment_rating_submitted"
  | "google_review_prompt_shown"
  | "google_review_click"
  | "low_rating_followup_created"
  | "survey_started"
  | "survey_submitted"
  | "credit_issued"
  | "facebook_follow_click"
  | "service_question_submitted"
  | "admin_invoice_created";

/**
 * Google Ads conversion labels are public identifiers, but they are account-specific.
 * Never invent them. GA4 named events keep working when a label is absent.
 */
const env = (import.meta as any).env ?? {};
const adsLabel = (key: string) => String(env[key] ?? "").trim();
export const AW_LABELS: Record<EventName, string> = {
  phone_call: adsLabel("VITE_AW_LABEL_PHONE_CALL"),
  form_submit: adsLabel("VITE_AW_LABEL_FORM_SUBMIT"),
  quick_submission: adsLabel("VITE_AW_LABEL_QUICK_SUBMISSION"),
  diagnostic_lead_submit: adsLabel("VITE_AW_LABEL_DIAGNOSTIC_LEAD"),
  diagnostic_complete: adsLabel("VITE_AW_LABEL_DIAGNOSTIC_COMPLETE"),
  invoice_payment_page_view: adsLabel("VITE_AW_LABEL_INVOICE_PAGE_VIEW"),
  invoice_lookup: adsLabel("VITE_AW_LABEL_INVOICE_LOOKUP"),
  invoice_found: adsLabel("VITE_AW_LABEL_INVOICE_FOUND"),
  invoice_pay_click: adsLabel("VITE_AW_LABEL_INVOICE_PAY_CLICK"),
  invoice_paid: adsLabel("VITE_AW_LABEL_INVOICE_PAID"),
  invoice_interac_selected: adsLabel("VITE_AW_LABEL_INTERAC_SELECTED"),
  invoice_interac_received: adsLabel("VITE_AW_LABEL_INTERAC_RECEIVED"),
  post_payment_rating_started: adsLabel("VITE_AW_LABEL_RATING_STARTED"),
  post_payment_rating_submitted: adsLabel("VITE_AW_LABEL_RATING_SUBMITTED"),
  google_review_prompt_shown: adsLabel("VITE_AW_LABEL_REVIEW_PROMPT"),
  google_review_click: adsLabel("VITE_AW_LABEL_REVIEW_CLICK"),
  low_rating_followup_created: adsLabel("VITE_AW_LABEL_LOW_RATING_FOLLOWUP"),
  survey_started: adsLabel("VITE_AW_LABEL_SURVEY_STARTED"),
  survey_submitted: adsLabel("VITE_AW_LABEL_SURVEY_SUBMITTED"),
  credit_issued: adsLabel("VITE_AW_LABEL_CREDIT_ISSUED"),
  facebook_follow_click: adsLabel("VITE_AW_LABEL_FACEBOOK_FOLLOW"),
  service_question_submitted: adsLabel("VITE_AW_LABEL_SERVICE_QUESTION"),
  admin_invoice_created: adsLabel("VITE_AW_LABEL_ADMIN_INVOICE_CREATED"),
};

const EVENT_LABELS: Record<EventName, string> = {
  phone_call: "Phone Click",
  form_submit: "Form Submit",
  quick_submission: "Quick Submission",
  diagnostic_lead_submit: "Diagnostic Lead Submit",
  diagnostic_complete: "Diagnostic Complete",
  invoice_payment_page_view: "Invoice Payment Page View",
  invoice_lookup: "Invoice Lookup",
  invoice_found: "Invoice Found",
  invoice_pay_click: "Invoice Pay Click",
  invoice_paid: "Invoice Paid",
  invoice_interac_selected: "Invoice Interac Selected",
  invoice_interac_received: "Invoice Interac Received",
  post_payment_rating_started: "Post Payment Rating Started",
  post_payment_rating_submitted: "Post Payment Rating Submitted",
  google_review_prompt_shown: "Google Review Prompt Shown",
  google_review_click: "Google Review Click",
  low_rating_followup_created: "Low Rating Followup Created",
  survey_started: "Survey Started",
  survey_submitted: "Survey Submitted",
  credit_issued: "Credit Issued",
  facebook_follow_click: "Facebook Follow Click",
  service_question_submitted: "Service Question Submitted",
  admin_invoice_created: "Admin Invoice Created",
};

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
    __ocarinaFiredEvents?: Set<string>;
    __ocarinaGoogleTagsConfigured?: { analytics: boolean; marketing: boolean };
  }
}

function rawGtag(...args: any[]) {
  if (typeof window !== "undefined" && window.gtag) window.gtag(...args);
}

function ensureGtagFunction() {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer ?? [];
  if (!window.gtag) window.gtag = (...args: any[]) => window.dataLayer?.push(args);
}

/** Google tags are not requested from Google until the visitor opts in. */
export function initializeGoogleTagsForConsent(consent: Pick<PrivacyConsent, "analytics" | "marketing">) {
  if (typeof window === "undefined") return;

  if (!consent.analytics && !consent.marketing) {
    if (window.gtag) {
      rawGtag("consent", "update", { analytics_storage: "denied", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
    }
    window.__ocarinaGoogleTagsConfigured = { analytics: false, marketing: false };
    return;
  }

  ensureGtagFunction();
  rawGtag("consent", "default", {
    analytics_storage: consent.analytics ? "granted" : "denied",
    ad_storage: consent.marketing ? "granted" : "denied",
    ad_user_data: consent.marketing ? "granted" : "denied",
    ad_personalization: consent.marketing ? "granted" : "denied",
  });

  if (!document.getElementById("ocarina-google-tag-loader")) {
    const script = document.createElement("script");
    script.id = "ocarina-google-tag-loader";
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${consent.marketing ? AW_ID : GA4_ID}`;
    document.head.appendChild(script);
    rawGtag("js", new Date());
  }

  const previous = window.__ocarinaGoogleTagsConfigured;
  if (consent.analytics && !previous?.analytics) rawGtag("config", GA4_ID);
  if (consent.marketing && !previous?.marketing) rawGtag("config", AW_ID);
  rawGtag("consent", "update", {
    analytics_storage: consent.analytics ? "granted" : "denied",
    ad_storage: consent.marketing ? "granted" : "denied",
    ad_user_data: consent.marketing ? "granted" : "denied",
    ad_personalization: consent.marketing ? "granted" : "denied",
  });
  window.__ocarinaGoogleTagsConfigured = { analytics: consent.analytics, marketing: consent.marketing };
}

export function gtag(...args: any[]) {
  rawGtag(...args);
}

function trackEvent(name: EventName, opts?: { dedupeKey?: string; params?: Record<string, any> }) {
  if (typeof window === "undefined") return;
  const consent = readPrivacyConsent();
  if (!consent || (!consent.analytics && !consent.marketing)) return;

  const key = opts?.dedupeKey ?? name;
  window.__ocarinaFiredEvents = window.__ocarinaFiredEvents ?? new Set<string>();
  if (window.__ocarinaFiredEvents.has(key)) return;
  window.__ocarinaFiredEvents.add(key);

  initializeGoogleTagsForConsent(consent);

  const label = AW_LABELS[name];
  if (consent.marketing && label) {
    rawGtag("event", "conversion", {
      send_to: `${AW_ID}/${label}`,
      event_category: "Ocarina Spa",
      event_label: EVENT_LABELS[name],
      ...(opts?.params ?? {}),
    });
  }
  if (consent.analytics) {
    rawGtag("event", name, {
      event_category: "Ocarina Spa",
      event_label: EVENT_LABELS[name],
      ...(opts?.params ?? {}),
    });
  }
}

export function trackPhoneCall() {
  trackEvent("phone_call", { dedupeKey: `phone_call:${Math.floor(Date.now() / 1000)}` });
}
export function trackFormSubmit() {
  trackEvent("form_submit", { dedupeKey: `form_submit:${Date.now()}` });
}
export function trackQuickSubmission() {
  trackEvent("quick_submission", { dedupeKey: `quick_submission:${Math.floor(Date.now() / 1000)}` });
}
export function trackDiagnosticComplete() {
  trackEvent("diagnostic_complete", { dedupeKey: `diagnostic_complete:${Date.now()}` });
}
export function trackDiagnosticLeadSubmit() {
  trackEvent("diagnostic_lead_submit", { dedupeKey: `diagnostic_lead_submit:${Date.now()}` });
}
export function trackInvoicePageView() {
  trackEvent("invoice_payment_page_view", { dedupeKey: "invoice_payment_page_view" });
}
export function trackInvoiceLookup() {
  trackEvent("invoice_lookup", { dedupeKey: `invoice_lookup:${Date.now()}` });
}
export function trackInvoiceFound() {
  trackEvent("invoice_found", { dedupeKey: `invoice_found:${Date.now()}` });
}
export function trackInvoicePayClick() {
  trackEvent("invoice_pay_click", { dedupeKey: `invoice_pay_click:${Date.now()}` });
}
export function trackInvoicePaid() {
  trackEvent("invoice_paid", { dedupeKey: `invoice_paid:${Date.now()}` });
}
export function trackInteracSelected() {
  trackEvent("invoice_interac_selected", { dedupeKey: `interac_sel:${Date.now()}` });
}
export function trackInteracReceived() {
  trackEvent("invoice_interac_received", { dedupeKey: `interac_recv:${Date.now()}` });
}
export function trackPostPaymentRatingStarted() {
  trackEvent("post_payment_rating_started", { dedupeKey: "post_payment_rating_started" });
}
export function trackPostPaymentRatingSubmitted(rating: number) {
  trackEvent("post_payment_rating_submitted", {
    dedupeKey: `rating:${Date.now()}`,
    params: { rating },
  });
}
export function trackGoogleReviewPromptShown() {
  trackEvent("google_review_prompt_shown", { dedupeKey: "google_review_prompt_shown" });
}
export function trackGoogleReviewClick() {
  trackEvent("google_review_click", { dedupeKey: `google_review_click:${Date.now()}` });
}
export function trackLowRatingFollowupCreated() {
  trackEvent("low_rating_followup_created", { dedupeKey: `low_rating:${Date.now()}` });
}
export function trackSurveyStarted() {
  trackEvent("survey_started", { dedupeKey: "survey_started" });
}
export function trackSurveySubmitted() {
  trackEvent("survey_submitted", { dedupeKey: `survey_submitted:${Date.now()}` });
}
export function trackCreditIssued(valueCents?: number) {
  trackEvent("credit_issued", {
    dedupeKey: `credit_issued:${Date.now()}`,
    params: valueCents != null ? { value: valueCents / 100, currency: "CAD" } : undefined,
  });
}
export function trackFacebookFollowClick() {
  trackEvent("facebook_follow_click", { dedupeKey: `facebook_follow:${Date.now()}` });
}
export function trackServiceQuestionSubmitted() {
  trackEvent("service_question_submitted", { dedupeKey: `service_question:${Date.now()}` });
}
