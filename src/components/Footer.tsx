import { Link } from "@tanstack/react-router";
import { Phone, MapPin, AlertTriangle, Sparkles, Wrench, AlertCircle } from "lucide-react";
import { SITE } from "@/lib/seo";
import { trackPhoneCall } from "@/lib/gtag";
import logo from "@/assets/ocarina-logo.png";

export function Footer() {
  return (
    <footer className="bg-footer text-footer-foreground mt-20">
      <div className="container mx-auto px-4 py-16 grid gap-10 md:grid-cols-4">
        <div>
          <img src={logo} alt="Ocarina Spa" className="h-16 w-auto bg-white/95 rounded-md p-2 mb-4" />
          <p className="font-display text-xl font-bold mt-2">OCARINA SPA</p>
          <a
            href={`tel:${SITE.phoneTel}`}
            onClick={trackPhoneCall}
            className="block text-brand text-lg font-semibold mt-1 hover:underline"
          >
            {SITE.phone}
          </a>
          <a href={SITE.domain} className="block text-sm opacity-80 mt-1 hover:underline">
            OcarinaSpa.ca
          </a>
          <p className="text-sm opacity-80 mt-4 leading-relaxed">
            Vente • Entretien • Réparation. Spécialiste des spas et bains à remous au Québec.
          </p>
          <p className="text-sm opacity-90 mt-3 inline-flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-red-400" /> Urgence 24h/7j
          </p>
        </div>

        <div>
          <h3 className="text-brand font-display font-semibold text-lg mb-4">Services</h3>
          <ul className="space-y-2 text-sm opacity-90">
            <li><Link to="/services" className="hover:text-brand inline-flex items-center gap-1.5"><Wrench className="w-3.5 h-3.5" /> Réparation Spa</Link></li>
            <li><Link to="/diagnostic" className="hover:text-brand inline-flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" /> Diagnostic AI</Link></li>
            <li><Link to="/codes-erreur" className="hover:text-brand inline-flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" /> Codes d'erreur</Link></li>
            <li><Link to="/vente-spas" className="hover:text-brand">Vente de spas</Link></li>
            <li><Link to="/pieces" className="hover:text-brand">Pièces</Link></li>
            <li><Link to="/urgence-spa" className="hover:text-brand inline-flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5 text-red-400" /> Urgence 24/7</Link></li>
            <li><Link to="/marques" className="hover:text-brand">Marques réparées</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-brand font-display font-semibold text-lg mb-4">Zones desservies</h3>
          <ul className="space-y-2 text-sm opacity-90">
            <li><Link to="/villes" className="hover:text-brand">Montréal · Laval</Link></li>
            <li><Link to="/villes" className="hover:text-brand">Terrebonne · Mascouche</Link></li>
            <li><Link to="/villes" className="hover:text-brand">Blainville · Saint-Jérôme</Link></li>
            <li><Link to="/villes" className="hover:text-brand">Repentigny · Longueuil</Link></li>
            <li><Link to="/villes" className="hover:text-brand">Trois-Rivières · Québec</Link></li>
            <li><Link to="/villes" className="text-brand hover:underline">Voir toutes les villes →</Link></li>
            <li><Link to="/succursales" className="hover:text-brand">📍 Succursale Québec</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-brand font-display font-semibold text-lg mb-4">Nous joindre</h3>
          <a href={`tel:${SITE.phoneTel}`} onClick={trackPhoneCall} className="inline-flex items-center gap-2 bg-brand text-brand-foreground px-4 py-2.5 rounded-md font-semibold hover:bg-brand-dark transition-colors">
            <Phone className="w-4 h-4" /> {SITE.phone}
          </a>
          <Link to="/contact" className="block mt-3 text-sm hover:text-brand underline">
            Demander une soumission
          </Link>
          <p className="text-sm opacity-80 mt-4 flex items-start gap-2">
            <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-brand" />
            <span>{SITE.address.street}<br />{SITE.address.city}, {SITE.address.region} {SITE.address.postalCode}</span>
          </p>
          <p className="text-xs opacity-70 mt-4">
            Marques : Jacuzzi, Hydropool, Arctic Spas, Sundance, Beachcomber, Bullfrog, Hot Spring, Maax, Master Spas, Caldera, Vita Spa, Coast Spas, Wellis, Passion Spas.
          </p>
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
