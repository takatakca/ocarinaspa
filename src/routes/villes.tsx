import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { quebecMunicipalities, SEO_INDEXED_CITY_SLUGS } from "@/data/quebecMunicipalities";
import { MapPin, Phone } from "lucide-react";
import { SITE } from "@/lib/seo";
import { trackPhoneCall } from "@/lib/gtag";

const priorityCities = SEO_INDEXED_CITY_SLUGS
  .map((slug) => quebecMunicipalities.find((m) => m.slug === slug))
  .filter(Boolean) as typeof quebecMunicipalities;

export const Route = createFileRoute("/villes")({
  head: () => ({
    meta: [
      { title: "Zones desservies au Québec — Ocarina Spa" },
      {
        name: "description",
        content:
          "Principales zones de service Ocarina Spa au Québec. Confirmez votre ville et la disponibilité avant l'intervention.",
      },
      { property: "og:title", content: "Zones desservies — Ocarina Spa" },
      {
        property: "og:description",
        content: "Principaux secteurs desservis pour la réparation et l'entretien de spas au Québec.",
      },
    ],
  }),
  component: Villes,
});

function Villes() {
  return (
    <Layout>
      <section className="bg-surface py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <p className="text-brand font-semibold uppercase text-sm tracking-wide">Service mobile</p>
          <h1 className="mt-3 font-display text-4xl md:text-5xl font-bold text-foreground">
            Zones desservies au Québec
          </h1>
          <p className="mt-4 text-muted-foreground max-w-2xl">
            Voici nos principaux secteurs de service. La disponibilité varie selon la nature de
            l'intervention, la distance et l'horaire. Si votre ville n'apparaît pas, appelez-nous
            pour confirmer le déplacement avant de réserver.
          </p>
          <a
            href={`tel:${SITE.phoneTel}`}
            onClick={trackPhoneCall}
            className="mt-6 inline-flex items-center gap-2 bg-brand text-brand-foreground px-5 py-3 rounded-md font-semibold hover:bg-brand-dark"
          >
            <Phone className="w-4 h-4" /> Confirmer ma zone — {SITE.phone}
          </a>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {priorityCities.map((m) => (
            <Link
              key={m.slug}
              to="/reparation-spa/$ville"
              params={{ ville: m.slug }}
              className="bg-card border border-border rounded-xl p-5 hover:border-brand transition-colors"
            >
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-brand mt-0.5 shrink-0" />
                <div>
                  <h2 className="font-display text-xl font-bold text-foreground">{m.name}</h2>
                  <p className="text-sm text-muted-foreground mt-1">{m.region}</p>
                  <p className="text-sm text-brand mt-3 font-medium">Voir le service de réparation →</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </Layout>
  );
}
