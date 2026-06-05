import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const DiagnosticInput = z.object({
  errorCode: z.string().max(20).optional(),
  brand: z.string().max(80).optional(),
  model: z.string().max(80).optional(),
  year: z.string().max(10).optional(),
  symptoms: z.string().min(3).max(2000),
  heating: z.enum(["oui", "non", "intermittent", "inconnu"]).optional(),
  pumpNoise: z.enum(["oui", "non", "inconnu"]).optional(),
  pumpWorks: z.enum(["oui", "non", "inconnu"]).optional(),
  since: z.string().max(80).optional(),
  city: z.string().max(80).optional(),
});

export type DiagnosticResult = {
  diagnostic: string;
  likelyCauses: string[];
  actions: string[];
  urgency: "faible" | "moyenne" | "haute";
  recommendCall: boolean;
};

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
  heating: z.string().max(20).optional().nullable(),
  pump_works: z.string().max(20).optional().nullable(),
  pump_noise: z.string().max(20).optional().nullable(),
  since: z.string().max(80).optional().nullable(),
  consent: z.literal(true),
  source_url: z.string().max(500).optional().nullable(),
});

export const saveDiagnosticLead = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => LeadInput.parse(input))
  .handler(async ({ data }) => {
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
        consent: data.consent,
        source_url: data.source_url || null,
      })
      .select("id")
      .single();
    if (error) {
      console.error("diagnostic_leads insert error", error);
      throw new Error("Impossible d'enregistrer votre demande. Réessayez ou appelez-nous.");
    }
    return { ok: true as const, id: inserted?.id as string | undefined };
  });

export const updateDiagnosticLeadAI = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        ai_diagnostic: z.string().max(4000),
        ai_causes: z.array(z.string()).max(10),
        ai_actions: z.array(z.string()).max(10),
        ai_urgency: z.string().max(20),
        ai_recommend_call: z.boolean(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("diagnostic_leads")
      .update({
        ai_diagnostic: data.ai_diagnostic,
        ai_causes: data.ai_causes,
        ai_actions: data.ai_actions,
        ai_urgency: data.ai_urgency,
        ai_recommend_call: data.ai_recommend_call,
      })
      .eq("id", data.id);
    return { ok: true as const };
  });

export const diagnoseSpaIssue = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => DiagnosticInput.parse(input))
  .handler(async ({ data }): Promise<DiagnosticResult> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const userMessage = `Code d'erreur affiché : ${data.errorCode || "aucun"}
Marque : ${data.brand || "inconnu"}
Modèle : ${data.model || "inconnu"}
Année approximative : ${data.year || "inconnu"}
Symptômes : ${data.symptoms}
Le spa chauffe ? ${data.heating || "inconnu"}
La pompe fonctionne ? ${data.pumpWorks || "inconnu"}
La pompe fait du bruit ? ${data.pumpNoise || "inconnu"}
Depuis quand le problème est présent ? ${data.since || "inconnu"}
Ville : ${data.city || "inconnu"}`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "Tu es un technicien expert en réparation de spas (bains à remous) au Québec. Tu connais Balboa, Gecko, Waterway, LX, Jacuzzi, Hydropool, Arctic Spas, Beachcomber, Sundance. Tu réponds TOUJOURS en français québécois, court et précis. Réponds STRICTEMENT en JSON valide avec les clés : diagnostic (string, 1-2 phrases), likelyCauses (array de 2-4 strings courts), actions (array de 2-4 strings — étapes à essayer ou pièces à vérifier), urgency ('faible'|'moyenne'|'haute'), recommendCall (boolean — true si pièce, intervention ou risque de gel). En hiver ou si gel possible : urgency 'haute'. Ne mets aucun texte hors du JSON.",
          },
          { role: "user", content: userMessage },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      }),
    });

    if (resp.status === 429) {
      throw new Error("Trop de demandes — réessayez dans un instant.");
    }
    if (resp.status === 402) {
      throw new Error("Crédits AI épuisés — contactez-nous directement par téléphone.");
    }
    if (!resp.ok) {
      throw new Error(`Erreur AI (${resp.status})`);
    }

    const json = await resp.json();
    const content = json.choices?.[0]?.message?.content ?? "{}";
    let parsed: DiagnosticResult;
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new Error("Réponse AI invalide");
    }
    return {
      diagnostic: parsed.diagnostic ?? "Diagnostic indisponible.",
      likelyCauses: Array.isArray(parsed.likelyCauses) ? parsed.likelyCauses.slice(0, 5) : [],
      actions: Array.isArray(parsed.actions) ? parsed.actions.slice(0, 5) : [],
      urgency: (["faible", "moyenne", "haute"].includes(parsed.urgency as string)
        ? parsed.urgency
        : "moyenne") as DiagnosticResult["urgency"],
      recommendCall: Boolean(parsed.recommendCall),
    };
  });
