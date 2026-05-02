import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { SERVICE_TYPES } from "@/data/quebecMunicipalities";
import { Stethoscope, Wrench, Sun, Snowflake, Droplets } from "lucide-react";

const icons: Record<string, typeof Stethoscope> = {
  "reparation-spa": Stethoscope,
  "installation-spa": Wrench,
  "ouverture-spa": Sun,
  "fermeture-spa": Snowflake,
  "entretien-spa": Droplets,
};

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Services de spa au Québec — Réparation, installation, entretien | Ocarina Spa" },
      { name: "description", content: "Tous nos services de spa au Québec : réparation, installation, ouverture, fermeture et entretien à domicile par des experts." },
      { property: "og:title", content: "Nos services de spa au Québec" },
      { property: "og:description", content: "Réparation, installation, ouverture, fermeture, entretien à domicile partout au Québec." },
    ],
  }),
  component: Services,
});

function Services() {
  return (
    <Layout>
      <section className="bg-surface py-16">
        <div className="container mx-auto px-4">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground">Nos services</h1>
          <p className="mt-4 text-muted-foreground max-w-2xl">
            Service complet à domicile partout au Québec, par une équipe spécialisée.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {SERVICE_TYPES.map((s) => {
          const Icon = icons[s.slug];
          return (
            <Link
              key={s.slug}
              to="/villes"
              className="group bg-card border border-border rounded-xl p-6 hover:border-brand hover:shadow-lg transition-all"
            >
              <Icon className="w-10 h-10 text-brand" strokeWidth={1.75} />
              <h2 className="mt-4 font-display text-xl font-semibold text-foreground">{s.label}</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Service de {s.verb.toLowerCase()} disponible dans toutes les villes du Québec.
              </p>
              <span className="mt-4 inline-block text-brand text-sm font-semibold group-hover:underline">
                Choisir une ville →
              </span>
            </Link>
          );
        })}
      </section>
    </Layout>
  );
}
