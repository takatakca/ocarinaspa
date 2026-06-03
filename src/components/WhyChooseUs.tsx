import { Wrench, Snowflake, ShieldCheck, Clock, FileText, MapPin } from "lucide-react";

const REASONS = [
  { icon: Wrench, title: "Techniciens spécialisés", desc: "20+ ans d'expérience sur toutes les marques de spas et hot tubs." },
  { icon: Snowflake, title: "Service hiver Québec", desc: "Interventions prioritaires contre le gel, ouverture et fermeture saisonnière." },
  { icon: ShieldCheck, title: "Réparation toutes marques", desc: "Jacuzzi, Hydropool, Arctic, Sundance, Beachcomber, Bullfrog et plus." },
  { icon: Clock, title: "Urgence 24/7", desc: "Disponibles en tout temps pour les pannes critiques et les fuites." },
  { icon: FileText, title: "Soumission rapide", desc: "Réponse claire, prix transparent, rendez-vous fixé sans délai." },
  { icon: MapPin, title: "Laval · Montréal · Rive-Nord", desc: "Service mobile dans le Grand Montréal et partout au Québec." },
];

export function WhyChooseUs() {
  return (
    <section className="bg-surface">
      <div className="container mx-auto px-4 py-16 md:py-20">
        <div className="max-w-2xl">
          <p className="text-brand font-semibold uppercase text-sm tracking-wide">Pourquoi nous choisir</p>
          <h2 className="mt-3 font-display text-3xl md:text-4xl font-bold text-foreground">
            Pourquoi choisir Ocarina Spa ?
          </h2>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {REASONS.map((r) => (
            <div
              key={r.title}
              className="bg-card border border-border rounded-xl p-6 hover:border-brand/50 hover:shadow-lg transition-all"
            >
              <r.icon className="w-9 h-9 text-brand" strokeWidth={1.75} />
              <h3 className="mt-4 font-display text-lg font-semibold text-foreground">{r.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{r.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
