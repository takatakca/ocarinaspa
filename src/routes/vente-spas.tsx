import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { ServiceRequestForm } from "@/components/ServiceRequestForm";
import { SITE, localBusinessSchema } from "@/lib/seo";
import card from "@/assets/ocarina-card.jpg";
import { Phone } from "lucide-react";

export const Route = createFileRoute("/vente-spas")({
  head: () => ({
    meta: [
      { title: "Vente de spas au Québec — Ocarina Spa" },
      { name: "description", content: "Vente de spas neufs et accessoires au Québec. Conseil personnalisé, livraison et installation. Appelez le 819-913-7727." },
      { property: "og:title", content: "Vente de spas — Ocarina Spa Québec" },
      { property: "og:description", content: "Spas neufs, accessoires, livraison et installation partout au Québec." },
    ],
    scripts: [{ type: "application/ld+json", children: JSON.stringify(localBusinessSchema()) }],
  }),
  component: () => (
    <Layout>
      <section className="bg-surface py-14">
        <div className="container mx-auto px-4">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground">Vente de spas au Québec</h1>
          <p className="mt-4 text-muted-foreground max-w-2xl">
            Spas neufs et accessoires de qualité, avec conseil personnalisé, livraison et installation par notre équipe.
          </p>
          <a href={`tel:${SITE.phoneTel}`} className="mt-6 inline-flex items-center gap-2 bg-brand text-brand-foreground px-5 py-3 rounded-md font-semibold">
            <Phone className="w-4 h-4" /> {SITE.phone}
          </a>
        </div>
      </section>
      <section className="container mx-auto px-4 py-14 grid lg:grid-cols-[2fr_1fr] gap-10">
        <div className="space-y-4 text-foreground">
          <img src={card} alt="Carte d'affaires Ocarina Spa Bécancour" className="rounded-xl shadow-lg w-full" />
          <h2 className="font-display text-2xl font-bold pt-4">Pourquoi acheter chez Ocarina Spa ?</h2>
          <ul className="space-y-2 text-muted-foreground">
            <li>• Conseil par des techniciens experts (et non de simples vendeurs)</li>
            <li>• Livraison et installation partout au Québec</li>
            <li>• Service après-vente, entretien et pièces disponibles</li>
            <li>• Prix compétitifs et financement possible</li>
          </ul>
          <p className="text-muted-foreground pt-4">
            Visitez aussi nos pages <Link to="/services" className="text-brand hover:underline">Services</Link> et{" "}
            <Link to="/pieces" className="text-brand hover:underline">Pièces & accessoires</Link>.
          </p>
        </div>
        <ServiceRequestForm defaultService="Vente de spa" />
      </section>
    </Layout>
  ),
});
