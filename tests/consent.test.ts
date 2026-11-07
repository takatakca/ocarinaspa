import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("consent and optional tag behavior without network access", () => {
  let scripts: Array<{ id: string; src: string }>;
  let reload: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    vi.resetModules();
    scripts = [];
    reload = vi.fn();
    const values = new Map<string, string>();
    vi.stubGlobal("window", Object.assign(new EventTarget(), {
      location: { reload },
      localStorage: {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => values.set(key, value),
        removeItem: (key: string) => values.delete(key),
      },
    }));
    vi.stubGlobal("document", {
      getElementById: (id: string) => scripts.find((s) => s.id === id),
      createElement: () => ({ id: "", src: "" }),
      head: { appendChild: (script: { id: string; src: string }) => scripts.push(script) },
    });
    for (const key of ["VITE_GTM_ID", "VITE_META_PIXEL_ID", "VITE_TIKTOK_PIXEL_ID", "VITE_GA4_ID"]) vi.stubEnv(key, "");
  });
  afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.restoreAllMocks(); });

  it("loads nothing before choice or after refusal even with optional IDs configured", async () => {
    vi.stubEnv("VITE_GTM_ID", "GTM-TEST123");
    vi.stubEnv("VITE_META_PIXEL_ID", "123456789");
    vi.stubEnv("VITE_TIKTOK_PIXEL_ID", "TEST123456");
    const { applyConsent } = await import("@/tracking/loadTags");
    const { initializeGoogleTagsForConsent } = await import("@/lib/gtag");
    applyConsent(null);
    const refused = { version: 1 as const, analytics: false, marketing: false, decidedAt: "test" };
    initializeGoogleTagsForConsent(refused);
    applyConsent(refused);
    expect(scripts).toEqual([]);
  });

  it("shares one store, loads Google once and stops tags on withdrawal", async () => {
    const consent = await import("@/consent/consent");
    const { applyConsent } = await import("@/tracking/loadTags");
    const { initializeGoogleTagsForConsent } = await import("@/lib/gtag");
    const seen = vi.fn((next) => {
      if (next) initializeGoogleTagsForConsent(next);
      applyConsent(next);
    });
    const unsubscribe = consent.onConsentChange(seen);
    consent.saveConsent({ analytics: true, marketing: false });
    consent.saveConsent({ analytics: true, marketing: false });
    expect(consent.readConsent()).toMatchObject({ analytics: true, marketing: false });
    expect(scripts).toHaveLength(1);
    expect(scripts[0].src).toContain("gtag/js?id=G-8YYZKVZBW0");
    expect(Object.prototype.toString.call(window.dataLayer?.[0])).toBe("[object Arguments]");
    consent.resetConsent();
    expect(consent.readConsent()).toBeNull();
    expect(seen).toHaveBeenLastCalledWith(null);
    expect(reload).toHaveBeenCalledTimes(1);
    const last = Array.from(window.dataLayer?.at(-1) ?? []);
    expect(last).toEqual(["consent", "update", expect.objectContaining({ analytics_storage: "denied", ad_storage: "denied" })]);
    unsubscribe();
    const count = seen.mock.calls.length;
    consent.saveConsent({ analytics: false, marketing: false });
    expect(seen).toHaveBeenCalledTimes(count);
  });

  it("does not load marketing pixels with analytics-only consent", async () => {
    vi.stubEnv("VITE_META_PIXEL_ID", "123456789");
    vi.stubEnv("VITE_TIKTOK_PIXEL_ID", "TEST123456");
    const { applyConsent } = await import("@/tracking/loadTags");
    applyConsent({ version: 1, analytics: true, marketing: false, decidedAt: "test" });
    expect(scripts).toEqual([]);
    const marketing = { version: 1 as const, analytics: true, marketing: true, decidedAt: "test" };
    applyConsent(marketing);
    applyConsent(marketing);
    expect(scripts.map((s) => s.id)).toEqual(["kit-meta-pixel", "kit-tiktok-pixel"]);
  });

  it("ignores malformed IDs instead of injecting arbitrary script URLs", async () => {
    vi.stubEnv("VITE_GTM_ID", "https://example.invalid/tag.js");
    vi.stubEnv("VITE_META_PIXEL_ID", "not-a-pixel");
    vi.stubEnv("VITE_TIKTOK_PIXEL_ID", "invalid/id");
    const { applyConsent } = await import("@/tracking/loadTags");
    applyConsent({ version: 1, analytics: true, marketing: true, decidedAt: "test" });
    expect(scripts).toEqual([]);
  });
});
