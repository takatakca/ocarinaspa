import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { ServiceRequestForm } from "@/components/ServiceRequestForm";
import { SITE, localBusinessSchema } from "@/lib/seo";
import { trackPhoneCall } from "@/lib/gtag";
import { Phone, Sun, Snowflake, Droplets, Sparkles } from "lucide-react";

const SERVICES = [
  { icon: Sun, title: "Ouverture de piscine", desc: "Démarrage saisonnier complet : retrait de la toile, branchements, équilibrage de l'eau." },
  { icon: Snowflake, title: "Fermeture de piscine", desc: "Hivernation : vidange partielle, soufflage des lignes, produits, installation de la toile." },
  { icon: Sparkles, title: "Nettoyage de piscine", desc: "Aspirateur, brossage, nettoyage du filtre, traitement choc." },
  { icon: Droplets, title: "Entretien régulier", desc: "Suivi de l'eau, ajustement du pH et du chlore, dépannage d'équipement." },
];

export const Route = createFileRoute("/piscine")({
  head: () => ({
    meta: [
      { title: "Service de piscine au Québec — Ocarina Spa" },
      { name: "description", content: "Ouverture, fermeture, nettoyage et entretien de piscine résidentielle au Québec. Service professionnel à domicile. 819-913-7727." },
      { property: "og:title", content: "Service de piscine — Ocarina Spa Québec" },
      { property: "og:description", content: "Ouverture, fermeture, nettoyage et entretien de piscine partout au Québec." },
    ],
    scripts: [{ type: "application/ld+json", children: JSON.stringify(localBusinessSchema()) }],
  }),
  component: () => (
    <Layout>
      <section className="bg-surface py-14">
        <div className="container mx-auto px-4">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground">Service de piscine au Québec</h1>
          <p className="mt-4 text-muted-foreground max-w-2xl">
            Ouverture, fermeture, nettoyage et entretien de piscine résidentielle. Notre équipe se déplace partout au Québec.
          </p>
          <a href={`tel:${SITE.phoneTel}`} onClick={trackPhoneCall} className="mt-6 inline-flex items-center gap-2 bg-brand text-brand-foreground px-5 py-3 rounded-md font-semibold">
            <Phone className="w-4 h-4" /> {SITE.phone}
          </a>
        </div>
      </section>
      <section className="container mx-auto px-4 py-14 grid lg:grid-cols-[2fr_1fr] gap-10">
        <div className="grid sm:grid-cols-2 gap-4">
          {SERVICES.map((s) => (
            <div key={s.title} className="bg-card border border-border rounded-xl p-5">
              <s.icon className="w-9 h-9 text-brand" strokeWidth={1.75} />
              <h3 className="mt-3 font-display font-semibold text-foreground">{s.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
          <div className="sm:col-span-2 text-sm text-muted-foreground">
            Consultez aussi nos pages <Link to="/services" className="text-brand hover:underline">Services spa</Link> et{" "}
            <Link to="/villes" className="text-brand hover:underline">Villes desservies</Link>.
          </div>
        </div>
        <ServiceRequestForm defaultService="Nettoyage de piscine" />
      </section>
    </Layout>
  ),
});
