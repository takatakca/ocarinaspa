import { Link } from "@tanstack/react-router";
import { Phone, Siren } from "lucide-react";
import { SITE } from "@/lib/seo";

export function EmergencyBanner() {
  return (
    <section className="bg-gradient-to-r from-red-700 via-red-600 to-red-700 text-white">
      <div className="container mx-auto px-4 py-5 flex flex-wrap items-center justify-center gap-4 text-center">
        <Siren className="w-6 h-6 shrink-0 animate-pulse" />
        <p className="font-semibold text-base md:text-lg">
          Urgence Spa 24/7 — Spa arrêté en hiver ? Risque de gel de la plomberie ?
        </p>
        <a
          href={`tel:${SITE.phoneTel}`}
          className="inline-flex items-center gap-2 bg-white text-red-700 px-4 py-2 rounded-md font-bold hover:bg-red-50 transition-colors"
        >
          <Phone className="w-4 h-4" /> {SITE.phone}
        </a>
        <Link
          to="/urgence-spa"
          className="underline underline-offset-4 hover:no-underline text-sm font-medium"
        >
          Service d'urgence
        </Link>
      </div>
    </section>
  );
}
