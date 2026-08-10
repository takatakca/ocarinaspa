import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { enforcePublicRateLimit } from "@/lib/public-security.server";

const LeadInput = z.object({
  full_name: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(7).max(30),
  email: z.string().trim().email().max(255),
  city: z.string().trim().min(2).max(80),
  brand: z.string().trim().min(1).max(80),
  model: z.string().trim().max(80).optional().nullable(),
  spa_year: z.string().trim().max(10).optional().nullable(),
  error_code: z.string().trim().max(20).optional().nullable(),
  problem_description: z.string().trim().min(3).max(2000),
  heating: z.enum(["oui", "non", "intermittent", "inconnu"]).optional().nullable(),
  pump_works: z.enum(["oui", "non", "inconnu"]).optional().nullable(),
  pump_noise: z.enum(["oui", "non", "inconnu"]).optional().nullable(),
  since: z.string().trim().max(80).optional().nullable(),
  consent: z.literal(true),
  source_url: z.string().max(500).optional().nullable(),
});

const DiagnosticResultSchema = z.object({
  diagnostic: z.string().trim().min(1).max(1200),
  likelyCauses: z.array(z.string().trim().min(1).max(300)).min(1).max(5),
  actions: z.array(z.string().trim().min(1).max(350)).min(1).max(5),
  urgency: z.enum(["faible", "moyenne", "haute"]),
  recommendCall: z.boolean(),
});

export type DiagnosticResult = z.infer<typeof DiagnosticResultSchema>;

async function generateDiagnostic(data: z.infer<typeof LeadInput>): Promise<DiagnosticResult> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Pré-diagnostic temporairement indisponible.");

  const userMessage = `Code d'erreur : ${data.error_code || "aucun"}\nMarque : ${data.brand}\nModèle : ${data.model || "inconnu"}\nAnnée : ${data.spa_year || "inconnu"}\nSymptômes : ${data.problem_description}\nLe spa chauffe ? ${data.heating || "inconnu"}\nLa pompe fonctionne ? ${data.pump_works || "inconnu"}\nBruit anormal de pompe ? ${data.pump_noise || "inconnu"}\nDepuis quand ? ${data.since || "inconnu"}\nVille : ${data.city}`;

  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Tu fournis un PRE-DIAGNOSTIC technique de spa pour Ocarina Spa au Québec, en français clair et professionnel. Tu ne prétends jamais confirmer une panne sans inspection. Les actions destinées au client doivent être uniquement des observations et vérifications sans danger (affichage du panneau, température, bruit, niveau d'eau, état visuel extérieur, arrêt de l'utilisation si nécessaire). N'ordonne jamais d'ouvrir un panneau électrique, de toucher au câblage, de mesurer une tension sous tension, de contourner un GFCI/disjoncteur/sécurité, ni de démonter une pompe ou un chauffe-eau. En cas d'odeur de brûlé, eau près de composantes électriques, disjoncteur qui déclenche, risque de gel, ou doute électrique : recommander d'arrêter l'utilisation et de contacter un technicien qualifié. Réponds STRICTEMENT en JSON avec diagnostic, likelyCauses, actions, urgency ('faible'|'moyenne'|'haute'), recommendCall.",
        },
        { role: "user", content: userMessage },
      ],
    }),
  });

  if (resp.status === 429) throw new Error("Trop de demandes — réessayez dans quelques minutes.");
  if (!resp.ok) throw new Error("Pré-diagnostic temporairement indisponible.");

  const json = await resp.json();
  const content = json.choices?.[0]?.message?.content ?? "{}";
  try {
    return DiagnosticResultSchema.parse(JSON.parse(content));
  } catch {
    throw new Error("Le pré-diagnostic n'a pas pu être validé. Un technicien pourra vous rappeler.");
  }
}

/**
 * One public transaction boundary: capture the lead, run the backend assistant, persist the result.
 * The browser never receives a mutable lead id that can later be used to update someone else's lead.
 */
export const submitDiagnosticLead = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => LeadInput.parse(input))
  .handler(async ({ data }) => {
    await enforcePublicRateLimit("diagnostic", { limit: 5, windowSeconds: 30 * 60 });
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: inserted, error } = await supabaseAdmin
      .from("diagnostic_leads")
      .insert({
        full_name: data.full_name,
        phone: data.phone,
        email: data.email,
        city: data.city,
        brand: data.brand,
        model: data.model || null,
        spa_year: data.spa_year || null,
        error_code: data.error_code || null,
        problem_description: data.problem_description,
        heating: data.heating || null,
        pump_works: data.pump_works || null,
        pump_noise: data.pump_noise || null,
        since: data.since || null,
        consent: true,
        source_url: data.source_url || null,
      })
      .select("id")
      .single();

    if (error || !inserted?.id) {
      console.error("diagnostic_leads insert error", error);
      throw new Error("Impossible d'enregistrer votre demande. Réessayez ou appelez-nous.");
    }

    const { appendBusinessEvent } = await import("@/lib/business-events.server");
    await appendBusinessEvent({
      entityType: "diagnostic_lead",
      entityId: inserted.id,
      eventType: "diagnostic.lead_created",
      actorType: "customer",
      payload: { city: data.city, brand: data.brand, errorCode: data.error_code ?? null },
    });

    try {
      const result = await generateDiagnostic(data);
      const { error: updateErr } = await supabaseAdmin
        .from("diagnostic_leads")
        .update({
          ai_diagnostic: result.diagnostic,
          ai_causes: result.likelyCauses,
          ai_actions: result.actions,
          ai_urgency: result.urgency,
          ai_recommend_call: result.recommendCall,
        })
        .eq("id", inserted.id);
      if (updateErr) console.error("diagnostic lead result update failed", updateErr.message);

      await appendBusinessEvent({
        entityType: "diagnostic_lead",
        entityId: inserted.id,
        eventType: "diagnostic.completed",
        actorType: "automation",
        payload: { urgency: result.urgency, recommendCall: result.recommendCall },
      });
      if (result.recommendCall || result.urgency === "haute") {
        await supabaseAdmin.from("automation_tasks" as any).upsert({
          task_type: "diagnostic_followup",
          idempotency_key: `diagnostic-followup:${inserted.id}`,
          status: "needs_input",
          instruction: "Rappeler le client après le pré-diagnostic.",
          input: {
            diagnosticLeadId: inserted.id,
            customerName: data.full_name,
            customerEmail: data.email,
            customerPhone: data.phone,
            city: data.city,
            brand: data.brand,
            urgency: result.urgency,
          },
        } as any, { onConflict: "idempotency_key", ignoreDuplicates: true });
      }
      return { ok: true as const, leadSaved: true as const, result };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Pré-diagnostic indisponible.";
      await appendBusinessEvent({
        entityType: "diagnostic_lead",
        entityId: inserted.id,
        eventType: "diagnostic.failed",
        actorType: "automation",
        payload: { message: message.slice(0, 300) },
      });
      await supabaseAdmin.from("automation_tasks" as any).upsert({
        task_type: "diagnostic_followup",
        idempotency_key: `diagnostic-followup:${inserted.id}`,
        status: "needs_input",
        instruction: "Pré-diagnostic automatisé indisponible : rappeler le client.",
        input: {
          diagnosticLeadId: inserted.id,
          customerName: data.full_name,
          customerEmail: data.email,
          customerPhone: data.phone,
          city: data.city,
          brand: data.brand,
        },
        error_message: message.slice(0, 2000),
      } as any, { onConflict: "idempotency_key", ignoreDuplicates: false });
      return { ok: true as const, leadSaved: true as const, result: null, diagnosticError: message };
    }
  });
