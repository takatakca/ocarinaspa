// Données officielles MAMH (Données Québec — Répertoire des municipalités)
// Importées depuis MUN.csv et ARR.csv via scripts/import-quebec-municipalities.ts
import raw from "./quebecMunicipalities.json";
import regionsRaw from "./quebecRegions.json";

export interface Municipality {
  code: string;
  name: string;
  slug: string;
  type: string;
  region: string | null;
  mrc: string | null;
  population: number | null;
  kind: "municipalite" | "arrondissement";
  city?: string;
}

export const quebecMunicipalities: Municipality[] = raw as Municipality[];
export const quebecRegions: string[] = regionsRaw as string[];

export const findMunicipalityBySlug = (slug: string): Municipality | undefined =>
  quebecMunicipalities.find((m) => m.slug === slug);

export const SERVICE_TYPES = [
  { slug: "reparation-spa", label: "Réparation de spa", verb: "Réparation", category: "spa" },
  { slug: "entretien-spa", label: "Entretien de spa", verb: "Entretien", category: "spa" },
  { slug: "vente-spa", label: "Vente de spa", verb: "Vente", category: "spa" },
  { slug: "installation-spa", label: "Installation de spa", verb: "Installation", category: "spa" },
  { slug: "ouverture-spa", label: "Ouverture de spa", verb: "Ouverture", category: "spa" },
  { slug: "fermeture-spa", label: "Fermeture de spa", verb: "Fermeture", category: "spa" },
  { slug: "pieces-spa", label: "Pièces de spa", verb: "Pièces", category: "spa" },
  { slug: "hot-tub-repair", label: "Hot tub repair", verb: "Repair", category: "spa-en" },
  { slug: "hot-tub-maintenance", label: "Hot tub maintenance", verb: "Maintenance", category: "spa-en" },
  { slug: "ouverture-piscine", label: "Ouverture de piscine", verb: "Ouverture", category: "piscine" },
  { slug: "fermeture-piscine", label: "Fermeture de piscine", verb: "Fermeture", category: "piscine" },
  { slug: "nettoyage-piscine", label: "Nettoyage de piscine", verb: "Nettoyage", category: "piscine" },
  { slug: "entretien-piscine", label: "Entretien de piscine", verb: "Entretien", category: "piscine" },
] as const;

export type ServiceSlug = (typeof SERVICE_TYPES)[number]["slug"];

export const findServiceBySlug = (slug: string) =>
  SERVICE_TYPES.find((s) => s.slug === slug);
