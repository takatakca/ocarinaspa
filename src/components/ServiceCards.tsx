import { Link } from "@tanstack/react-router";
import { Wrench, Stethoscope, Sun, Snowflake, Cog, Droplets } from "lucide-react";

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
    <section className="bg-footer text-white py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold">Nos services à domicile</h2>
          <p className="mt-3 opacity-80 max-w-2xl mx-auto">
            Une équipe québécoise spécialisée pour tout ce qui touche votre spa.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => (
            <div key={it.title} className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
              <it.icon className="w-10 h-10 mx-auto text-brand" strokeWidth={1.75} />
              <h3 className="mt-4 font-display text-xl font-semibold">{it.title}</h3>
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
