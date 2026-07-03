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
 * Google Ads conversion labels — replace "REMPLACER_LABEL_ICI" once the
 * matching conversion action exists in Google Ads. Missing labels are safe:
 * the named event still fires for GA4.
 */
export const AW_LABELS: Record<EventName, string> = {
  phone_call: "REMPLACER_LABEL_ICI",
  form_submit: "REMPLACER_LABEL_ICI",
  quick_submission: "REMPLACER_LABEL_ICI",
  diagnostic_lead_submit: "REMPLACER_LABEL_ICI",
  diagnostic_complete: "REMPLACER_LABEL_ICI",
  invoice_payment_page_view: "REMPLACER_LABEL_ICI",
  invoice_lookup: "REMPLACER_LABEL_ICI",
  invoice_found: "REMPLACER_LABEL_ICI",
  invoice_pay_click: "REMPLACER_LABEL_ICI",
  invoice_paid: "REMPLACER_LABEL_ICI",
  invoice_interac_selected: "REMPLACER_LABEL_ICI",
  invoice_interac_received: "REMPLACER_LABEL_ICI",
  post_payment_rating_started: "REMPLACER_LABEL_ICI",
  post_payment_rating_submitted: "REMPLACER_LABEL_ICI",
  google_review_prompt_shown: "REMPLACER_LABEL_ICI",
  google_review_click: "REMPLACER_LABEL_ICI",
  low_rating_followup_created: "REMPLACER_LABEL_ICI",
  survey_started: "REMPLACER_LABEL_ICI",
  survey_submitted: "REMPLACER_LABEL_ICI",
  credit_issued: "REMPLACER_LABEL_ICI",
  facebook_follow_click: "REMPLACER_LABEL_ICI",
  service_question_submitted: "REMPLACER_LABEL_ICI",
  admin_invoice_created: "REMPLACER_LABEL_ICI",
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
  }
}

function rawGtag(...args: any[]) {
  if (typeof window !== "undefined" && window.gtag) window.gtag(...args);
}

export function gtag(...args: any[]) {
  rawGtag(...args);
}

function trackEvent(name: EventName, opts?: { dedupeKey?: string; params?: Record<string, any> }) {
  if (typeof window === "undefined") return;
  const key = opts?.dedupeKey ?? name;
  window.__ocarinaFiredEvents = window.__ocarinaFiredEvents ?? new Set<string>();
  if (window.__ocarinaFiredEvents.has(key)) return;
  window.__ocarinaFiredEvents.add(key);

  const label = AW_LABELS[name];
  if (label && label !== "REMPLACER_LABEL_ICI") {
    rawGtag("event", "conversion", {
      send_to: `${AW_ID}/${label}`,
      event_category: "Ocarina Spa",
      event_label: EVENT_LABELS[name],
      ...(opts?.params ?? {}),
    });
  }
  rawGtag("event", name, {
    event_category: "Ocarina Spa",
    event_label: EVENT_LABELS[name],
    ...(opts?.params ?? {}),
  });
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
