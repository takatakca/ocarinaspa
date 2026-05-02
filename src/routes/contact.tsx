import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { ServiceRequestForm } from "@/components/ServiceRequestForm";
import { Phone, MapPin, Clock } from "lucide-react";
import { SITE } from "@/lib/seo";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Ocarina Spa Québec | (819) 913-7727" },
      { name: "description", content: "Contactez Ocarina Spa Québec pour tout service de spa : réparation, installation, ouverture, fermeture, entretien. Appelez le (819) 913-7727." },
      { property: "og:title", content: "Contact — Ocarina Spa Québec" },
      { property: "og:description", content: "Demandez un service de spa partout au Québec. Réponse rapide." },
    ],
  }),
  component: Contact,
});

function Contact() {
  return (
    <Layout>
      <section className="bg-surface py-16">
        <div className="container mx-auto px-4">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground">Contactez-nous</h1>
          <p className="mt-4 text-muted-foreground max-w-2xl">
            Une question, une urgence ou une demande de soumission ? Notre équipe vous répond rapidement.
          </p>
        </div>
      </section>
      <section className="container mx-auto px-4 py-16 grid lg:grid-cols-2 gap-10">
        <div className="space-y-6">
          <InfoCard icon={Phone} title="Téléphone" value={SITE.phone} href={`tel:${SITE.phoneTel}`} />
          <InfoCard
            icon={MapPin}
            title="Adresse"
            value={`${SITE.address.street}, ${SITE.address.city}, ${SITE.address.region} ${SITE.address.postalCode}`}
          />
          <InfoCard icon={Clock} title="Heures d'ouverture" value="Ouvert 24h sur 24, 7 jours sur 7" />
        </div>
        <ServiceRequestForm />
      </section>
    </Layout>
  );
}

function InfoCard({ icon: Icon, title, value, href }: { icon: typeof Phone; title: string; value: string; href?: string }) {
  const Tag = href ? "a" : "div";
  return (
    <Tag
      {...(href ? { href } : {})}
      className="flex items-start gap-4 bg-card border border-border rounded-xl p-6 hover:border-brand transition-colors"
    >
      <Icon className="w-7 h-7 text-brand shrink-0" />
      <div>
        <h3 className="font-display font-semibold text-foreground">{title}</h3>
        <p className="text-muted-foreground text-sm mt-1">{value}</p>
      </div>
    </Tag>
  );
}
