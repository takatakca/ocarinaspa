import { Link } from "@tanstack/react-router";
import { Phone } from "lucide-react";
import { SITE } from "@/lib/seo";
import { trackPhoneCall, trackQuickSubmission } from "@/lib/gtag";
import fuiteImg from "@/assets/repair-fuite.jpg";
import pompeImg from "@/assets/repair-pompe.jpg";
import chauffeImg from "@/assets/repair-chauffe.jpg";
import packImg from "@/assets/avant-apres-pack.jpg";
import panneauImg from "@/assets/spa-control-panel.jpg";
import gfciImg from "@/assets/repair-gfci.jpg";
import jetsImg from "@/assets/avant-apres-pompe.jpg";
import ouvertureImg from "@/assets/spa-winter-quebec.jpg";
import fermetureImg from "@/assets/avant-apres-hiver.jpg";

const REPAIRS = [
  { img: fuiteImg, title: "Réparation de fuite", desc: "Joints, plomberie PVC, raccords, jets qui coulent." },
  { img: pompeImg, title: "Changement de pompe", desc: "Pompes Waterway, LX, Aqua-Flo neuves ou remises à neuf." },
  { img: chauffeImg, title: "Remplacement chauffe-eau", desc: "Élément, tube de chauffe, kit complet." },
  { img: packImg, title: "Pack électronique", desc: "Balboa, Gecko — diagnostic et remplacement." },
  { img: panneauImg, title: "Panneau de contrôle", desc: "Topside qui clignote, boutons morts, écran noir." },
  { img: gfciImg, title: "GFCI / disjoncteur", desc: "Disjoncteur qui saute à répétition — diagnostic complet." },
  { img: jetsImg, title: "Jets non fonctionnels", desc: "Air, débit, pression — diagnostic de la plomberie." },
  { img: panneauImg, title: "Codes FLO / DR / OH", desc: "Décodage et correction des codes Balboa et Gecko." },
  { img: ouvertureImg, title: "Ouverture de spa", desc: "Démarrage saisonnier, mise en service complète." },
  { img: fermetureImg, title: "Fermeture de spa", desc: "Hivernation, protection de la plomberie contre le gel." },
];

export function RepairsGrid() {
  return (
    <section className="bg-surface" id="reparations">
      <div className="container mx-auto px-4 py-16 md:py-20">
        <div className="max-w-3xl">
          <p className="text-brand font-semibold uppercase text-sm tracking-wide">
            Réparations effectuées
          </p>
          <h2 className="mt-3 font-display text-3xl md:text-4xl font-bold text-foreground">
            Réparations de spa que nous effectuons au Québec
          </h2>
          <p className="mt-4 text-muted-foreground">
            Plus de 20 ans d'expérience sur Balboa, Gecko, Waterway et LX. Diagnostic rapide,
            réparation dès la première visite dans la majorité des cas.
          </p>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {REPAIRS.map((r) => (
            <article
              key={r.title}
              className="group bg-card border border-border rounded-xl overflow-hidden hover:shadow-xl hover:border-brand/40 transition-all"
            >
              <div className="aspect-[4/3] overflow-hidden bg-surface">
                <img
                  src={r.img}
                  alt={`${r.title} — Ocarina Spa, technicien au Québec`}
                  width={800}
                  height={600}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-5">
                <h3 className="font-semibold text-foreground">{r.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">{r.desc}</p>
                <Link
                  to="/contact"
                  className="mt-4 inline-flex items-center text-sm font-semibold text-brand hover:text-brand-dark"
                >
                  Demander une soumission →
                </Link>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <a
            href={`tel:${SITE.phoneTel}`}
            onClick={trackPhoneCall}
            className="inline-flex items-center gap-2 bg-brand text-brand-foreground px-6 py-3 rounded-md font-semibold hover:bg-brand-dark transition-colors shadow-lg shadow-brand/20"
          >
            <Phone className="w-5 h-5" /> Appeler {SITE.phone}
          </a>
          <Link
            to="/contact"
            onClick={trackQuickSubmission}
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
