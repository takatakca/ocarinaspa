import { Link, notFound } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { ServiceRequestForm } from "@/components/ServiceRequestForm";
import { findMunicipalityBySlug, findServiceBySlug, SERVICE_TYPES, type ServiceSlug } from "@/data/quebecMunicipalities";
import { Phone, CheckCircle2, MapPin } from "lucide-react";
import { SITE, serviceSchema, faqSchema, localBusinessSchema, breadcrumbSchema } from "@/lib/seo";

export interface CityServicePageProps {
  serviceSlug: ServiceSlug;
  villeSlug: string;
}

const COPY: Record<string, {
  intro: (svc: string, city: string, region: string) => string;
  benefits: (city: string) => string[];
  why: (city: string) => string;
  faq: (svc: string, verb: string, city: string, region: string) => Array<{ q: string; a: string }>;
}> = {
  spa: {
    intro: (svc, city, region) =>
      `Service de ${svc.toLowerCase()} à domicile à ${city} et partout dans la région ${region}. Plus de 20 ans d'expertise. Service rapide, professionnel et garanti sur tous les modèles de spas et bains à remous.`,
    benefits: (city) => [
      `Service à domicile à ${city}`,
      "Plus de 20 ans d'expertise",
      "Toutes marques de spas (Sundance, Jacuzzi, Coast, Vita, Beachcomber, etc.)",
      "Pièces fournies sur place",
      "Soumission rapide et sans frais",
      "Diagnostic professionnel",
    ],
    why: (city) => `Pourquoi choisir Ocarina Spa à ${city} ?`,
    faq: (svc, verb, city, region) => [
      { q: `Offrez-vous le service de ${verb.toLowerCase()} de spa à ${city} ?`, a: `Oui, nous nous déplaçons à ${city} et dans toute la région ${region} pour le service de ${svc.toLowerCase()}.` },
      { q: `Combien coûte ${svc.toLowerCase()} à ${city} ?`, a: `Le prix dépend du modèle et du travail requis. Appelez-nous au ${SITE.phone} pour une soumission rapide et sans engagement.` },
      { q: `Quelles marques de spas réparez-vous ?`, a: `Nous travaillons sur toutes les marques et tous les modèles de spas et bains à remous au Québec.` },
    ],
  },
  "spa-en": {
    intro: (svc, city) =>
      `Professional ${svc.toLowerCase()} service at your home in ${city}, Quebec. Over 20 years of experience. Fast, reliable service on all hot tub brands and models.`,
    benefits: (city) => [
      `On-site service in ${city}`,
      "20+ years of experience",
      "All hot tub brands serviced",
      "Parts available on site",
      "Free, fast quote",
      "Expert diagnostics",
    ],
    why: (city) => `Why choose Ocarina Spa in ${city}?`,
    faq: (svc, _verb, city) => [
      { q: `Do you offer ${svc.toLowerCase()} in ${city}?`, a: `Yes, we serve ${city} and the surrounding area for ${svc.toLowerCase()}.` },
      { q: `How much does ${svc.toLowerCase()} cost in ${city}?`, a: `Price depends on the model and work needed. Call ${SITE.phone} for a free quote.` },
      { q: `Which hot tub brands do you service?`, a: `We service all hot tub brands and models throughout Quebec.` },
    ],
  },
  piscine: {
    intro: (svc, city, region) =>
      `Service de ${svc.toLowerCase()} à domicile à ${city} et dans toute la région ${region}. Spécialistes piscines creusées et hors-terre. Service professionnel, rapide et garanti.`,
    benefits: (city) => [
      `Service à domicile à ${city}`,
      "Piscines creusées et hors-terre",
      "Équipe expérimentée",
      "Produits et accessoires fournis",
      "Soumission rapide et gratuite",
      "Disponibilité saisonnière",
    ],
    why: (city) => `Pourquoi choisir Ocarina pour votre piscine à ${city} ?`,
    faq: (svc, verb, city, region) => [
      { q: `Offrez-vous le service de ${verb.toLowerCase()} de piscine à ${city} ?`, a: `Oui, nous offrons le service de ${svc.toLowerCase()} à ${city} et toute la région ${region}.` },
      { q: `Quel est le prix pour ${svc.toLowerCase()} à ${city} ?`, a: `Appelez-nous au ${SITE.phone} pour une soumission rapide et sans engagement.` },
      { q: `Travaillez-vous sur tous les types de piscines ?`, a: `Oui, piscines creusées, semi-creusées et hors-terre, toutes marques.` },
    ],
  },
};

