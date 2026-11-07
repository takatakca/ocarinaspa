import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { enqueueTransactionalEmail } from "@/lib/email-queue.server";

const message = { to: "test@example.invalid", subject: "Test", html: "<p>Test</p>", text: "Test" };
describe("transactional email delivery result", () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("EMAIL_FROM", "Test <test@example.invalid>");
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.restoreAllMocks(); fetchMock.mockReset(); });
  it("does not pretend to queue an email when Resend is not configured", async () => {
    expect(await enqueueTransactionalEmail(message)).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("returns delivery success only for a successful mocked provider response", async () => {
    vi.stubEnv("RESEND_API_KEY", "unit-test-placeholder");
    fetchMock.mockResolvedValue(new Response('{"id":"test"}', { status: 200 }));
    expect(await enqueueTransactionalEmail(message)).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, request] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    expect(JSON.parse(request.body)).toMatchObject({ to: [message.to], from: "Test <test@example.invalid>" });
  });
  it.each([401, 429, 500])("reports provider HTTP %s without logging the body", async (status) => {
    vi.stubEnv("RESEND_API_KEY", "unit-test-placeholder");
    fetchMock.mockResolvedValue(new Response("PRIVATE_PROVIDER_BODY", { status }));
    expect(await enqueueTransactionalEmail(message)).toBe(false);
    expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain("PRIVATE_PROVIDER_BODY");
  });
  it("reports a network failure as undelivered", async () => {
    vi.stubEnv("RESEND_API_KEY", "unit-test-placeholder");
    fetchMock.mockRejectedValue(new Error("network unavailable"));
    expect(await enqueueTransactionalEmail(message)).toBe(false);
  });
});
