import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { StoreLocator } from "@/components/StoreLocator";
import { SITE, localBusinessSchema, altLinks } from "@/lib/seo";

const PAGE_URL = `${SITE.domain}/succursales`;

export const Route = createFileRoute("/succursales")({
  head: () => ({
    meta: [
      { title: "Ocarina Spa Québec | Réparation de spa à Bécancour" },
      {
        name: "description",
        content:
          "Réparation de spa, vente de spas, pièces et service partout au Québec. Contactez Ocarina Spa au 819-913-7727.",
      },
      { property: "og:title", content: "Ocarina Spa Québec — Nous trouver" },
      {
        property: "og:description",
        content: "Succursale de Bécancour. Réparation, vente et entretien de spas partout au Québec.",
      },
      { property: "og:url", content: PAGE_URL },
    ],
    links: altLinks({ path: "/succursales", enPath: null }),
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          ...localBusinessSchema({ areaName: "Québec" }),
          geo: {
            "@type": "GeoCoordinates",
            latitude: 46.3144671,
            longitude: -72.5275818,
          },
          hasMap: "https://www.google.com/maps/place/?q=place_id:ChIJjY1BYLHFx0wRqWNnXpOeGBI",
        }),
      },
    ],
  }),
  component: SuccursalesPage,
});

function SuccursalesPage() {
  return (
    <Layout>
      <section className="bg-surface py-12">
        <div className="container mx-auto px-4">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground">
            Nous trouver
          </h1>
          <p className="mt-4 text-muted-foreground max-w-2xl">
            Notre succursale est située à Bécancour. Nous desservons toutes les régions du Québec
            pour la réparation, l'entretien et la vente de spas.
          </p>
        </div>
      </section>
      <StoreLocator />
    </Layout>
  );
}
