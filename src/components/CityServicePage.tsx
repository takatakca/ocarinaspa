import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { ServiceRequestForm } from "@/components/ServiceRequestForm";
import { findMunicipalityBySlug, findServiceBySlug, type ServiceSlug } from "@/data/quebecMunicipalities";
import { Phone, CheckCircle2, MapPin } from "lucide-react";
import { SITE, serviceSchema, faqSchema, localBusinessSchema } from "@/lib/seo";

export interface CityServicePageProps {
  serviceSlug: ServiceSlug;
  villeSlug: string;
}

export function CityServicePage({ serviceSlug, villeSlug }: CityServicePageProps) {
  const muni = findMunicipalityBySlug(villeSlug);
  const service = findServiceBySlug(serviceSlug);
  if (!muni || !service) throw notFound();

  const title = `${service.label} à ${muni.name}`;

  const faqs = [
    {
      q: `Offrez-vous un service de ${service.verb.toLowerCase()} à ${muni.name} ?`,
      a: `Oui, nous offrons le service de ${service.label.toLowerCase()} à domicile à ${muni.name} et dans toute la région ${muni.region}.`,
    },
    {
      q: `Combien coûte ${service.label.toLowerCase()} à ${muni.name} ?`,
      a: `Le prix dépend du modèle et du travail requis. Appelez-nous au ${SITE.phone} pour une soumission rapide et sans engagement.`,
    },
    {
      q: `Quels modèles de spas réparez-vous ?`,
      a: `Nous travaillons sur toutes les marques et tous les modèles de spas et bains à remous au Québec.`,
    },
  ];

  return (
    <Layout>
      <section className="bg-surface py-14">
        <div className="container mx-auto px-4">
          <nav className="text-xs text-muted-foreground flex items-center gap-2">
            <Link to="/" className="hover:text-brand">Accueil</Link>
            <span>/</span>
            <Link to="/villes" className="hover:text-brand">Villes</Link>
            <span>/</span>
            <span>{muni.name}</span>
          </nav>
          <h1 className="mt-3 font-display text-3xl md:text-5xl font-bold text-foreground">
            {service.label} à <span className="text-brand">{muni.name}</span>
          </h1>
          <p className="mt-4 text-muted-foreground max-w-2xl">
            Service de {service.label.toLowerCase()} à domicile à {muni.name} et partout dans la région {muni.region}.
            Plus de 20 ans d'expertise. Service rapide, professionnel et garanti.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={`tel:${SITE.phoneTel}`}
              className="inline-flex items-center gap-2 bg-brand text-brand-foreground px-5 py-3 rounded-md font-semibold hover:bg-brand-dark transition-colors"
            >
              <Phone className="w-4 h-4" /> {SITE.phone}
            </a>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 border-2 border-brand text-brand px-5 py-3 rounded-md font-semibold hover:bg-brand hover:text-brand-foreground transition-colors"
            >
              Demander une soumission
            </Link>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-14 grid lg:grid-cols-[2fr_1fr] gap-10">
        <div className="space-y-6">
          <h2 className="font-display text-2xl font-bold text-foreground">
            Pourquoi choisir Ocarina Spa à {muni.name} ?
          </h2>
          <ul className="grid sm:grid-cols-2 gap-3">
            {[
              "Service à domicile à " + muni.name,
              "Plus de 20 ans d'expertise",
              "Toutes marques de spas",
              "Pièces fournies sur place",
              "Soumission rapide et sans frais",
              "Disponible 24h sur 24",
            ].map((b) => (
              <li key={b} className="flex items-start gap-2 text-foreground">
                <CheckCircle2 className="w-5 h-5 text-brand shrink-0 mt-0.5" /> {b}
              </li>
            ))}
          </ul>

          <h2 className="font-display text-2xl font-bold text-foreground pt-6">Questions fréquentes</h2>
          <div className="space-y-4">
            {faqs.map((f) => (
              <div key={f.q} className="border border-border rounded-lg p-5 bg-card">
                <h3 className="font-semibold text-foreground">{f.q}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.a}</p>
              </div>
            ))}
          </div>

          <div className="pt-6">
            <h2 className="font-display text-2xl font-bold text-foreground mb-3">
              Autres services à {muni.name}
            </h2>
            <div className="flex flex-wrap gap-2">
              {(["reparation-spa","installation-spa","ouverture-spa","fermeture-spa","entretien-spa"] as const)
                .filter((s) => s !== serviceSlug)
                .map((s) => {
                  const svc = findServiceBySlug(s)!;
                  const path = `/${s}/${muni.slug}`;
                  return (
                    <a
                      key={s}
                      href={path}
                      className="inline-flex items-center gap-1.5 border border-border px-3 py-1.5 rounded-md text-sm hover:border-brand hover:text-brand transition-colors"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      {svc.verb} à {muni.name}
                    </a>
                  );
                })}
            </div>
          </div>
        </div>
        <div>
          <ServiceRequestForm defaultCity={muni.name} defaultService={service.label} />
        </div>
      </section>
    </Layout>
  );
}

export const cityServiceHead = (serviceSlug: ServiceSlug, villeSlug: string) => {
  const muni = findMunicipalityBySlug(villeSlug);
  const service = findServiceBySlug(serviceSlug);
  if (!muni || !service) {
    return {
      meta: [{ title: "Service non trouvé — Ocarina Spa Québec" }],
    };
  }
  const title = `${service.label} à ${muni.name} — Ocarina Spa Québec`;
  const description = `Service de ${service.label.toLowerCase()} à ${muni.name}, ${muni.region}. Expert en spas depuis 20 ans. Appelez le ${SITE.phone}.`;
  const faqs = [
    { q: `Offrez-vous le service de ${service.verb.toLowerCase()} à ${muni.name} ?`, a: `Oui, nous offrons ce service à ${muni.name} et toute la région ${muni.region}.` },
    { q: `Quel est le prix ?`, a: `Appelez le ${SITE.phone} pour une soumission gratuite.` },
  ];
  return {
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
    ],
    scripts: [
      { type: "application/ld+json", children: JSON.stringify(localBusinessSchema()) },
      { type: "application/ld+json", children: JSON.stringify(serviceSchema(service.label, muni.name)) },
      { type: "application/ld+json", children: JSON.stringify(faqSchema(faqs)) },
    ],
  };
};

// Re-export utility used by route files
export { findMunicipalityBySlug, findServiceBySlug };
