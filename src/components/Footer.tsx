import { Link } from "@tanstack/react-router";
import { Phone, MapPin } from "lucide-react";
import { SITE } from "@/lib/seo";
import logo from "@/assets/ocarina-logo.png";

export function Footer() {
  return (
    <footer className="bg-footer text-footer-foreground mt-20">
      <div className="container mx-auto px-4 py-16 grid gap-10 md:grid-cols-4">
        <div>
          <img src={logo} alt="Ocarina Spa" className="h-16 w-auto bg-white/95 rounded-md p-2 mb-4" />
          <p className="text-sm opacity-80 leading-relaxed">
            Vente • Entretien • Réparation. Spécialiste des spas et bains à remous au Québec.
          </p>
          <a href={SITE.domain} className="block text-sm text-brand mt-3 hover:underline">www.ocarinaspa.ca</a>
        </div>
        <div>
          <h3 className="text-brand font-display font-semibold text-lg mb-4">Services</h3>
          <ul className="space-y-2 text-sm opacity-90">
            <li><Link to="/services" className="hover:text-brand">Réparation de spa</Link></li>
            <li><Link to="/services" className="hover:text-brand">Entretien de spa</Link></li>
            <li><Link to="/vente-spas" className="hover:text-brand">Vente de spas</Link></li>
            <li><Link to="/services" className="hover:text-brand">Installation</Link></li>
            <li><Link to="/services" className="hover:text-brand">Ouverture / Fermeture</Link></li>
            <li><Link to="/pieces" className="hover:text-brand">Pièces & accessoires</Link></li>
            <li><Link to="/piscine" className="hover:text-brand">Service de piscine</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-brand font-display font-semibold text-lg mb-4">Régions desservies</h3>
          <ul className="space-y-2 text-sm opacity-90">
            <li><Link to="/regions" className="hover:text-brand">Centre-du-Québec</Link></li>
            <li><Link to="/regions" className="hover:text-brand">Mauricie</Link></li>
            <li><Link to="/regions" className="hover:text-brand">Montréal · Laval</Link></li>
            <li><Link to="/regions" className="hover:text-brand">Montérégie · Rive-Sud</Link></li>
            <li><Link to="/regions" className="hover:text-brand">Capitale-Nationale · Québec</Link></li>
            <li><Link to="/villes" className="text-brand hover:underline">Voir toutes les villes →</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-brand font-display font-semibold text-lg mb-4">Nous joindre</h3>
          <a href={`tel:${SITE.phoneTel}`} className="inline-flex items-center gap-2 bg-brand text-brand-foreground px-4 py-2.5 rounded-md font-semibold hover:bg-brand-dark transition-colors">
            <Phone className="w-4 h-4" /> {SITE.phone}
          </a>
          <p className="text-sm opacity-80 mt-4 flex items-start gap-2">
            <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-brand" />
            <span>{SITE.address.street}<br />{SITE.address.city}, {SITE.address.region} {SITE.address.postalCode}</span>
          </p>
          <p className="text-sm opacity-70 mt-3">Ouvert 24h sur 24, 7 jours sur 7</p>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container mx-auto px-4 py-5 text-xs opacity-70 flex flex-col sm:flex-row justify-between gap-2">
          <span>© {new Date().getFullYear()} {SITE.legalName}. Tous droits réservés.</span>
          <span>Réparation & vente de spas — partout au Québec.</span>
        </div>
      </div>
    </footer>
  );
}
