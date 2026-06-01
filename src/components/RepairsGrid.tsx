import { Link } from "@tanstack/react-router";
import {
  Droplets,
  Cog,
  Flame,
  Cpu,
  Gauge,
  Zap,
  Wind,
  ThermometerSnowflake,
  AlertTriangle,
  CalendarClock,
  Phone,
} from "lucide-react";
import { SITE } from "@/lib/seo";

const REPAIRS = [
  { icon: Droplets, title: "Réparation de fuite", desc: "Joints, plomberie PVC, raccords, jets qui coulent." },
  { icon: Cog, title: "Changement de pompe", desc: "Pompes Waterway, LX, Aqua-Flo neuves ou remises à neuf." },
  { icon: Flame, title: "Remplacement chauffe-eau", desc: "Élément, tube de chauffe, kit complet." },
  { icon: Cpu, title: "Pack électronique", desc: "Balboa, Gecko — diagnostic et remplacement." },
  { icon: Gauge, title: "Panneau de contrôle (topside)", desc: "Affichage qui clignote, boutons morts, écran noir." },
  { icon: Zap, title: "GFCI / disjoncteur", desc: "Disjoncteur qui saute à répétition — diagnostic complet." },
  { icon: Wind, title: "Jets non fonctionnels", desc: "Air, débit, pression — diagnostic de la plomberie." },
  { icon: ThermometerSnowflake, title: "Spa qui ne chauffe plus", desc: "Sonde, chauffe-eau, relais — réparé dès la 1re visite." },
  { icon: AlertTriangle, title: "Erreurs FLO / DR / OH", desc: "Décodage et correction des codes Balboa et Gecko." },
  { icon: CalendarClock, title: "Ouverture & fermeture", desc: "Hivernation, démarrage saisonnier, mise en service." },
];

export function RepairsGrid() {
  return (
    <section className="bg-surface" id="reparations">
      <div className="container mx-auto px-4 py-16 md:py-20">
        <div className="max-w-3xl">
          <p className="text-brand font-semibold uppercase text-sm tracking-wide">
            Ce que nous réparons
          </p>
          <h2 className="mt-3 font-display text-3xl md:text-4xl font-bold text-foreground">
            Réparations de spa que nous effectuons au Québec
          </h2>
          <p className="mt-4 text-muted-foreground">
            Plus de 20 ans d'expérience sur Balboa, Gecko, Waterway et LX. Diagnostic rapide,
            réparation dès la première visite dans la majorité des cas.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {REPAIRS.map((r) => (
            <div
              key={r.title}
              className="bg-card border border-border rounded-xl p-5 hover:border-brand hover:shadow-lg transition-all"
            >
              <r.icon className="w-9 h-9 text-brand" strokeWidth={1.75} />
              <h3 className="mt-3 font-semibold text-foreground">{r.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{r.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <a
            href={`tel:${SITE.phoneTel}`}
            className="inline-flex items-center gap-2 bg-brand text-brand-foreground px-6 py-3 rounded-md font-semibold hover:bg-brand-dark transition-colors shadow-lg shadow-brand/20"
          >
            <Phone className="w-5 h-5" /> Appeler maintenant
          </a>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 border-2 border-brand text-brand px-6 py-3 rounded-md font-semibold hover:bg-brand hover:text-brand-foreground transition-colors"
          >
            Soumission rapide
          </Link>
          <Link
            to="/diagnostic"
            className="inline-flex items-center gap-2 border border-border text-foreground px-6 py-3 rounded-md font-semibold hover:border-brand hover:text-brand transition-colors"
          >
            Diagnostic AI gratuit
          </Link>
        </div>
      </div>
    </section>
  );
}
