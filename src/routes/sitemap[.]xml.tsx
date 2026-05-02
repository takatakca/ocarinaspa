import { createFileRoute } from "@tanstack/react-router";
import { quebecMunicipalities, SERVICE_TYPES } from "@/data/quebecMunicipalities";
import { SITE } from "@/lib/seo";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: () => {
        const base = SITE.domain;
        const urls: string[] = [
          `${base}/`,
          `${base}/services`,
          `${base}/villes`,
          `${base}/contact`,
        ];
        for (const s of SERVICE_TYPES) {
          for (const m of quebecMunicipalities) {
            urls.push(`${base}/${s.slug}/${m.slug}`);
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
