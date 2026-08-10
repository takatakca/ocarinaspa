import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error || !data) throw new Response("Forbidden: admin only", { status: 403 });
}

export type BusinessEventRow = {
  id: string;
  entity_type: string;
  entity_id: string;
  event_type: string;
  actor_type: string;
  actor_id: string | null;
  correlation_id: string | null;
  payload: Record<string, unknown>;
  created_at: string;
};

export const listBusinessEvents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ entityType: z.string().max(80).optional(), entityId: z.string().max(200).optional() }).parse(d ?? {}),
  )
  .handler(async ({ data, context }): Promise<BusinessEventRow[]> => {
    await assertAdmin(context);
    let query = context.supabase
      .from("business_events" as any)
      .select("id, entity_type, entity_id, event_type, actor_type, actor_id, correlation_id, payload, created_at")
      .order("created_at", { ascending: false })
      .limit(250);
    if (data.entityType) query = query.eq("entity_type", data.entityType);
    if (data.entityId) query = query.eq("entity_id", data.entityId);
    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    return (rows ?? []) as BusinessEventRow[];
  });

export type OperationalMemorySearchResult = {
  invoices: Array<{
    id: string;
    stripe_invoice_id: string;
    invoice_number: string | null;
    customer_name: string | null;
    customer_email: string | null;
    customer_phone: string | null;
    description: string | null;
    amount_cents: number;
    currency: string;
    status: string;
    payment_method: string | null;
    paid_at: string | null;
    created_at: string;
  }>;
  requests: ServiceRequestMemoryRow[];
  diagnostics: DiagnosticMemoryRow[];
  tasks: AutomationMemoryRow[];
  events: BusinessEventRow[];
};


type ServiceRequestMemoryRow = {
  id: string;
  created_at: string;
  full_name: string;
  phone: string;
  email: string;
  city: string | null;
  service_type: string;
  spa_brand: string | null;
  spa_model: string | null;
  problem_description: string | null;
  urgency: string | null;
  status: string;
};

type DiagnosticMemoryRow = {
  id: string;
  created_at: string;
  full_name: string;
  phone: string;
  email: string;
  city: string;
  brand: string;
  model: string | null;
  error_code: string | null;
  problem_description: string;
  ai_diagnostic: string | null;
  ai_urgency: string | null;
  status: string;
};

type AutomationMemoryRow = {
  id: string;
  task_type: string;
  status: string;
  instruction: string | null;
  input: Record<string, unknown> | null;
  output: Record<string, unknown> | null;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
};

function searchable(value: unknown) {
  return JSON.stringify(value ?? "").toLocaleLowerCase("fr-CA");
}

/**
 * Admin-only operational lookup. This intentionally filters on the server instead of exposing
 * PostgREST OR-filter syntax to user input. It is bounded and meant for day-to-day retrieval;
 * if the dataset grows beyond these caps, replace it with a parameterized PostgreSQL RPC.
 */
export const searchOperationalMemory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ q: z.string().trim().min(2).max(120) }).parse(d),
  )
  .handler(async ({ data, context }): Promise<OperationalMemorySearchResult> => {
    await assertAdmin(context);
    const q = data.q.toLocaleLowerCase("fr-CA");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [invoiceRes, requestRes, diagnosticRes, taskRes, eventRes] = await Promise.all([
      supabaseAdmin
        .from("stripe_invoices" as any)
        .select("id, stripe_invoice_id, invoice_number, customer_name, customer_email, customer_phone, description, amount_cents, currency, status, payment_method, paid_at, created_at")
        .order("created_at", { ascending: false })
        .limit(500),
      supabaseAdmin
        .from("service_requests" as any)
        .select("id, created_at, full_name, phone, email, city, service_type, spa_brand, spa_model, problem_description, urgency, status")
        .order("created_at", { ascending: false })
        .limit(500),
      supabaseAdmin
        .from("diagnostic_leads" as any)
        .select("id, created_at, full_name, phone, email, city, brand, model, error_code, problem_description, ai_diagnostic, ai_urgency, status")
        .order("created_at", { ascending: false })
        .limit(500),
      supabaseAdmin
        .from("automation_tasks" as any)
        .select("id, task_type, status, instruction, input, output, error_message, created_at, completed_at")
        .order("created_at", { ascending: false })
        .limit(500),
      supabaseAdmin
        .from("business_events" as any)
        .select("id, entity_type, entity_id, event_type, actor_type, actor_id, correlation_id, payload, created_at")
        .order("created_at", { ascending: false })
        .limit(1000),
    ]);

    for (const result of [invoiceRes, requestRes, diagnosticRes, taskRes, eventRes]) {
      if (result.error) throw new Error(result.error.message);
    }

    const invoices = ((invoiceRes.data ?? []) as OperationalMemorySearchResult["invoices"])
      .filter((row) => searchable(row).includes(q))
      .slice(0, 50);
    const requests = ((requestRes.data ?? []) as ServiceRequestMemoryRow[])
      .filter((row) => searchable(row).includes(q))
      .slice(0, 50);
    const diagnostics = ((diagnosticRes.data ?? []) as DiagnosticMemoryRow[])
      .filter((row) => searchable(row).includes(q))
      .slice(0, 50);
    const tasks = ((taskRes.data ?? []) as AutomationMemoryRow[])
      .filter((row) => searchable(row).includes(q))
      .slice(0, 50);

    const relatedEntityIds = new Set<string>();
    for (const invoice of invoices) {
      relatedEntityIds.add(invoice.stripe_invoice_id);
      if (invoice.invoice_number) relatedEntityIds.add(invoice.invoice_number);
      relatedEntityIds.add(invoice.id);
    }
    for (const request of requests) relatedEntityIds.add(request.id);
    for (const diagnostic of diagnostics) relatedEntityIds.add(diagnostic.id);
    for (const task of tasks) relatedEntityIds.add(task.id);

    const events = ((eventRes.data ?? []) as BusinessEventRow[])
      .filter((row) => searchable(row).includes(q) || relatedEntityIds.has(row.entity_id))
      .slice(0, 100);

    return { invoices, requests, diagnostics, tasks, events };
  });