export function CityServicePage({ serviceSlug, villeSlug }: CityServicePageProps) {
  const muni = findMunicipalityBySlug(villeSlug);
  const service = findServiceBySlug(serviceSlug);
  if (!muni || !service) throw notFound();

  const copy = COPY[service.category] ?? COPY.spa;
  const region = muni.region ?? "Québec";
  const faqs = copy.faq(service.label, service.verb, muni.name, region);
  const isEn = service.category === "spa-en";

  // Related services in the same category
  const related = SERVICE_TYPES.filter(
    (s) => s.category === service.category && s.slug !== service.slug,
  );

  return (
    <Layout>
      <section className="bg-surface py-14">
        <div className="container mx-auto px-4">
          <nav className="text-xs text-muted-foreground flex items-center gap-2">
            <Link to="/" className="hover:text-brand">{isEn ? "Home" : "Accueil"}</Link>
            <span>/</span>
            <Link to="/villes" className="hover:text-brand">{isEn ? "Cities" : "Villes"}</Link>
            <span>/</span>
            <span>{muni.name}</span>
          </nav>
          <h1 className="mt-3 font-display text-3xl md:text-5xl font-bold text-foreground">
            {service.label} {isEn ? "in" : "à"} <span className="text-brand">{muni.name}</span>
          </h1>
          <p className="mt-4 text-muted-foreground max-w-2xl">
            {copy.intro(service.label, muni.name, region)}
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
              {isEn ? "Request a quote" : "Demander une soumission"}
            </Link>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-14 grid lg:grid-cols-[2fr_1fr] gap-10">
        <div className="space-y-6">
          <h2 className="font-display text-2xl font-bold text-foreground">{copy.why(muni.name)}</h2>
          <ul className="grid sm:grid-cols-2 gap-3">
            {copy.benefits(muni.name).map((b) => (
              <li key={b} className="flex items-start gap-2 text-foreground">
                <CheckCircle2 className="w-5 h-5 text-brand shrink-0 mt-0.5" /> {b}
              </li>
            ))}
          </ul>

          <h2 className="font-display text-2xl font-bold text-foreground pt-6">
            {isEn ? "Frequently asked questions" : "Questions fréquentes"}
          </h2>
          <div className="space-y-4">
            {faqs.map((f) => (
              <div key={f.q} className="border border-border rounded-lg p-5 bg-card">
                <h3 className="font-semibold text-foreground">{f.q}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.a}</p>
              </div>
            ))}
          </div>

          {related.length > 0 && (
            <div className="pt-6">
              <h2 className="font-display text-2xl font-bold text-foreground mb-3">
                {isEn ? `Other services in ${muni.name}` : `Autres services à ${muni.name}`}
              </h2>
              <div className="flex flex-wrap gap-2">
                {related.map((s) => {
                  const path = `/${s.slug}/${muni.slug}`;
                  return (
                    <a
                      key={s.slug}
                      href={path}
                      className="inline-flex items-center gap-1.5 border border-border px-3 py-1.5 rounded-md text-sm hover:border-brand hover:text-brand transition-colors"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      {s.verb} {isEn ? "in" : "à"} {muni.name}
                    </a>
                  );
                })}
              </div>
            </div>
          )}
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
    return { meta: [{ title: "Service non trouvé — Ocarina Spa Québec" }] };
  }
  const region = muni.region ?? "Québec";
  const isEn = service.category === "spa-en";
  const title = isEn
    ? `${service.label} in ${muni.name} — Ocarina Spa Quebec`
    : `${service.label} à ${muni.name} — Ocarina Spa Québec`;
  const description = isEn
    ? `${service.label} in ${muni.name}, Quebec. 20+ years of experience. Call ${SITE.phone}.`
    : `Service de ${service.label.toLowerCase()} à ${muni.name}, ${region}. Expert depuis 20 ans. Appelez le ${SITE.phone}.`;
  const url = `${SITE.domain}/${service.slug}/${muni.slug}`;
  const faqs = isEn
    ? [
        { q: `Do you offer ${service.label.toLowerCase()} in ${muni.name}?`, a: `Yes, we serve ${muni.name} and the surrounding area.` },
        { q: `How much does it cost?`, a: `Call ${SITE.phone} for a free quote.` },
      ]
    : [
        { q: `Offrez-vous le service de ${service.verb.toLowerCase()} à ${muni.name} ?`, a: `Oui, nous offrons ce service à ${muni.name} et toute la région ${region}.` },
        { q: `Quel est le prix ?`, a: `Appelez le ${SITE.phone} pour une soumission gratuite.` },
      ];
  return {
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: url },
      { rel: "canonical", href: url },
    ],
    scripts: [
      { type: "application/ld+json", children: JSON.stringify(localBusinessSchema({ areaName: muni.name })) },
      { type: "application/ld+json", children: JSON.stringify(serviceSchema(service.label, muni.name)) },
      { type: "application/ld+json", children: JSON.stringify(faqSchema(faqs)) },
      { type: "application/ld+json", children: JSON.stringify(breadcrumbSchema([
        { name: isEn ? "Home" : "Accueil", url: SITE.domain + "/" },
        { name: muni.name, url },
      ])) },
    ],
  };
};

export { findMunicipalityBySlug, findServiceBySlug };
