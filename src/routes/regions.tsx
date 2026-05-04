import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { quebecMunicipalities, quebecRegions } from "@/data/quebecMunicipalities";
import { MapPin } from "lucide-react";

export const Route = createFileRoute("/regions")({
  head: () => ({
    meta: [
      { title: "Régions desservies au Québec — Ocarina Spa" },
      { name: "description", content: "Service de spa et piscine dans toutes les régions administratives du Québec : Montréal, Laval, Montérégie, Laurentides, Lanaudière, Mauricie, Estrie, Capitale-Nationale et plus." },
      { property: "og:title", content: "Régions desservies au Québec — Ocarina Spa" },
      { property: "og:description", content: "17 régions administratives du Québec couvertes par notre service mobile." },
    ],
  }),
  component: () => {
    const grouped = quebecRegions.map((r) => ({
      region: r,
      cities: quebecMunicipalities.filter((m) => m.region === r),
    }));
    return (
      <Layout>
        <section className="bg-surface py-14">
          <div className="container mx-auto px-4">
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground">Régions desservies au Québec</h1>
            <p className="mt-4 text-muted-foreground max-w-2xl">
              Notre service mobile couvre les 17 régions administratives du Québec, soit {quebecMunicipalities.length} municipalités et arrondissements.
            </p>
          </div>
        </section>
        <section className="container mx-auto px-4 py-12 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {grouped.map((g) => (
            <div key={g.region} className="bg-card border border-border rounded-xl p-5">
              <h2 className="font-display text-xl font-bold text-brand">{g.region}</h2>
              <p className="text-sm text-muted-foreground mt-1">{g.cities.length} municipalités</p>
              <ul className="mt-3 space-y-1 text-sm">
                {g.cities.slice(0, 8).map((c) => (
                  <li key={c.slug}>
                    <Link to="/reparation-spa/$ville" params={{ ville: c.slug }} className="text-foreground hover:text-brand inline-flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-brand/60" /> {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
              {g.cities.length > 8 && (
                <Link to="/villes" className="inline-block mt-3 text-sm text-brand hover:underline">
                  + {g.cities.length - 8} autres villes →
                </Link>
              )}
            </div>
          ))}
        </section>
      </Layout>
    );
  },
});
