import { Link } from "@tanstack/react-router";
import { SITE } from "@/lib/seo";

export function Footer() {
  return (
    <footer className="bg-footer text-footer-foreground mt-20">
      <div className="container mx-auto px-4 py-16 grid gap-10 md:grid-cols-4">
        <div>
          <h3 className="text-brand font-display font-semibold text-lg mb-4">Ocarina Spa Québec</h3>
          <p className="text-sm opacity-80 leading-relaxed">
            Plus de 20 ans d'expertise dans la réparation, l'installation et l'entretien de spas
            partout au Québec.
          </p>
        </div>
        <div>
          <h3 className="text-brand font-display font-semibold text-lg mb-4">Services à domicile</h3>
          <ul className="space-y-2 text-sm opacity-90">
            <li><Link to="/services" className="hover:text-brand">Réparation de spa</Link></li>
            <li><Link to="/services" className="hover:text-brand">Installation de spa</Link></li>
            <li><Link to="/services" className="hover:text-brand">Ouverture de spa</Link></li>
            <li><Link to="/services" className="hover:text-brand">Fermeture de spa</Link></li>
            <li><Link to="/services" className="hover:text-brand">Entretien & pièces</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-brand font-display font-semibold text-lg mb-4">Régions desservies</h3>
          <p className="text-sm opacity-90 leading-relaxed">
            Tout le Québec : Montréal, Laval, Rive-Sud, Rive-Nord, Montérégie, Laurentides,
            Lanaudière, Québec, Estrie, Outaouais, Mauricie et plus.
          </p>
          <Link to="/villes" className="inline-block mt-3 text-brand text-sm hover:underline">
            Voir toutes les villes →
          </Link>
        </div>
        <div>
          <h3 className="text-brand font-display font-semibold text-lg mb-4">Nous rejoindre</h3>
          <a href={`tel:${SITE.phoneTel}`} className="block text-lg font-semibold hover:text-brand">
            {SITE.phone}
          </a>
          <p className="text-sm opacity-80 mt-2">{SITE.address.street}</p>
          <p className="text-sm opacity-80">
            {SITE.address.city}, {SITE.address.region} {SITE.address.postalCode}
          </p>
          <p className="text-sm opacity-80 mt-2">Ouvert 24h/24</p>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container mx-auto px-4 py-5 text-xs opacity-70 flex flex-col sm:flex-row justify-between gap-2">
          <span>© {new Date().getFullYear()} Ocarina Spa Québec. Tous droits réservés.</span>
          <span>Service spécialisé en spas et bains à remous au Québec.</span>
        </div>
      </div>
    </footer>
  );
}
