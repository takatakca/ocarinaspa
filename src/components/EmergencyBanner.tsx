import { Link } from "@tanstack/react-router";
import { Phone, Siren } from "lucide-react";
import { SITE } from "@/lib/seo";
import { trackPhoneCall } from "@/lib/gtag";

export function EmergencyBanner() {
  return (
    <section className="bg-[#0b1c33] text-white border-y border-white/10">
      <div className="container mx-auto px-4 py-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-center">
        <span className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-red-400">
          <Siren className="w-4 h-4" /> Urgence Spa 24/7
        </span>
        <p className="text-sm md:text-base text-white/90">
          Spa arrêté en hiver ? Risque de gel de la plomberie — intervention rapide partout au Québec.
        </p>
        <a
          href={`tel:${SITE.phoneTel}`}
          onClick={trackPhoneCall}
          className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-bold transition-colors"
        >
          <Phone className="w-4 h-4" /> {SITE.phone}
        </a>
        <Link
          to="/urgence-spa"
          className="text-sm text-white/80 underline underline-offset-4 hover:text-white"
        >
          Service d'urgence
        </Link>
      </div>
    </section>
  );
}
