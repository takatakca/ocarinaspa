import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { ServiceRequestForm } from "@/components/ServiceRequestForm";
import { SITE, localBusinessSchema } from "@/lib/seo";
import { trackPhoneCall } from "@/lib/gtag";
import { Phone } from "lucide-react";

export const Route = createFileRoute("/pieces")({
  head: () => ({
    meta: [
      { title: "Pièces et accessoires de spa — Ocarina Spa Québec" },
      { name: "description", content: "Pompes, chauffe-eau, panneaux de contrôle, jets, filtres et accessoires de spa. Pièces fournies sur place lors de la réparation." },
      { property: "og:title", content: "Pièces et accessoires de spa — Ocarina Spa" },
      { property: "og:description", content: "Pompes, chauffe-eau, jets, filtres et plus. Pièces livrées sur place." },
    ],
    scripts: [{ type: "application/ld+json", children: JSON.stringify(localBusinessSchema()) }],
  }),
  component: () => (
    <Layout>
      <section className="bg-surface py-14">
        <div className="container mx-auto px-4">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground">Pièces et accessoires de spa</h1>
          <p className="mt-4 text-muted-foreground max-w-2xl">
            Nous fournissons sur place toutes les pièces nécessaires à votre réparation — souvent à meilleur prix qu'en magasin.
          </p>
          <a href={`tel:${SITE.phoneTel}`} onClick={trackPhoneCall} className="mt-6 inline-flex items-center gap-2 bg-brand text-brand-foreground px-5 py-3 rounded-md font-semibold">
            <Phone className="w-4 h-4" /> {SITE.phone}
          </a>
        </div>
      </section>
      <section className="container mx-auto px-4 py-14 grid lg:grid-cols-[2fr_1fr] gap-10">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">Pièces disponibles</h2>
          <ul className="mt-4 grid sm:grid-cols-2 gap-2 text-foreground">
            {["Pompes de spa", "Chauffe-eau de spa", "Panneaux de contrôle", "Jets et buses", "Filtres et cartouches", "Sondes et thermistances", "Couvercles de spa", "Produits chimiques", "Marches et accessoires"].map((p) => (
              <li key={p} className="bg-card border border-border rounded-md px-4 py-2.5 text-sm">{p}</li>
            ))}
          </ul>
        </div>
        <ServiceRequestForm defaultService="Pièces et accessoires" />
      </section>
    </Layout>
  ),
});
