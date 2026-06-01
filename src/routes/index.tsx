import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { ServiceCards } from "@/components/ServiceCards";
import { SpaBrands } from "@/components/SpaBrands";
import { RepairsGrid } from "@/components/RepairsGrid";
import { EmergencyBanner } from "@/components/EmergencyBanner";
import { BeforeAfter } from "@/components/BeforeAfter";
import { CityLinks } from "@/components/CityLinks";
import { ServiceRequestForm } from "@/components/ServiceRequestForm";
import { Link } from "@tanstack/react-router";
import { Phone, CheckCircle2, ShieldCheck, Truck, Wrench } from "lucide-react";
import truck from "@/assets/ocarina-truck.jpg";
import { SITE, localBusinessSchema, faqSchema, altLinks } from "@/lib/seo";

const FAQS = [
  { q: "Réparez-vous toutes les marques de spas ?", a: "Oui, nous travaillons sur toutes les marques et tous les modèles de spas et bains à remous au Québec." },
  { q: "Offrez-vous le service à domicile ?", a: "Oui, notre service mobile se déplace partout au Québec avec les pièces les plus courantes à bord." },
  { q: "Que faire si mon spa ne chauffe plus ?", a: "Appelez-nous au 819-913-7727. C'est l'un des problèmes les plus fréquents (chauffe-eau, sonde, débit) et souvent réparable dès le premier rendez-vous." },
  { q: "Faites-vous l'ouverture et la fermeture de spa ?", a: "Oui, nous offrons le service saisonnier d'ouverture et de fermeture (hivernation) de spa." },
  { q: "Faites-vous l'entretien et le nettoyage de piscine ?", a: "Oui — ouverture, fermeture, nettoyage et entretien de piscine résidentielle." },
  { q: "Est-ce que vous desservez ma ville ?", a: "Nous desservons l'ensemble du Québec. Consultez la page Villes desservies pour confirmer votre municipalité." },
];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ocarina Spa Québec — Réparation et vente de spas" },
      { name: "description", content: "Réparation, vente, entretien, installation, ouverture et fermeture de spas partout au Québec. Service à domicile. Appelez le 819-913-7727." },
      { property: "og:title", content: "Ocarina Spa Québec — Réparation & vente de spas" },
      { property: "og:description", content: "Service mobile partout au Québec : réparation, vente, entretien, ouverture et fermeture de spas." },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE.domain + "/ocarina-logo.png" },
      { property: "og:locale", content: "fr_CA" },
    ],
    links: altLinks({ path: "/", enPath: "/en" }),
    scripts: [
      { type: "application/ld+json", children: JSON.stringify(localBusinessSchema()) },
      { type: "application/ld+json", children: JSON.stringify(faqSchema(FAQS)) },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <Layout>
      <EmergencyBanner />
      <section className="bg-surface">
        <div className="container mx-auto px-4 py-14 md:py-20 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-brand font-semibold tracking-wide uppercase text-sm">Vente • Entretien • Réparation</p>
            <h1 className="mt-3 font-display text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-foreground">
              Réparation, entretien et <span className="text-brand">vente de spas</span> partout au Québec
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-lg">
              Service mobile professionnel : réparation, installation, ouverture, fermeture, pièces et accessoires — pour spas, bains à remous et piscines.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href={`tel:${SITE.phoneTel}`} className="inline-flex items-center gap-2 bg-brand text-brand-foreground px-6 py-3.5 rounded-md font-semibold text-lg hover:bg-brand-dark transition-colors shadow-lg shadow-brand/30">
                <Phone className="w-5 h-5" /> Appeler maintenant
              </a>
              <Link to="/contact" className="inline-flex items-center gap-2 border-2 border-brand text-brand px-6 py-3.5 rounded-md font-semibold text-lg hover:bg-brand hover:text-brand-foreground transition-colors">
                Demander une soumission
              </Link>
              <Link to="/villes" className="inline-flex items-center gap-2 border border-border text-foreground px-6 py-3.5 rounded-md font-semibold text-lg hover:border-brand hover:text-brand transition-colors">
                Villes desservies
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-2">
              {["Service mobile", "Techniciens spécialisés", "Diagnostic rapide", "Service au Québec", "Spas & bains à remous"].map((b) => (
                <span key={b} className="inline-flex items-center gap-1.5 bg-card border border-border px-3 py-1.5 rounded-full text-xs text-foreground">
                  <CheckCircle2 className="w-3.5 h-3.5 text-brand" /> {b}
                </span>
              ))}
            </div>
          </div>
          <div className="relative">
            <img src={truck} alt="Camion de service Ocarina Spa réparation et vente de spas" className="w-full h-auto rounded-2xl shadow-2xl" />
          </div>
        </div>
      </section>

      <RepairsGrid />

      <BeforeAfter />

      <ServiceCards />

      <SpaBrands compact />

      <CityLinks />

      <section className="container mx-auto px-4 py-20 grid lg:grid-cols-3 gap-8">
        {[
          { icon: Truck, title: "Service mobile au Québec", desc: "Notre équipe se déplace dans toutes les régions avec les pièces courantes à bord." },
          { icon: Wrench, title: "Réparation dès la 1re visite", desc: "Dans la majorité des cas, le diagnostic et la réparation se font dès le premier rendez-vous." },
          { icon: ShieldCheck, title: "Toutes marques de spas", desc: "Nous travaillons sur tous les modèles de spas, bains à remous et hot tubs." },
        ].map((c) => (
          <div key={c.title} className="bg-card border border-border rounded-xl p-6">
            <c.icon className="w-10 h-10 text-brand" strokeWidth={1.75} />
            <h3 className="mt-4 font-display text-xl font-semibold text-foreground">{c.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{c.desc}</p>
          </div>
        ))}
      </section>

      <section className="bg-surface">
        <div className="container mx-auto px-4 py-20 grid lg:grid-cols-2 gap-12">
          <div>
            <p className="text-brand font-semibold uppercase text-sm tracking-wide">Questions fréquentes</p>
            <h2 className="mt-3 font-display text-3xl md:text-4xl font-bold text-foreground">FAQ — Spa & piscine au Québec</h2>
            <div className="mt-6 space-y-3">
              {FAQS.map((f) => (
                <details key={f.q} className="group border border-border rounded-lg bg-card p-5">
                  <summary className="font-semibold text-foreground cursor-pointer">{f.q}</summary>
                  <p className="mt-2 text-sm text-muted-foreground">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
          <ServiceRequestForm />
        </div>
      </section>
    </Layout>
  );
}
