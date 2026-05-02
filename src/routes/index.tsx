import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { ServiceCards } from "@/components/ServiceCards";
import { ServiceRequestForm } from "@/components/ServiceRequestForm";
import { Link } from "@tanstack/react-router";
import { Phone, CheckCircle2 } from "lucide-react";
import heroVan from "@/assets/hero-van.jpg";
import { SITE, localBusinessSchema } from "@/lib/seo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ocarina Spa Québec — Réparation & installation de spas partout au Québec" },
      { name: "description", content: "Spécialiste en réparation, installation, ouverture, fermeture et entretien de spas. Service à domicile partout au Québec. (819) 913-7727." },
      { property: "og:title", content: "Ocarina Spa Québec — Réparation et installation de spas" },
      { property: "og:description", content: "Service à domicile partout au Québec. 20 ans d'expertise. Appelez le (819) 913-7727." },
      { property: "og:type", content: "website" },
    ],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify(localBusinessSchema()),
    }],
  }),
  component: Index,
});

function Index() {
  return (
    <Layout>
      {/* HERO */}
      <section className="bg-surface">
        <div className="container mx-auto px-4 py-16 md:py-24 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-brand font-semibold tracking-wide uppercase text-sm">Partout au Québec</p>
            <h1 className="mt-3 font-display text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-foreground">
              Spécialiste en <span className="text-brand">réparation</span> et <span className="text-brand">installation</span> de spas
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-lg">
              Service à domicile dans toutes les régions du Québec. Diagnostic, réparation, ouverture, fermeture et entretien — par une équipe experte depuis plus de 20 ans.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href={`tel:${SITE.phoneTel}`}
                className="inline-flex items-center gap-2 bg-brand text-brand-foreground px-6 py-3.5 rounded-md font-semibold text-lg hover:bg-brand-dark transition-colors shadow-lg shadow-brand/30"
              >
                <Phone className="w-5 h-5" /> {SITE.phone}
              </a>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 border-2 border-brand text-brand px-6 py-3.5 rounded-md font-semibold text-lg hover:bg-brand hover:text-brand-foreground transition-colors"
              >
                Demander un service
              </Link>
            </div>
            <ul className="mt-8 grid sm:grid-cols-2 gap-2 text-sm">
              {["20 ans d'expertise", "Service à domicile", "Toutes marques de spas", "Pièces fournies sur place"].map((f) => (
                <li key={f} className="flex items-center gap-2 text-foreground">
                  <CheckCircle2 className="w-4 h-4 text-brand" /> {f}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative">
            <img
              src={heroVan}
              alt="Camion de service Ocarina Spa Québec"
              width={1536}
              height={1024}
              className="w-full h-auto rounded-2xl shadow-2xl"
            />
          </div>
        </div>
      </section>

      <ServiceCards />

      {/* About */}
      <section className="container mx-auto px-4 py-20 grid lg:grid-cols-2 gap-12 items-start">
        <div>
          <p className="text-brand font-semibold uppercase text-sm tracking-wide">À propos</p>
          <h2 className="mt-3 font-display text-3xl md:text-4xl font-bold text-foreground">
            Spécialiste en réparation de spas depuis 20 ans
          </h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Quel que soit le problème que vous avez avec votre spa, nous nous déplaçons pour en faire l'analyse et, dans la grande majorité des cas, la réparation se fait dès le premier rendez-vous. Nous offrons un service tout inclus à un prix défiant toute compétition.
          </p>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Nous fournissons sur place toutes les pièces requises — souvent moins cher qu'en magasin — pour éviter d'attendre la livraison de nouvelles pièces.
          </p>
          <Link
            to="/villes"
            className="inline-block mt-6 text-brand font-semibold hover:underline"
          >
            Voir toutes les villes desservies →
          </Link>
        </div>
        <ServiceRequestForm />
      </section>
    </Layout>
  );
}
