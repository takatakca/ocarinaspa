import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Layout } from "@/components/Layout";
import {
  quebecMunicipalities,
  quebecRegions,
} from "@/data/quebecMunicipalities";
import { Search, MapPin } from "lucide-react";

export const Route = createFileRoute("/villes")({
  head: () => ({
    meta: [
      { title: "Toutes les villes desservies au Québec — Ocarina Spa" },
      { name: "description", content: "Liste complète des villes, municipalités et arrondissements du Québec où Ocarina Spa offre ses services de réparation et d'installation de spas." },
      { property: "og:title", content: "Villes desservies au Québec — Ocarina Spa" },
      { property: "og:description", content: "Recherchez votre ville parmi toutes les municipalités du Québec." },
    ],
  }),
  component: Villes,
});

function Villes() {
  const [q, setQ] = useState("");
  const [region, setRegion] = useState<string>("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return quebecMunicipalities.filter((m) => {
      if (region && m.region !== region) return false;
      if (needle && !m.name.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [q, region]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof quebecMunicipalities>();
    for (const m of filtered) {
      const letter = m.name[0].toUpperCase();
      if (!map.has(letter)) map.set(letter, []);
      map.get(letter)!.push(m);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b, "fr"));
  }, [filtered]);

  return (
    <Layout>
      <section className="bg-surface py-16">
        <div className="container mx-auto px-4">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground">
            Villes desservies au Québec
          </h1>
          <p className="mt-4 text-muted-foreground max-w-2xl">
            {quebecMunicipalities.length} villes, municipalités et arrondissements où nous offrons nos services de spa.
          </p>

          <div className="mt-8 grid sm:grid-cols-[1fr_auto] gap-3 max-w-3xl">
            <div className="relative">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Rechercher une ville..."
                className="w-full pl-10 pr-3 py-3 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="px-3 py-3 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-brand"
            >
              <option value="">Toutes les régions</option>
              {quebecRegions.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        {grouped.length === 0 ? (
          <p className="text-muted-foreground">Aucune ville trouvée.</p>
        ) : (
          <div className="space-y-10">
            {grouped.map(([letter, list]) => (
              <div key={letter}>
                <h2 className="font-display text-3xl font-bold text-brand border-b border-border pb-2">
                  {letter}
                </h2>
                <ul className="mt-4 grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-2">
                  {list.map((m) => (
                    <li key={m.slug}>
                      <Link
                        to="/reparation-spa/$ville"
                        params={{ ville: m.slug }}
                        className="flex items-center gap-2 py-1.5 text-foreground hover:text-brand transition-colors"
                      >
                        <MapPin className="w-3.5 h-3.5 text-brand/60" />
                        <span>{m.name}</span>
                        <span className="text-xs text-muted-foreground">({m.region})</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>
    </Layout>
  );
}
