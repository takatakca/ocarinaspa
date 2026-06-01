import { Link } from "@tanstack/react-router";
import { MapPin } from "lucide-react";

const TOP_CITIES = [
  { slug: "laval", name: "Laval" },
  { slug: "montreal", name: "Montréal" },
  { slug: "terrebonne", name: "Terrebonne" },
  { slug: "blainville", name: "Blainville" },
  { slug: "longueuil", name: "Longueuil" },
  { slug: "trois-rivieres", name: "Trois-Rivières" },
  { slug: "mascouche", name: "Mascouche" },
  { slug: "repentigny", name: "Repentigny" },
  { slug: "saint-jerome", name: "Saint-Jérôme" },
  { slug: "quebec", name: "Québec" },
];

export function CityLinks() {
  return (
    <section className="bg-surface">
      <div className="container mx-auto px-4 py-14">
        <div className="max-w-3xl">
          <p className="text-brand font-semibold uppercase text-sm tracking-wide">
            Service local
          </p>
          <h2 className="mt-3 font-display text-3xl md:text-4xl font-bold text-foreground">
            Réparation de spa près de chez vous
          </h2>
          <p className="mt-3 text-muted-foreground">
            Pages dédiées à votre ville avec marques fréquentes, intervention rapide et CTA
            téléphone.
          </p>
        </div>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {TOP_CITIES.map((c) => (
            <Link
              key={c.slug}
              to="/reparation-spa/$ville"
              params={{ ville: c.slug }}
              className="flex items-center gap-2 bg-card border border-border rounded-lg px-4 py-3 hover:border-brand hover:text-brand transition-colors text-foreground font-medium"
            >
              <MapPin className="w-4 h-4 text-brand" />
              Réparation spa {c.name}
            </Link>
          ))}
        </div>
        <p className="mt-6 text-sm text-muted-foreground">
          Voir{" "}
          <Link to="/villes" className="text-brand underline">
            toutes les villes desservies
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
