/**
 * Rule-based spa pre-diagnostic: no external AI provider. It combines the public error-code
 * reference (src/data/spaErrorCodes.ts) with the symptoms from the form.
 * Customer actions are only safe observations and checks: never open the electrical panel,
 * touch wiring, bypass a GFCI/breaker or dismantle a pump or heater.
 */
import { SPA_ERROR_CODES, type ErrorCode } from "@/data/spaErrorCodes";

export type PreDiagnosticInput = {
  brand: string;
  error_code?: string | null;
  problem_description: string;
  heating?: "oui" | "non" | "intermittent" | "inconnu" | null;
  pump_works?: "oui" | "non" | "inconnu" | null;
  pump_noise?: "oui" | "non" | "inconnu" | null;
};

export type PreDiagnostic = {
  diagnostic: string;
  likelyCauses: string[];
  actions: string[];
  urgency: "faible" | "moyenne" | "haute";
  recommendCall: boolean;
};

const CODE_ALIASES: Record<string, string> = { DRY: "DR", SNA: "SN", SNB: "SN" };
const HIGH_URGENCY_CODES = new Set(["ICE", "OH", "HL"]);
const PHONE = "819-913-7727";

const normalize = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const hasAny = (text: string, words: string[]) => words.some((w) => text.includes(w));

const DANGER_WORDS = [
  "brule",
  "fumee",
  "etincel",
  "disjonct",
  "gfci",
  "choc electrique",
  "court-circuit",
  "court circuit",
  "fondu",
];
const FREEZE_WORDS = ["gel", "glace", "fige"];
const LEAK_WORDS = ["fuite", "perd de l'eau", "perd de leau", "niveau baisse"];

export function findErrorCode(raw?: string | null): ErrorCode | null {
  const code = (raw ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!code) return null;
  const canonical = CODE_ALIASES[code] ?? code;
  return SPA_ERROR_CODES.find((c) => c.code === canonical) ?? null;
}

const uniq = (items: string[], max: number) => Array.from(new Set(items)).slice(0, max);

export function preDiagnose(input: PreDiagnosticInput): PreDiagnostic {
  const text = normalize(input.problem_description);
  const code = findErrorCode(input.error_code);
  const danger = hasAny(text, DANGER_WORDS);
  const notHeating = input.heating === "non" || input.heating === "intermittent";
  const pumpDown = input.pump_works === "non";
  const freeze =
    code?.code === "ICE" || hasAny(text, FREEZE_WORDS) || (input.heating === "non" && pumpDown);
  const leak = hasAny(text, LEAK_WORDS);

  const causes: string[] = [
    ...(danger ? ["Défaut électrique : connexion, composante ou protection DDFT (GFCI)"] : []),
    ...(code?.causes ?? []),
  ];
  if (notHeating)
    causes.push(
      "Élément chauffant ou relais du chauffe-eau",
      "Sonde de température",
      "Débit d'eau insuffisant (filtre encrassé)",
    );
  if (pumpDown)
    causes.push("Pompe ou condensateur de démarrage", "Relais de pompe sur la carte électronique");
  if (input.pump_noise === "oui")
    causes.push("Roulements de pompe usés", "Air dans la plomberie ou niveau d'eau trop bas");
  if (leak) causes.push("Fuite de plomberie, de joint ou de raccord de pompe");
  if (causes.length === 0)
    causes.push("Les symptômes décrits demandent une vérification sur place par un technicien");

  const actions: string[] = [];
  if (danger)
    actions.push(
      "Cessez d'utiliser le spa et ne touchez à aucune composante électrique : un technicien qualifié doit l'inspecter.",
    );
  if (freeze)
    actions.push(
      "Gardez le couvercle bien fermé et appelez-nous rapidement : un spa arrêté par temps froid peut geler en quelques heures.",
    );
  if (code && ["OH", "HL"].includes(code.code))
    actions.push(
      "Retirez le couvercle pour laisser l'eau refroidir et n'utilisez pas le spa tant que la température est élevée.",
    );
  if (code && ["FLO", "LF", "DR"].includes(code.code))
    actions.push(
      "Vérifiez que le filtre est propre et bien en place, et que l'eau couvre les écumoires.",
    );
  if (notHeating && !freeze)
    actions.push(
      "Vérifiez que le couvercle est bien fermé et notez la température affichée au panneau.",
    );
  if (input.pump_noise === "oui")
    actions.push(
      "Notez quand le bruit se produit (démarrage, haute vitesse) et vérifiez le niveau d'eau.",
    );
  if (leak) actions.push("Notez où l'eau s'accumule et à quelle vitesse le niveau baisse.");
  actions.push("Notez le code et les messages affichés au panneau pour le technicien.");

  const urgency: PreDiagnostic["urgency"] =
    danger || freeze || (code && HIGH_URGENCY_CODES.has(code.code))
      ? "haute"
      : code || pumpDown || input.heating === "non" || leak
        ? "moyenne"
        : "faible";
  const recommendCall = urgency !== "faible" || !code;

  const parts = [
    `Pré-diagnostic automatique pour votre spa ${input.brand}, établi sans inspection.`,
  ];
  if (code) parts.push(`${code.title} : ${code.meaning} Intervention habituelle : ${code.action}`);
  else if (input.error_code?.trim())
    parts.push(
      `Le code « ${input.error_code.trim()} » ne figure pas dans notre référence : un technicien le vérifiera.`,
    );
  if (danger)
    parts.push(
      "Les signes décrits (odeur de brûlé, disjoncteur, étincelles…) exigent l'arrêt du spa jusqu'à l'inspection.",
    );
  if (freeze && code?.code !== "ICE") parts.push("Il y a un risque de gel de la plomberie.");
  parts.push(
    urgency === "haute"
      ? `Situation urgente : appelez-nous au ${PHONE}.`
      : recommendCall
        ? `Un technicien devrait confirmer la cause ; vous pouvez nous joindre au ${PHONE}.`
        : "Surveillez le spa ; rappelez-nous si le problème persiste.",
  );

  return {
    diagnostic: parts.join(" ").slice(0, 1200),
    likelyCauses: uniq(causes, 5),
    actions: uniq(actions, 5),
    urgency,
    recommendCall,
  };
}
