import { Phone } from "lucide-react";
import { SITE } from "@/lib/seo";

export function StickyCallButton() {
  return (
    <a
      href={`tel:${SITE.phoneTel}`}
      className="lg:hidden fixed bottom-4 right-4 z-50 inline-flex items-center gap-2 bg-brand text-brand-foreground px-5 py-3 rounded-full shadow-2xl shadow-brand/40 font-semibold animate-pulse"
      aria-label="Appeler Ocarina Spa"
    >
      <Phone className="w-5 h-5" />
      Appeler maintenant
    </a>
  );
}
