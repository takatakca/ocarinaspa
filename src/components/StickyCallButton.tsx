import { Phone, FileText } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { SITE } from "@/lib/seo";

export function StickyCallButton() {
  return (
    <div className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-card/95 backdrop-blur border-t border-border px-3 py-2 flex gap-2 shadow-2xl">
      <a
        href={`tel:${SITE.phoneTel}`}
        className="flex-1 inline-flex items-center justify-center gap-2 bg-brand text-brand-foreground px-3 py-3 rounded-md font-semibold text-sm"
        aria-label="Appeler Ocarina Spa"
      >
        <Phone className="w-4 h-4" />
        Appeler {SITE.phone}
      </a>
      <Link
        to="/contact"
        className="inline-flex items-center justify-center gap-2 border-2 border-brand text-brand px-3 py-3 rounded-md font-semibold text-sm"
        aria-label="Demander une soumission"
      >
        <FileText className="w-4 h-4" />
        Soumission
      </Link>
    </div>
  );
}
