import { getRequest } from "@tanstack/react-start/server";

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function requestFingerprintSeed() {
  const request = getRequest();
  const forwarded = request?.headers?.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request?.headers?.get("x-real-ip")?.trim();
  const userAgent = request?.headers?.get("user-agent") ?? "unknown";
  return `${forwarded || realIp || "unknown"}|${userAgent}`;
}

/** Durable DB-backed rate limit. Returns false when the bucket is exhausted. */
export async function consumePublicRateLimit(
  action: string,
  limit: number,
  windowSeconds: number,
  identityHint?: string,
) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const seed = `${action}|${requestFingerprintSeed()}|${identityHint ?? ""}`;
  const bucketKey = `${action}:${await sha256(seed)}`;
  const { data, error } = await supabaseAdmin.rpc("consume_rate_limit" as any, {
    p_bucket_key: bucketKey,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  } as any);
  if (error) {
    console.error("[rate-limit] RPC failed", error.message);
    // Sensitive public flows fail closed. If the hardening migration is missing or the
    // database is unavailable, do not silently remove abuse protection.
    return false;
  }
  return Boolean(data);
}

export async function enforcePublicRateLimit(
  action: string,
  options: { limit: number; windowSeconds: number; identityHint?: string },
) {
  const allowed = await consumePublicRateLimit(
    action,
    options.limit,
    options.windowSeconds,
    options.identityHint,
  );
  if (!allowed) {
    throw new Response("Trop de demandes. Réessayez plus tard.", { status: 429 });
  }
}
