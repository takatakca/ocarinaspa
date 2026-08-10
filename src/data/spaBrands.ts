export type BrandCategory = {
  slug: string;
  title: string;
  description: string;
  brands: string[];
};

/**
 * Public brand copy is intentionally conservative. Canadian-made brands are separated from
 * other common Canadian-market brands so the site doesn't invent origin claims.
 */
export const SPA_BRAND_CATEGORIES: BrandCategory[] = [
  {
    slug: "canadiennes",
    title: "Marques fabriquées au Canada",
    description:
      "Priorité aux marques ayant une fabrication canadienne confirmée et adaptées à notre climat.",
    brands: ["Hydropool", "Arctic Spas", "Beachcomber", "Coast Spas", "Sunrise Spas"],
  },
  {
    slug: "courantes-canada",
    title: "Autres grandes marques présentes au Canada",
    description:
      "Nous diagnostiquons aussi de nombreuses marques nord-américaines courantes selon les pièces et systèmes installés.",
    brands: [
      "Jacuzzi",
      "Sundance Spas",
      "Hot Spring",
      "Caldera Spas",
      "Bullfrog Spas",
      "Master Spas",
      "Maax Spas",
      "Vita Spa",
      "Nordic Hot Tubs",
      "Artesian Spas",
      "Marquis Spas",
      "Dimension One Spas",
    ],
  },
  {
    slug: "autres",
    title: "Autres marques rencontrées en service",
    description:
      "Pour une marque plus rare, envoyez le modèle et une photo de la plaque signalétique : nous confirmons la compatibilité avant le déplacement.",
    brands: [
      "Canadian Spa Company",
      "Catalina Spas",
      "PDC Spas",
      "Dynasty Spas",
      "Viking Spas",
      "Strong Spas",
      "AquaRest",
      "Dream Maker Spas",
      "Freeflow Spas",
      "Softub",
    ],
  },
  {
    slug: "swim-spas",
    title: "Spas de nage / Swim Spas",
    description: "Diagnostic de grands bassins de nage à contre-courant selon l'installation et l'accès technique.",
    brands: ["Hydropool Swim Spas", "H2X Swim Spa", "Michael Phelps Swim Spas", "Endless Pools"],
  },
];

export const TOP_BRANDS_QC = [
  "Hydropool",
  "Arctic Spas",
  "Beachcomber",
  "Coast Spas",
  "Sunrise Spas",
  "Jacuzzi",
  "Sundance Spas",
  "Hot Spring",
  "Caldera Spas",
  "Bullfrog Spas",
];

export const WINTER_BRANDS = ["Hydropool", "Arctic Spas", "Beachcomber", "Coast Spas", "Sunrise Spas"];

export const REPAIRED_SYSTEMS = [
  "Systèmes Balboa",
  "Systèmes Gecko",
  "Pompes Waterway",
  "Pompes LX",
  "Chauffe-eau",
  "Packs électroniques",
  "Panneaux de contrôle / topside",
  "Jets",
  "Fuites d'eau",
  "Ozonateurs",
  "Capteurs",
  "Filtration",
  "Chauffage",
];

export const ALL_BRANDS = Array.from(new Set(SPA_BRAND_CATEGORIES.flatMap((c) => c.brands))).sort(
  (a, b) => a.localeCompare(b, "fr"),
);
