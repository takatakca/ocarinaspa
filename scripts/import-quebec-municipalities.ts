/**
 * Importateur officiel — Répertoire des municipalités du Québec (MAMH / Données Québec)
 *
 * Source: https://www.donneesquebec.ca/recherche/dataset/repertoire-des-municipalites-du-quebec
 * Fichiers utilisés:
 *   - MUN.csv (toutes les municipalités: villes, paroisses, villages, cantons, etc.)
 *   - ARR.csv (arrondissements de Montréal, Québec, Lévis, Saguenay, Sherbrooke, Longueuil)
 *
 * Usage:
 *   bun run scripts/import-quebec-municipalities.ts
 *
 * Génère:
 *   - src/data/quebecMunicipalities.json
 *   - src/data/quebecRegions.json
 */
import { writeFileSync } from "node:fs";

const MUN_URL = "https://donneesouvertes.affmunqc.net/repertoire/MUN.csv";
const ARR_URL = "https://donneesouvertes.affmunqc.net/repertoire/ARR.csv";

const DESI: Record<string, string> = {
  "01": "Cité", "02": "Municipalité", "03": "Paroisse", "04": "Canton",
  "05": "Cantons-Unis", "06": "Village", "07": "Village nordique",
  "08": "Village cri", "09": "Village naskapi", "10": "Ville",
  "11": "Municipalité", "12": "Territoire", "13": "Gouvernement régional",
};

const slugify = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
   .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const parseParen = (s: string): [string | null, string | null] => {
  const m = s.trim().match(/^(.*?)\s*\((\d+)\)\s*$/);
  return m ? [m[1].trim(), m[2]] : [s.trim() || null, null];
};

// Minimal CSV parser (handles quoted fields)
function parseCSV(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let cur: string[] = [], field = "", inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') inQ = false;
      else field += c;
    } else if (c === '"') inQ = true;
    else if (c === ",") { cur.push(field); field = ""; }
    else if (c === "\n") { cur.push(field); rows.push(cur); cur = []; field = ""; }
    else if (c !== "\r") field += c;
  }
  if (field || cur.length) { cur.push(field); rows.push(cur); }
  const headers = rows[0].map((h) => h.replace(/^\uFEFF/, ""));
  return rows.slice(1).filter((r) => r.length > 1).map((r) => {
    const o: Record<string, string> = {};
    headers.forEach((h, i) => (o[h] = r[i] ?? ""));
    return o;
  });
}

async function main() {
  console.log("Téléchargement des données MAMH...");
  const [munTxt, arrTxt] = await Promise.all([
    fetch(MUN_URL).then((r) => r.text()),
    fetch(ARR_URL).then((r) => r.text()),
  ]);

  const out: any[] = [];
  for (const r of parseCSV(munTxt)) {
    if (!r.munnom) continue;
    const [region] = parseParen(r.regadm || "");
    const [mrc] = parseParen(r.mrc || "");
    out.push({
      code: r.mcode,
      name: r.munnom,
      slug: slugify(r.munnom),
      type: DESI[r.mcodedesi] ?? r.mdes ?? "Municipalité",
      region,
      mrc: mrc || null,
      population: parseInt(r.mpopul) || null,
      kind: "municipalite",
    });
  }
  for (const r of parseCSV(arrTxt)) {
    if (!r.arrnom) continue;
    const [region] = parseParen(r.arrregion || "");
    out.push({
      code: r.arrcod,
      name: r.arrnom,
      slug: slugify(`${r.arrnom}-${r.arrville}`),
      type: "Arrondissement",
      region,
      mrc: null,
      population: null,
      kind: "arrondissement",
      city: r.arrville,
    });
  }

  // Dedupe by slug
  const seen = new Set<string>();
  const uniq = out.filter((r) => (seen.has(r.slug) ? false : seen.add(r.slug)));
  uniq.sort((a, b) => a.name.localeCompare(b.name, "fr"));

  writeFileSync("src/data/quebecMunicipalities.json", JSON.stringify(uniq));
  const regions = Array.from(new Set(uniq.map((r) => r.region).filter(Boolean))).sort();
  writeFileSync("src/data/quebecRegions.json", JSON.stringify(regions));
  console.log(`✓ ${uniq.length} municipalités, ${regions.length} régions`);
}

main();
