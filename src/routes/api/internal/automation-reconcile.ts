import { createFileRoute } from "@tanstack/react-router";
import { timingSafeEqual } from "node:crypto";

function secureEquals(a: string, b: string) {
  const aa = Buffer.from(a);
  const bb = Buffer.from(b);
  return aa.length === bb.length && timingSafeEqual(aa, bb);
}

export const Route = createFileRoute("/api/internal/automation-reconcile")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expected = (process.env.AUTOMATION_CRON_SECRET ?? "").trim();
        if (!expected) return Response.json({ error: "Not configured" }, { status: 503 });
        const auth = request.headers.get("authorization") ?? "";
        const supplied = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
        if (!supplied || !secureEquals(supplied, expected)) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { reconcileOperationsCore } = await import("@/lib/operations-reconciler.server");
        try {
          return Response.json({ ok: true, report: await reconcileOperationsCore("system") });
        } catch (error) {
          console.error("[automation-reconcile]", error);
          return Response.json({ error: "Reconciliation failed" }, { status: 500 });
        }
      },
    },
  },
});
