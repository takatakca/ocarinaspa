import { Link } from "@tanstack/react-router";
import { Wrench, Stethoscope, Sun, Snowflake, Cog, Droplets } from "lucide-react";
import spaWater from "@/assets/spa-water.jpg";

const items = [
  { icon: Stethoscope, title: "Réparation", desc: "Diagnostic et réparation rapide à domicile." },
  { icon: Wrench, title: "Installation", desc: "Mise en service complète et sécuritaire." },
  { icon: Sun, title: "Ouverture", desc: "Démarrage saisonnier de votre spa." },
  { icon: Snowflake, title: "Fermeture", desc: "Hivernation pour protéger votre spa." },
  { icon: Droplets, title: "Entretien", desc: "Équilibrage de l'eau et nettoyage." },
  { icon: Cog, title: "Pièces", desc: "Pompes, moteurs, chauffe-eau, jets et plus." },
];

export function ServiceCards() {
  return (
    <section className="relative py-20 text-white overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${spaWater})` }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-footer/85" aria-hidden="true" />
      <div className="container mx-auto px-4 relative">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold">Nos services à domicile</h2>
          <p className="mt-3 opacity-80 max-w-2xl mx-auto">
            Une équipe québécoise spécialisée pour tout ce qui touche votre spa.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => (
            <div key={it.title} className="text-center px-4">
              <it.icon className="w-12 h-12 mx-auto text-brand" strokeWidth={1.75} />
              <h3 className="mt-4 font-display text-2xl font-semibold">{it.title}</h3>
              <p className="mt-2 text-sm opacity-80">{it.desc}</p>
              <Link
                to="/services"
                className="inline-block mt-4 border border-white/40 px-4 py-2 text-sm hover:border-brand hover:text-brand transition-colors rounded"
              >
                En savoir plus
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
