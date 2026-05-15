import { Link } from "@tanstack/react-router";
import { Phone, Menu, X } from "lucide-react";
import { useState } from "react";
import { SITE } from "@/lib/seo";
import logo from "@/assets/ocarina-logo.png";

const nav = [
  { to: "/", label: "Accueil" },
  { to: "/services", label: "Services" },
  { to: "/vente-spas", label: "Vente" },
  { to: "/marques", label: "Marques" },
  { to: "/pieces", label: "Pièces" },
  { to: "/piscine", label: "Piscine" },
  { to: "/regions", label: "Régions" },
  { to: "/villes", label: "Villes" },
  { to: "/contact", label: "Contact" },
  { to: "/en", label: "EN" },
] as const;

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-3">
          <img src={logo} alt="Logo Ocarina Spa vente entretien réparation" className="h-12 w-auto" />
          <span className="sr-only">Ocarina Spa Québec</span>
        </Link>

        <nav className="hidden xl:flex items-center gap-5">
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
            className="hidden sm:inline-flex items-center gap-2 bg-brand text-brand-foreground px-4 py-2.5 rounded-md font-semibold hover:bg-brand-dark transition-colors shadow-md shadow-brand/20"
          >
            <Phone className="w-4 h-4" /> {SITE.phone}
          </a>
          <button
            className="xl:hidden p-2 text-foreground"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
          >
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="xl:hidden border-t border-border bg-background">
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-1">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className="py-2.5 px-2 text-foreground font-medium rounded hover:bg-surface"
              >
                {n.label}
              </Link>
            ))}
            <a
              href={`tel:${SITE.phoneTel}`}
              className="sm:hidden mt-2 inline-flex items-center justify-center gap-2 bg-brand text-brand-foreground px-4 py-3 rounded-md font-semibold"
            >
              <Phone className="w-4 h-4" /> {SITE.phone}
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
