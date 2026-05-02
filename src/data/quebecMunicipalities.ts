// Liste extensible des municipalités, arrondissements et villes du Québec.
// Structure prête pour importer la liste officielle complète (Décret de population MAMH).
// Pour ajouter en lot, conserver la structure { name, region, population? }.

export type QuebecRegion =
  | "Montréal"
  | "Laval"
  | "Montérégie"
  | "Laurentides"
  | "Lanaudière"
  | "Capitale-Nationale"
  | "Mauricie"
  | "Centre-du-Québec"
  | "Estrie"
  | "Outaouais"
  | "Abitibi-Témiscamingue"
  | "Saguenay–Lac-Saint-Jean"
  | "Côte-Nord"
  | "Bas-Saint-Laurent"
  | "Gaspésie–Îles-de-la-Madeleine"
  | "Chaudière-Appalaches"
  | "Nord-du-Québec";

export interface Municipality {
  name: string;
  region: QuebecRegion;
  slug: string;
  population?: number;
}

const slugify = (str: string): string =>
  str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const raw: Array<Omit<Municipality, "slug">> = [
  // Montréal (arrondissements)
  { name: "Montréal", region: "Montréal", population: 1762949 },
  { name: "Ahuntsic-Cartierville", region: "Montréal" },
  { name: "Anjou", region: "Montréal" },
  { name: "Côte-des-Neiges–Notre-Dame-de-Grâce", region: "Montréal" },
  { name: "Lachine", region: "Montréal" },
  { name: "LaSalle", region: "Montréal" },
  { name: "Le Plateau-Mont-Royal", region: "Montréal" },
  { name: "Le Sud-Ouest", region: "Montréal" },
  { name: "L'Île-Bizard–Sainte-Geneviève", region: "Montréal" },
  { name: "Mercier–Hochelaga-Maisonneuve", region: "Montréal" },
  { name: "Montréal-Nord", region: "Montréal" },
  { name: "Outremont", region: "Montréal" },
  { name: "Pierrefonds-Roxboro", region: "Montréal" },
  { name: "Rivière-des-Prairies–Pointe-aux-Trembles", region: "Montréal" },
  { name: "Rosemont–La Petite-Patrie", region: "Montréal" },
  { name: "Saint-Laurent", region: "Montréal" },
  { name: "Saint-Léonard", region: "Montréal" },
  { name: "Verdun", region: "Montréal" },
  { name: "Ville-Marie", region: "Montréal" },
  { name: "Villeray–Saint-Michel–Parc-Extension", region: "Montréal" },
  { name: "Westmount", region: "Montréal" },
  { name: "Côte-Saint-Luc", region: "Montréal" },
  { name: "Hampstead", region: "Montréal" },
  { name: "Mont-Royal", region: "Montréal" },
  { name: "Dollard-Des Ormeaux", region: "Montréal" },
  { name: "Pointe-Claire", region: "Montréal" },
  { name: "Kirkland", region: "Montréal" },
  { name: "Beaconsfield", region: "Montréal" },
  { name: "Dorval", region: "Montréal" },
  { name: "Baie-D'Urfé", region: "Montréal" },
  { name: "Sainte-Anne-de-Bellevue", region: "Montréal" },
  { name: "Senneville", region: "Montréal" },
  { name: "Montréal-Est", region: "Montréal" },
  { name: "Montréal-Ouest", region: "Montréal" },

  // Laval
  { name: "Laval", region: "Laval", population: 438366 },

  // Montérégie (Rive-Sud)
  { name: "Longueuil", region: "Montérégie", population: 254483 },
  { name: "Brossard", region: "Montérégie" },
  { name: "Saint-Hubert", region: "Montérégie" },
  { name: "Greenfield Park", region: "Montérégie" },
  { name: "Boucherville", region: "Montérégie" },
  { name: "Saint-Bruno-de-Montarville", region: "Montérégie" },
  { name: "Saint-Lambert", region: "Montérégie" },
  { name: "Candiac", region: "Montérégie" },
  { name: "La Prairie", region: "Montérégie" },
  { name: "Saint-Constant", region: "Montérégie" },
  { name: "Sainte-Catherine", region: "Montérégie" },
  { name: "Châteauguay", region: "Montérégie" },
  { name: "Mercier", region: "Montérégie" },
  { name: "Léry", region: "Montérégie" },
  { name: "Beauharnois", region: "Montérégie" },
  { name: "Salaberry-de-Valleyfield", region: "Montérégie" },
  { name: "Saint-Jean-sur-Richelieu", region: "Montérégie" },
  { name: "Chambly", region: "Montérégie" },
  { name: "Carignan", region: "Montérégie" },
  { name: "Marieville", region: "Montérégie" },
  { name: "Richelieu", region: "Montérégie" },
  { name: "Saint-Basile-le-Grand", region: "Montérégie" },
  { name: "Saint-Mathieu-de-Beloeil", region: "Montérégie" },
  { name: "Beloeil", region: "Montérégie" },
  { name: "McMasterville", region: "Montérégie" },
  { name: "Mont-Saint-Hilaire", region: "Montérégie" },
  { name: "Otterburn Park", region: "Montérégie" },
  { name: "Saint-Hyacinthe", region: "Montérégie" },
  { name: "Saint-Damase", region: "Montérégie" },
  { name: "Granby", region: "Montérégie" },
  { name: "Bromont", region: "Montérégie" },
  { name: "Cowansville", region: "Montérégie" },
  { name: "Farnham", region: "Montérégie" },
  { name: "Sorel-Tracy", region: "Montérégie" },
  { name: "Saint-Joseph-de-Sorel", region: "Montérégie" },
  { name: "Contrecoeur", region: "Montérégie" },
  { name: "Varennes", region: "Montérégie" },
  { name: "Verchères", region: "Montérégie" },
  { name: "Sainte-Julie", region: "Montérégie" },
  { name: "Saint-Amable", region: "Montérégie" },
  { name: "Acton Vale", region: "Montérégie" },
  { name: "Vaudreuil-Dorion", region: "Montérégie" },
  { name: "L'Île-Perrot", region: "Montérégie" },
  { name: "Pincourt", region: "Montérégie" },
  { name: "Notre-Dame-de-l'Île-Perrot", region: "Montérégie" },
  { name: "Terrasse-Vaudreuil", region: "Montérégie" },
  { name: "Hudson", region: "Montérégie" },
  { name: "Rigaud", region: "Montérégie" },
  { name: "Saint-Lazare", region: "Montérégie" },
  { name: "Les Cèdres", region: "Montérégie" },
  { name: "Coteau-du-Lac", region: "Montérégie" },
  { name: "Saint-Zotique", region: "Montérégie" },
  { name: "Delson", region: "Montérégie" },
  { name: "Saint-Philippe", region: "Montérégie" },
  { name: "Saint-Mathieu", region: "Montérégie" },
  { name: "Napierville", region: "Montérégie" },
  { name: "Saint-Rémi", region: "Montérégie" },
  { name: "Sainte-Martine", region: "Montérégie" },
  { name: "Saint-Isidore", region: "Montérégie" },
  { name: "Howick", region: "Montérégie" },
  { name: "Ormstown", region: "Montérégie" },
  { name: "Huntingdon", region: "Montérégie" },

  // Laurentides
  { name: "Saint-Jérôme", region: "Laurentides" },
  { name: "Mirabel", region: "Laurentides" },
  { name: "Blainville", region: "Laurentides" },
  { name: "Sainte-Thérèse", region: "Laurentides" },
  { name: "Boisbriand", region: "Laurentides" },
  { name: "Rosemère", region: "Laurentides" },
  { name: "Lorraine", region: "Laurentides" },
  { name: "Bois-des-Filion", region: "Laurentides" },
  { name: "Sainte-Anne-des-Plaines", region: "Laurentides" },
  { name: "Deux-Montagnes", region: "Laurentides" },
  { name: "Saint-Eustache", region: "Laurentides" },
  { name: "Sainte-Marthe-sur-le-Lac", region: "Laurentides" },
  { name: "Pointe-Calumet", region: "Laurentides" },
  { name: "Oka", region: "Laurentides" },
  { name: "Saint-Joseph-du-Lac", region: "Laurentides" },
  { name: "Saint-Sauveur", region: "Laurentides" },
  { name: "Piedmont", region: "Laurentides" },
  { name: "Sainte-Adèle", region: "Laurentides" },
  { name: "Sainte-Agathe-des-Monts", region: "Laurentides" },
  { name: "Val-David", region: "Laurentides" },
  { name: "Val-Morin", region: "Laurentides" },
  { name: "Mont-Tremblant", region: "Laurentides" },
  { name: "Mont-Laurier", region: "Laurentides" },
  { name: "Rivière-Rouge", region: "Laurentides" },
  { name: "Lachute", region: "Laurentides" },
  { name: "Brownsburg-Chatham", region: "Laurentides" },
  { name: "Prévost", region: "Laurentides" },
  { name: "Saint-Hippolyte", region: "Laurentides" },
  { name: "Sainte-Sophie", region: "Laurentides" },
  { name: "Saint-Colomban", region: "Laurentides" },

  // Lanaudière
  { name: "Repentigny", region: "Lanaudière" },
  { name: "Terrebonne", region: "Lanaudière" },
  { name: "Mascouche", region: "Lanaudière" },
  { name: "L'Assomption", region: "Lanaudière" },
  { name: "L'Épiphanie", region: "Lanaudière" },
  { name: "Charlemagne", region: "Lanaudière" },
  { name: "Le Gardeur", region: "Lanaudière" },
  { name: "Lavaltrie", region: "Lanaudière" },
  { name: "Lachenaie", region: "Lanaudière" },
  { name: "La Plaine", region: "Lanaudière" },
  { name: "Joliette", region: "Lanaudière" },
  { name: "Notre-Dame-des-Prairies", region: "Lanaudière" },
  { name: "Saint-Charles-Borromée", region: "Lanaudière" },
  { name: "Berthierville", region: "Lanaudière" },
  { name: "Rawdon", region: "Lanaudière" },
  { name: "Saint-Lin-Laurentides", region: "Lanaudière" },
  { name: "Sainte-Julienne", region: "Lanaudière" },
  { name: "Saint-Donat", region: "Lanaudière" },
  { name: "Saint-Michel-des-Saints", region: "Lanaudière" },

  // Capitale-Nationale
  { name: "Québec", region: "Capitale-Nationale", population: 549459 },
  { name: "Lévis", region: "Chaudière-Appalaches", population: 149683 },
  { name: "L'Ancienne-Lorette", region: "Capitale-Nationale" },
  { name: "Saint-Augustin-de-Desmaures", region: "Capitale-Nationale" },
  { name: "Sainte-Brigitte-de-Laval", region: "Capitale-Nationale" },
  { name: "Stoneham-et-Tewkesbury", region: "Capitale-Nationale" },
  { name: "Lac-Beauport", region: "Capitale-Nationale" },
  { name: "Lac-Delage", region: "Capitale-Nationale" },
  { name: "Shannon", region: "Capitale-Nationale" },
  { name: "Saint-Raymond", region: "Capitale-Nationale" },
  { name: "Pont-Rouge", region: "Capitale-Nationale" },
  { name: "Donnacona", region: "Capitale-Nationale" },
  { name: "Cap-Santé", region: "Capitale-Nationale" },
  { name: "Neuville", region: "Capitale-Nationale" },
  { name: "Beaupré", region: "Capitale-Nationale" },
  { name: "Sainte-Anne-de-Beaupré", region: "Capitale-Nationale" },
  { name: "Château-Richer", region: "Capitale-Nationale" },
  { name: "L'Ange-Gardien", region: "Capitale-Nationale" },
  { name: "Boischatel", region: "Capitale-Nationale" },
  { name: "Baie-Saint-Paul", region: "Capitale-Nationale" },
  { name: "La Malbaie", region: "Capitale-Nationale" },

  // Mauricie
  { name: "Trois-Rivières", region: "Mauricie", population: 139163 },
  { name: "Shawinigan", region: "Mauricie" },
  { name: "La Tuque", region: "Mauricie" },
  { name: "Louiseville", region: "Mauricie" },
  { name: "Saint-Boniface", region: "Mauricie" },
  { name: "Saint-Étienne-des-Grès", region: "Mauricie" },
  { name: "Notre-Dame-du-Mont-Carmel", region: "Mauricie" },
  { name: "Saint-Tite", region: "Mauricie" },

  // Centre-du-Québec
  { name: "Drummondville", region: "Centre-du-Québec", population: 79258 },
  { name: "Victoriaville", region: "Centre-du-Québec" },
  { name: "Bécancour", region: "Centre-du-Québec" },
  { name: "Nicolet", region: "Centre-du-Québec" },
  { name: "Plessisville", region: "Centre-du-Québec" },
  { name: "Princeville", region: "Centre-du-Québec" },
  { name: "Warwick", region: "Centre-du-Québec" },

  // Estrie
  { name: "Sherbrooke", region: "Estrie", population: 172950 },
  { name: "Magog", region: "Estrie" },
  { name: "Coaticook", region: "Estrie" },
  { name: "Lac-Mégantic", region: "Estrie" },
  { name: "East Angus", region: "Estrie" },
  { name: "Windsor", region: "Estrie" },
  { name: "Asbestos", region: "Estrie" },
  { name: "Val-des-Sources", region: "Estrie" },
  { name: "North Hatley", region: "Estrie" },
  { name: "Stanstead", region: "Estrie" },
  { name: "Bromptonville", region: "Estrie" },

  // Outaouais
  { name: "Gatineau", region: "Outaouais", population: 291041 },
  { name: "Hull", region: "Outaouais" },
  { name: "Aylmer", region: "Outaouais" },
  { name: "Buckingham", region: "Outaouais" },
  { name: "Masson-Angers", region: "Outaouais" },
  { name: "Cantley", region: "Outaouais" },
  { name: "Chelsea", region: "Outaouais" },
  { name: "La Pêche", region: "Outaouais" },
  { name: "Val-des-Monts", region: "Outaouais" },
  { name: "Maniwaki", region: "Outaouais" },
  { name: "Thurso", region: "Outaouais" },
  { name: "Papineauville", region: "Outaouais" },

  // Abitibi-Témiscamingue
  { name: "Rouyn-Noranda", region: "Abitibi-Témiscamingue" },
  { name: "Val-d'Or", region: "Abitibi-Témiscamingue" },
  { name: "Amos", region: "Abitibi-Témiscamingue" },
  { name: "La Sarre", region: "Abitibi-Témiscamingue" },
  { name: "Malartic", region: "Abitibi-Témiscamingue" },
  { name: "Senneterre", region: "Abitibi-Témiscamingue" },
  { name: "Ville-Marie", region: "Abitibi-Témiscamingue" },

  // Saguenay–Lac-Saint-Jean
  { name: "Saguenay", region: "Saguenay–Lac-Saint-Jean", population: 144723 },
  { name: "Chicoutimi", region: "Saguenay–Lac-Saint-Jean" },
  { name: "Jonquière", region: "Saguenay–Lac-Saint-Jean" },
  { name: "La Baie", region: "Saguenay–Lac-Saint-Jean" },
  { name: "Alma", region: "Saguenay–Lac-Saint-Jean" },
  { name: "Roberval", region: "Saguenay–Lac-Saint-Jean" },
  { name: "Dolbeau-Mistassini", region: "Saguenay–Lac-Saint-Jean" },
  { name: "Saint-Félicien", region: "Saguenay–Lac-Saint-Jean" },
  { name: "Métabetchouan–Lac-à-la-Croix", region: "Saguenay–Lac-Saint-Jean" },

  // Côte-Nord
  { name: "Sept-Îles", region: "Côte-Nord" },
  { name: "Baie-Comeau", region: "Côte-Nord" },
  { name: "Port-Cartier", region: "Côte-Nord" },
  { name: "Forestville", region: "Côte-Nord" },
  { name: "Fermont", region: "Côte-Nord" },
  { name: "Havre-Saint-Pierre", region: "Côte-Nord" },

  // Bas-Saint-Laurent
  { name: "Rimouski", region: "Bas-Saint-Laurent" },
  { name: "Rivière-du-Loup", region: "Bas-Saint-Laurent" },
  { name: "Matane", region: "Bas-Saint-Laurent" },
  { name: "Mont-Joli", region: "Bas-Saint-Laurent" },
  { name: "Amqui", region: "Bas-Saint-Laurent" },
  { name: "Trois-Pistoles", region: "Bas-Saint-Laurent" },
  { name: "La Pocatière", region: "Bas-Saint-Laurent" },
  { name: "Témiscouata-sur-le-Lac", region: "Bas-Saint-Laurent" },

  // Gaspésie
  { name: "Gaspé", region: "Gaspésie–Îles-de-la-Madeleine" },
  { name: "Chandler", region: "Gaspésie–Îles-de-la-Madeleine" },
  { name: "New Richmond", region: "Gaspésie–Îles-de-la-Madeleine" },
  { name: "Carleton-sur-Mer", region: "Gaspésie–Îles-de-la-Madeleine" },
  { name: "Sainte-Anne-des-Monts", region: "Gaspésie–Îles-de-la-Madeleine" },
  { name: "Percé", region: "Gaspésie–Îles-de-la-Madeleine" },
  { name: "Les Îles-de-la-Madeleine", region: "Gaspésie–Îles-de-la-Madeleine" },

  // Chaudière-Appalaches
  { name: "Saint-Georges", region: "Chaudière-Appalaches" },
  { name: "Thetford Mines", region: "Chaudière-Appalaches" },
  { name: "Sainte-Marie", region: "Chaudière-Appalaches" },
  { name: "Beauceville", region: "Chaudière-Appalaches" },
  { name: "Saint-Joseph-de-Beauce", region: "Chaudière-Appalaches" },
  { name: "Montmagny", region: "Chaudière-Appalaches" },
  { name: "Saint-Lazare-de-Bellechasse", region: "Chaudière-Appalaches" },
  { name: "Lac-Etchemin", region: "Chaudière-Appalaches" },
  { name: "Disraeli", region: "Chaudière-Appalaches" },
  { name: "Saint-Pamphile", region: "Chaudière-Appalaches" },
  { name: "Pintendre", region: "Chaudière-Appalaches" },
  { name: "Saint-Romuald", region: "Chaudière-Appalaches" },
  { name: "Charny", region: "Chaudière-Appalaches" },
  { name: "Saint-Jean-Chrysostome", region: "Chaudière-Appalaches" },

  // Nord-du-Québec
  { name: "Chibougamau", region: "Nord-du-Québec" },
  { name: "Lebel-sur-Quévillon", region: "Nord-du-Québec" },
  { name: "Matagami", region: "Nord-du-Québec" },
  { name: "Chapais", region: "Nord-du-Québec" },
];

