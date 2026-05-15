export type BrandCategory = {
  slug: string;
  title: string;
  description: string;
  brands: string[];
};

export const SPA_BRAND_CATEGORIES: BrandCategory[] = [
  {
    slug: "premium",
    title: "Marques premium / haut de gamme",
    description:
      "Spas reconnus pour leur qualité de fabrication, leur isolation et leurs composantes durables.",
    brands: [
      "Hydropool",
      "Arctic Spas",
      "Beachcomber",
      "Jacuzzi",
      "Sundance Spas",
      "Bullfrog Spas",
      "Master Spas",
      "Hot Spring",
      "Caldera Spas",
      "Dimension One Spas",
      "Artesian Spas",
      "Marquis Spas",
    ],
  },
  {
    slug: "repandues",
    title: "Marques très répandues au Québec",
    description: "Marques populaires que nos techniciens voient régulièrement à domicile.",
    brands: [
      "Vita Spa",
      "Coast Spas",
      "Maax Spas",
      "Sunray Spas",
      "Sunrise Spas",
      "Wellis",
      "Passion Spas",
      "Tuff Spas",
      "LA Spas",
      "Catalina Spas",
      "PDC Spas",
      "Nordic Hot Tubs",
      "Dynasty Spas",
      "Emerald Spas",
      "Blue Falls",
      "Coyote Spas",
    ],
  },
  {
    slug: "usagees",
    title: "Marques souvent vues usagées / Marketplace",
    description:
      "Spas usagés achetés sur Marketplace ou Kijiji — nous diagnostiquons et remettons en service.",
    brands: [
      "Infinity Spas",
      "AquaRest",
      "Strong Spas",
      "Evolution Spas",
      "Platinum Spas",
      "Canadian Spa Company",
      "Elite Spas",
      "Dream Maker Spas",
      "Phoenix Spas",
      "Coleman Spas",
      "Leisure Bay Spas",
      "Morgan Spas",
      "QCA Spas",
      "Signature Spas",
      "Softub",
      "Freeflow Spas",
      "Fantasy Spas",
      "Tropic Seas Spas",
      "Island Spas",
      "Superior Spas",
      "Pacific Spas",
      "Mirage Spas",
      "Royal Spas",
      "Canspa",
    ],
  },
  {
    slug: "gonflables",
    title: "Spas gonflables et économiques",
    description: "Spas portatifs et gonflables — chauffage, moteur et entretien.",
    brands: ["Bestway SaluSpa", "Intex PureSpa", "MSpa"],
  },
  {
    slug: "swim-spas",
    title: "Spas de nage / Swim Spas",
    description: "Grands bassins de nage à contre-courant.",
    brands: [
      "Michael Phelps Swim Spas",
      "Endless Pools",
      "Hydropool Swim Spas",
      "H2X Swim Spa",
      "Infinity Swim Spas",
    ],
  },
  {
    slug: "internationales",
    title: "Marques européennes / internationales",
    description: "Marques importées ou plus rares au Québec — diagnostic possible.",
    brands: [
      "Aquavia Spa",
      "USSPA",
      "Peipsi",
      "Kirami",
      "RotoSpa",
      "Clearwater Spas",
      "ThermoSpas",
      "Atera Spas",
      "Barefoot Spas",
      "Down East Spas",
      "Four Winds Spas",
      "Garden Leisure Spas",
      "Great Lakes Spas",
      "Sunbelt Spas",
      "Reflections Spas",
      "Legacy Whirlpool",
      "Apollo Spas",
      "Aegean Spas",
      "Saratoga Spas",
      "Viking Spas",
    ],
  },
];

export const TOP_BRANDS_QC = [
  "Hydropool",
  "Jacuzzi",
  "Sundance Spas",
  "Arctic Spas",
  "Beachcomber",
  "Maax Spas",
  "Vita Spa",
  "Bullfrog Spas",
  "Master Spas",
  "Hot Spring",
];

export const WINTER_BRANDS = [
  "Arctic Spas",
  "Hydropool",
  "Beachcomber",
  "Coast Spas",
  "Maax Spas",
];

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
  "Problèmes de filtration",
  "Problèmes de chauffage",
  "Problèmes électriques liés au spa",
];

export const ALL_BRANDS = Array.from(
  new Set(SPA_BRAND_CATEGORIES.flatMap((c) => c.brands)),
).sort((a, b) => a.localeCompare(b, "fr"));
