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
