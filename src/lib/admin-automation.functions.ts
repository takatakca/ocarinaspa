/**
 * Admin-only operational assistant.
 * The model may prepare a structured Stripe invoice draft, but a financial write never executes
 * until an authenticated admin explicitly approves the task. This creates a durable checkpoint.
 */
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

const InvoiceDraft = z.object({
  customerName: z.string().trim().min(1).max(200).nullable(),
  customerEmail: z.string().trim().email().max(255).nullable(),
  customerPhone: z.string().trim().max(40).nullable().optional(),
  customerAddress: z.string().trim().max(300).nullable().optional(),
  customerCity: z.string().trim().max(120).nullable().optional(),
  description: z.string().trim().min(1).max(500).nullable(),
  amountBeforeTax: z.number().positive().max(1_000_000).nullable(),
  applyTaxes: z.boolean().default(true),
  notes: z.string().trim().max(1000).nullable().optional(),
  daysUntilDue: z.number().int().min(0).max(365).default(15),
  sendInvoice: z.boolean().default(false),
  missingFields: z.array(z.string().max(80)).max(10).default([]),
});

type InvoiceDraftType = z.infer<typeof InvoiceDraft>;

export type AutomationTask = {
  id: string;
  task_type: string;
  status: string;
  instruction: string | null;
  input: any;
  output: any;
  error_message: string | null;
  created_at: string;
  approved_at: string | null;
  completed_at: string | null;
};

export const draftInvoiceAutomation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ instruction: z.string().trim().min(10).max(4000) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Assistant backend non configuré (LOVABLE_API_KEY)." );

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "Tu prépares uniquement un brouillon de facture Ocarina Spa à partir de l'instruction admin. N'invente JAMAIS un montant, un email, un téléphone ou un nom. Si une donnée requise manque, mets null et ajoute son nom à missingFields. Retourne seulement JSON: customerName, customerEmail, customerPhone, customerAddress, customerCity, description, amountBeforeTax (nombre CAD avant taxes), applyTaxes (bool), notes, daysUntilDue (0-365), sendInvoice (true uniquement si l'admin demande explicitement d'envoyer), missingFields (array).",
          },
          { role: "user", content: data.instruction },
        ],
      }),
    });
    if (!resp.ok) throw new Error("Impossible de préparer le brouillon pour le moment.");
    const json = await resp.json();
    const content = json.choices?.[0]?.message?.content ?? "{}";
    let parsed: InvoiceDraftType;
    try {
      parsed = InvoiceDraft.parse(JSON.parse(content));
    } catch {
      throw new Error("Le brouillon généré n'a pas passé la validation de sécurité.");
    }

    const requiredMissing = [
      !parsed.customerName ? "customerName" : null,
      !parsed.customerEmail ? "customerEmail" : null,
      !parsed.description ? "description" : null,
      parsed.amountBeforeTax == null ? "amountBeforeTax" : null,
    ].filter(Boolean) as string[];
    const missingFields = Array.from(new Set([...parsed.missingFields, ...requiredMissing]));
    const status = missingFields.length ? "needs_input" : "awaiting_approval";

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: task, error } = await supabaseAdmin
      .from("automation_tasks" as any)
      .insert({
        task_type: "create_stripe_invoice",
        status,
        requested_by: context.userId,
        instruction: data.instruction,
        input: { ...parsed, missingFields },
      } as any)
      .select("id, task_type, status, instruction, input, output, error_message, created_at, approved_at, completed_at")
      .single();
    if (error) throw new Error(error.message);

    const { appendBusinessEvent } = await import("./business-events.server");
    await appendBusinessEvent({
      entityType: "automation_task",
      entityId: (task as any).id,
      eventType: "automation.invoice_drafted",
      actorType: "admin",
      actorId: context.userId,
      payload: { status, missingFields },
    });
    return task as AutomationTask;
  });

export const listAutomationTasks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AutomationTask[]> => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("automation_tasks" as any)
      .select("id, task_type, status, instruction, input, output, error_message, created_at, approved_at, completed_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return (data ?? []) as AutomationTask[];
  });

export const approveInvoiceAutomation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ taskId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: task, error } = await supabaseAdmin
      .from("automation_tasks" as any)
      .select("*")
      .eq("id", data.taskId)
      .maybeSingle();
    if (error || !task) throw new Error("Tâche introuvable.");
    if ((task as any).status === "completed") return { ok: true as const, output: (task as any).output };
    if ((task as any).status !== "awaiting_approval") {
      throw new Error("Cette tâche n'est pas prête à être approuvée.");
    }

    const draft = InvoiceDraft.parse((task as any).input);
    if (!draft.customerName || !draft.customerEmail || !draft.description || draft.amountBeforeTax == null) {
      throw new Error("Le brouillon contient encore des champs obligatoires manquants.");
    }

    const claimedAt = new Date().toISOString();
    const { data: claimed } = await supabaseAdmin
      .from("automation_tasks" as any)
      .update({
        status: "executing",
        approved_by: context.userId,
        approved_at: claimedAt,
        started_at: claimedAt,
        error_message: null,
      })
      .eq("id", data.taskId)
      .eq("status", "awaiting_approval")
      .select("id")
      .maybeSingle();
    if (!claimed) throw new Error("Cette tâche est déjà en cours de traitement.");

    try {
      const { createStripeInvoiceCore } = await import("./admin-invoices.functions");
      const invoice = await createStripeInvoiceCore(
        {
          requestId: data.taskId,
          customerName: draft.customerName,
          customerEmail: draft.customerEmail,
          customerPhone: draft.customerPhone ?? undefined,
          customerAddress: draft.customerAddress ?? undefined,
          customerCity: draft.customerCity ?? undefined,
          description: draft.description,
          amountBeforeTax: draft.amountBeforeTax,
          applyTaxes: draft.applyTaxes,
          notes: draft.notes ?? undefined,
          daysUntilDue: draft.daysUntilDue,
        },
        { userId: context.userId, actorType: "automation" },
      );

      if (draft.sendInvoice) {
        const { getStripe } = await import("./stripe.server");
        await getStripe().invoices.sendInvoice(
          invoice.invoiceId,
          {},
          { idempotencyKey: `${data.taskId}:invoice-send` },
        );
      }

      const output = { ...invoice, sent: draft.sendInvoice };
      await supabaseAdmin
        .from("automation_tasks" as any)
        .update({ status: "completed", output, completed_at: new Date().toISOString() })
        .eq("id", data.taskId);

      const { appendBusinessEvent } = await import("./business-events.server");
      await appendBusinessEvent({
        entityType: "automation_task",
        entityId: data.taskId,
        eventType: "automation.invoice_completed",
        actorType: "automation",
        actorId: context.userId,
        payload: output,
      });
      return { ok: true as const, output };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await supabaseAdmin
        .from("automation_tasks" as any)
        .update({ status: "failed", error_message: message.slice(0, 2000), completed_at: new Date().toISOString() })
        .eq("id", data.taskId);
      throw err;
    }
  });

export const rejectAutomationTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ taskId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("automation_tasks" as any)
      .update({ status: "rejected", approved_by: context.userId, approved_at: new Date().toISOString() })
      .eq("id", data.taskId)
      .in("status", ["awaiting_approval", "needs_input"]);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