// Déduplication par slug (les arrondissements/villes homonymes sont rares mais possibles)
const seen = new Set<string>();
export const quebecMunicipalities: Municipality[] = raw
  .map((m) => ({ ...m, slug: slugify(m.name) }))
  .filter((m) => {
    if (seen.has(m.slug)) return false;
    seen.add(m.slug);
    return true;
  })
  .sort((a, b) => a.name.localeCompare(b.name, "fr"));

export const quebecRegions: QuebecRegion[] = Array.from(
  new Set(quebecMunicipalities.map((m) => m.region)),
).sort((a, b) => a.localeCompare(b, "fr")) as QuebecRegion[];

export const findMunicipalityBySlug = (slug: string): Municipality | undefined =>
  quebecMunicipalities.find((m) => m.slug === slug);

export const SERVICE_TYPES = [
  { slug: "reparation-spa", label: "Réparation de spa", verb: "Réparation" },
  { slug: "installation-spa", label: "Installation de spa", verb: "Installation" },
  { slug: "ouverture-spa", label: "Ouverture de spa", verb: "Ouverture" },
  { slug: "fermeture-spa", label: "Fermeture de spa", verb: "Fermeture" },
  { slug: "entretien-spa", label: "Entretien de spa", verb: "Entretien" },
] as const;

export type ServiceSlug = (typeof SERVICE_TYPES)[number]["slug"];

export const findServiceBySlug = (slug: string) =>
  SERVICE_TYPES.find((s) => s.slug === slug);
