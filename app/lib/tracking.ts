export type ConversionEvent =
  | "cta_consultation"
  | "phone_click"
  | "zalo_click"
  | "form_submit"
  | "form_direct_contact"
  | "chat_open"
  | "chat_message_sent"
  | "project_view";

type TrackingPayload = Record<string, string | number | boolean | undefined>;

type AnalyticsWindow = Window & {
  gtag?: (...args: unknown[]) => void;
};

export function trackEvent(name: ConversionEvent, payload: TrackingPayload = {}) {
  if (typeof window === "undefined") return;

  try {
    window.dispatchEvent(new CustomEvent("dst:conversion", { detail: { name, payload } }));
    (window as AnalyticsWindow).gtag?.("event", name, payload);
  } catch {
    // Analytics must never interrupt navigation or form submission.
  }
}
