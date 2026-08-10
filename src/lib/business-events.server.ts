/**
 * Server-only operational memory for Ocarina Spa.
 * Every important customer/payment/admin action can be replayed from this immutable timeline.
 */
export type BusinessEventInput = {
  entityType: string;
  entityId: string;
  eventType: string;
  actorType?: "system" | "customer" | "admin" | "stripe" | "automation";
  actorId?: string | null;
  correlationId?: string | null;
  payload?: Record<string, unknown>;
};

export async function appendBusinessEvent(input: BusinessEventInput) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin.from("business_events" as any).insert({
    entity_type: input.entityType,
    entity_id: input.entityId,
    event_type: input.eventType,
    actor_type: input.actorType ?? "system",
    actor_id: input.actorId ?? null,
    correlation_id: input.correlationId ?? null,
    payload: input.payload ?? {},
  } as any);
  if (error) {
    // Logging must never break the customer/payment flow.
    console.error("[business-events] append failed", error.message);
  }
}
