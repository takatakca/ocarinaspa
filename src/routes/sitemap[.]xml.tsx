import { createFileRoute } from "@tanstack/react-router";
import { quebecMunicipalities, SERVICE_TYPES, isSeoIndexedServicePage } from "@/data/quebecMunicipalities";
import { SITE } from "@/lib/seo";

const BASE = SITE.domain;

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: () => {
        const urls: string[] = [
          `${BASE}/`,
          `${BASE}/en`,
          `${BASE}/es`,
          `${BASE}/services`,
          `${BASE}/piscine`,
          `${BASE}/vente-spas`,
          `${BASE}/marques`,
          `${BASE}/pieces`,
          `${BASE}/codes-erreur`,
          `${BASE}/diagnostic`,
          `${BASE}/urgence-spa`,
          `${BASE}/regions`,
          `${BASE}/villes`,
          `${BASE}/contact`,
          `${BASE}/succursales`,
          `${BASE}/confidentialite`,
        ];
        for (const s of SERVICE_TYPES) {
          for (const m of quebecMunicipalities) {
            if (isSeoIndexedServicePage(s.slug, m.slug)) urls.push(`${BASE}/${s.slug}/${m.slug}`);
          }
        }
        const xml =
          `<?xml version="1.0" encoding="UTF-8"?>\n` +
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
          urls.map((u) => `  <url><loc>${u}</loc></url>`).join("\n") +
          `\n</urlset>`;
        return new Response(xml, {
          headers: { "Content-Type": "application/xml; charset=utf-8" },
        });
      },
    },
  },
});
