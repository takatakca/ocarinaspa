import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { quebecMunicipalities, SEO_INDEXED_CITY_SLUGS } from "@/data/quebecMunicipalities";
import { MapPin } from "lucide-react";

const priorityCities = SEO_INDEXED_CITY_SLUGS
  .map((slug) => quebecMunicipalities.find((m) => m.slug === slug))
  .filter(Boolean) as typeof quebecMunicipalities;

const grouped = Array.from(
  priorityCities.reduce((map, city) => {
    const list = map.get(city.region) ?? [];
    list.push(city);
    map.set(city.region, list);
    return map;
  }, new Map<string, typeof quebecMunicipalities>()),
).sort(([a], [b]) => a.localeCompare(b, "fr"));

export const Route = createFileRoute("/regions")({
  head: () => ({
    meta: [
      { title: "Secteurs de service au Québec — Ocarina Spa" },
      {
        name: "description",
        content:
          "Principaux secteurs régionaux desservis par Ocarina Spa. La disponibilité est confirmée avant chaque intervention.",
      },
      { property: "og:title", content: "Secteurs de service — Ocarina Spa" },
      {
        property: "og:description",
        content: "Consultez les principaux secteurs où le service mobile Ocarina Spa est offert.",
      },
    ],
  }),
  component: () => (
    <Layout>
      <section className="bg-surface py-14">
        <div className="container mx-auto px-4 max-w-4xl">
          <p className="text-brand font-semibold uppercase text-sm tracking-wide">Couverture</p>
          <h1 className="mt-3 font-display text-4xl md:text-5xl font-bold text-foreground">
            Secteurs de service au Québec
          </h1>
          <p className="mt-4 text-muted-foreground max-w-2xl">
            Nous concentrons le service mobile sur les secteurs ci-dessous. Pour une autre
            municipalité, communiquez avec nous : le déplacement est confirmé selon la distance,
            le type de réparation et la disponibilité.
          </p>
        </div>
      </section>
      <section className="container mx-auto px-4 py-12 grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl">
        {grouped.map(([region, cities]) => (
          <div key={region} className="bg-card border border-border rounded-xl p-5">
            <h2 className="font-display text-xl font-bold text-brand">{region}</h2>
            <ul className="mt-4 space-y-2 text-sm">
              {cities.map((city) => (
                <li key={city.slug}>
                  <Link
                    to="/reparation-spa/$ville"
                    params={{ ville: city.slug }}
                    className="text-foreground hover:text-brand inline-flex items-center gap-1.5"
                  >
                    <MapPin className="w-3.5 h-3.5 text-brand/70" /> {city.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </Layout>
  ),
});
