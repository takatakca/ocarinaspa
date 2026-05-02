import { Link } from "@tanstack/react-router";
import { Phone, Menu, X } from "lucide-react";
import { useState } from "react";
import { SITE } from "@/lib/seo";

export function Header() {
  const [open, setOpen] = useState(false);
  const nav = [
    { to: "/", label: "Accueil" },
    { to: "/services", label: "Services" },
    { to: "/villes", label: "Villes desservies" },
    { to: "/contact", label: "Contact" },
  ] as const;

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-full bg-brand flex items-center justify-center text-brand-foreground font-display font-bold">
            O
          </div>
          <div className="leading-tight">
            <div className="font-display font-bold text-foreground text-lg">Ocarina Spa</div>
            <div className="text-xs text-muted-foreground">Réparation • Installation • Québec</div>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-7">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="text-sm font-medium text-foreground hover:text-brand transition-colors"
              activeProps={{ className: "text-brand" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <a
            href={`tel:${SITE.phoneTel}`}
            className="hidden sm:inline-flex items-center gap-2 border-2 border-brand text-brand px-4 py-2 rounded-md font-semibold hover:bg-brand hover:text-brand-foreground transition-colors"
          >
            <Phone className="w-4 h-4" /> {SITE.phone}
          </a>
          <button
            className="lg:hidden p-2 text-foreground"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
          >
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden border-t border-border bg-background">
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-3">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className="py-2 text-foreground font-medium"
              >
                {n.label}
              </Link>
            ))}
            <a
              href={`tel:${SITE.phoneTel}`}
              className="sm:hidden inline-flex items-center gap-2 border-2 border-brand text-brand px-4 py-2 rounded-md font-semibold w-fit"
            >
              <Phone className="w-4 h-4" /> {SITE.phone}
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
