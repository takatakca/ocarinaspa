import { createFileRoute, Link } from "@tanstack/react-router";
import { Phone } from "lucide-react";
import { Layout } from "@/components/Layout";
import { SpaBrands } from "@/components/SpaBrands";
import { ServiceRequestForm } from "@/components/ServiceRequestForm";
import { SITE, localBusinessSchema, altLinks, breadcrumbSchema } from "@/lib/seo";
import { ALL_BRANDS } from "@/data/spaBrands";
import technicianImg from "@/assets/spa-technician-repair.jpg";
import winterSpaImg from "@/assets/spa-winter-quebec.jpg";

export const Route = createFileRoute("/marques")({
  head: () => ({
    meta: [
      { title: "Marques de spas réparées au Québec — Ocarina Spa" },
      {
        name: "description",
        content:
          "Ocarina Spa répare une grande variété de marques de spas au Québec : Jacuzzi, Hydropool, Arctic Spas, Beachcomber, Sundance, Maax, Vita Spa, Bullfrog, Hot Spring, Balboa, Gecko et plus.",
      },
      { property: "og:title", content: "Marques de spas réparées au Québec — Ocarina Spa" },
      {
        property: "og:description",
        content:
          "Réparation toutes marques : Jacuzzi, Hydropool, Arctic Spas, Beachcomber, Sundance, Maax, Bullfrog, systèmes Balboa et Gecko.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: SITE.domain + "/marques" },
    ],
    links: altLinks({ path: "/marques", enPath: null }),
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(
          localBusinessSchema({ areaName: "Québec" }),
        ),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify(
          breadcrumbSchema([
            { name: "Accueil", url: SITE.domain + "/" },
            { name: "Marques de spas", url: SITE.domain + "/marques" },
          ]),
        ),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "Marques de spas réparées par Ocarina Spa",
          itemListElement: ALL_BRANDS.map((b, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: b,
          })),
        }),
      },
    ],
  }),
  component: MarquesPage,
});

function MarquesPage() {
  return (
    <Layout>
      <section className="bg-surface">
        <div className="container mx-auto px-4 py-14 md:py-20 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-brand font-semibold uppercase text-sm tracking-wide">
              Réparation de spa au Québec
            </p>
            <h1 className="mt-3 font-display text-4xl md:text-5xl font-bold text-foreground">
              Marques de spas que nous réparons au Québec
            </h1>
            <p className="mt-5 text-lg text-muted-foreground">
              Ocarina Spa répare la majorité des marques de spas présentes au Québec, incluant
              Jacuzzi, Hydropool, Arctic Spas, Beachcomber, Sundance Spas, Maax Spas, Vita Spa,
              Bullfrog Spas, Master Spas, Hot Spring, Caldera, Coast Spas et plusieurs autres.
              Même si les marques sont différentes, plusieurs spas utilisent des composantes
              communes comme Balboa, Gecko, Waterway ou LX. Nous pouvons donc diagnostiquer et
              réparer les problèmes fréquents : chauffage, pompe, fuite, jets, panneau de
              contrôle, pack électronique, filtration, ozonateur et problèmes électriques.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a
                href={`tel:${SITE.phoneTel}`}
                className="inline-flex items-center gap-2 bg-brand text-brand-foreground px-6 py-3 rounded-md font-semibold hover:bg-brand-dark transition-colors"
              >
                <Phone className="w-5 h-5" /> Appeler {SITE.phone}
              </a>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 border-2 border-brand text-brand px-6 py-3 rounded-md font-semibold hover:bg-brand hover:text-brand-foreground transition-colors"
              >
                Demander un diagnostic
              </Link>
            </div>
          </div>
          <img
            src={technicianImg}
            alt="Technicien Ocarina Spa réparant un pack électronique et une pompe de spa"
            width={1600}
            height={1000}
            className="w-full h-auto rounded-2xl shadow-2xl"
          />
        </div>
      </section>

      <SpaBrands />

      <section className="bg-surface">
        <div className="container mx-auto px-4 py-16 grid lg:grid-cols-2 gap-10">
          <div>
            <h2 className="font-display text-3xl font-bold text-foreground">
              Réparation de spa usagé acheté sur Marketplace
            </h2>
            <p className="mt-4 text-muted-foreground">
              Vous venez d'acheter un spa usagé sur Marketplace ou Kijiji ? Nous offrons un
              service complet de diagnostic, remise en service et réparation — peu importe la
              marque ou l'année.
            </p>
            <p className="mt-3 text-muted-foreground">
              Service de réparation de spa à Montréal, Laval, Trois-Rivières, Québec et
              partout dans la province.
            </p>
          </div>
          <ServiceRequestForm />
        </div>
      </section>
    </Layout>
  );
}
