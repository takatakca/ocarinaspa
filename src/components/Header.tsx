import { Link, useRouterState } from "@tanstack/react-router";
import { Phone, Menu, X, CreditCard, Languages, ChevronDown } from "lucide-react";
import { useState } from "react";
import { SITE } from "@/lib/seo";
import { trackPhoneCall } from "@/lib/gtag";
import logo from "@/assets/ocarina-logo.png";

const nav = [
  { to: "/", label: "Accueil" },
  { to: "/services", label: "Réparation Spa" },
  { to: "/vente-spas", label: "Ventes" },
  { to: "/pieces", label: "Pièces" },
  { to: "/urgence-spa", label: "Urgence 24/7" },
] as const;

export function Header() {
  const [open, setOpen] = useState(false);
  const [languagesOpen, setLanguagesOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const currentLanguage = pathname === "/en" ? "EN" : pathname === "/es" ? "ES" : "FR";

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-3">
          <img src={logo} alt="Ocarina Spa" className="h-12 w-auto" />
          <span className="sr-only">Ocarina Spa Québec</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-5">
          {nav.map((n) => (
            <Link key={n.to} to={n.to} className="text-sm font-medium text-foreground hover:text-brand transition-colors" activeProps={{ className: "text-brand" }}>{n.label}</Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link to="/payer-facture" className="hidden md:inline-flex items-center gap-2 border border-brand text-brand px-3 py-2 rounded-md text-sm font-semibold hover:bg-brand/10 transition-colors">
            <CreditCard className="w-4 h-4" /> Payer facture
          </Link>
          <div className="relative hidden md:block">
            <button type="button" aria-haspopup="menu" aria-expanded={languagesOpen} onClick={() => setLanguagesOpen((v) => !v)} className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm font-semibold hover:bg-surface">
              <Languages className="h-4 w-4" /> {currentLanguage} <ChevronDown className="h-3.5 w-3.5" />
            </button>
            {languagesOpen && (
              <div role="menu" className="absolute right-0 mt-2 min-w-40 overflow-hidden rounded-lg border border-border bg-background shadow-xl">
                <Link to="/" onClick={() => setLanguagesOpen(false)} className="block px-4 py-2.5 text-sm hover:bg-surface">Français</Link>
                <Link to="/en" onClick={() => setLanguagesOpen(false)} className="block px-4 py-2.5 text-sm hover:bg-surface">English</Link>
                <Link to="/es" onClick={() => setLanguagesOpen(false)} className="block px-4 py-2.5 text-sm hover:bg-surface">Español</Link>
              </div>
            )}
          </div>
          <a href={`tel:${SITE.phoneTel}`} onClick={trackPhoneCall} className="hidden sm:inline-flex items-center gap-2 bg-brand text-brand-foreground px-4 py-2.5 rounded-md font-semibold hover:bg-brand-dark transition-colors shadow-md shadow-brand/20"><Phone className="w-4 h-4" /> {SITE.phone}</a>
          <button className="lg:hidden p-2 text-foreground" onClick={() => setOpen(!open)} aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}>{open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}</button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden border-t border-border bg-background">
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-1">
            {nav.map((n) => <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="py-2.5 px-2 text-foreground font-medium rounded hover:bg-surface">{n.label}</Link>)}
            <Link to="/payer-facture" onClick={() => setOpen(false)} className="mt-2 py-2.5 px-2 inline-flex items-center gap-2 border border-brand text-brand font-semibold rounded hover:bg-brand/10"><CreditCard className="w-4 h-4" /> Payer une facture</Link>
            <Link to="/villes" onClick={() => setOpen(false)} className="py-2.5 px-2 text-foreground/80 text-sm rounded hover:bg-surface">Zones desservies</Link>
            <div className="mt-2 border-t border-border pt-3">
              <div className="mb-1 flex items-center gap-2 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"><Languages className="h-4 w-4" /> Langue</div>
              <div className="grid grid-cols-3 gap-2">
                <Link to="/" onClick={() => setOpen(false)} className="rounded border border-border px-2 py-2 text-center text-sm hover:bg-surface">FR</Link>
                <Link to="/en" onClick={() => setOpen(false)} className="rounded border border-border px-2 py-2 text-center text-sm hover:bg-surface">EN</Link>
                <Link to="/es" onClick={() => setOpen(false)} className="rounded border border-border px-2 py-2 text-center text-sm hover:bg-surface">ES</Link>
              </div>
            </div>
            <a href={`tel:${SITE.phoneTel}`} onClick={trackPhoneCall} className="sm:hidden mt-3 inline-flex items-center justify-center gap-2 bg-brand text-brand-foreground px-4 py-3 rounded-md font-semibold"><Phone className="w-4 h-4" /> {SITE.phone}</a>
          </nav>
        </div>
      )}
    </header>
  );
}
