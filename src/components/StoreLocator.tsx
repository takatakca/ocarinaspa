import { useEffect } from "react";
import { Phone, MapPin, Navigation, FileText, Wrench, ShoppingBag, Cog, Sparkles, Waves } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { SITE } from "@/lib/seo";
import { trackPhoneCall, trackQuickSubmission, gtag } from "@/lib/gtag";

const LAT = 46.3144671;
const LNG = -72.5275818;
const PLACE_ID = "ChIJjY1BYLHFx0wRqWNnXpOeGBI";

const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${LAT},${LNG}&destination_place_id=${PLACE_ID}`;
const placeUrl = `https://www.google.com/maps/place/?q=place_id:${PLACE_ID}`;

function trackDirections() {
  gtag("event", "click_get_directions", {
    event_category: "Ocarina Spa",
    event_label: "Store Locator — Directions",
  });
}

function trackLocatorPhone() {
  gtag("event", "click_phone_from_locator", {
    event_category: "Ocarina Spa",
    event_label: "Store Locator — Phone",
  });
  trackPhoneCall();
}

export function StoreLocator() {
  useEffect(() => {
    gtag("event", "view_store_locator", {
      event_category: "Ocarina Spa",
      event_label: "Store Locator View",
    });
  }, []);

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="grid lg:grid-cols-5 gap-8">
        {/* Map */}
        <div className="lg:col-span-3 rounded-xl overflow-hidden border border-border shadow-sm bg-surface min-h-[420px]">
          {MAPS_KEY ? (
            <iframe
              title="Carte Ocarina Spa Bécancour"
              src={`https://www.google.com/maps/embed/v1/place?key=${MAPS_KEY}&q=place_id:${PLACE_ID}&zoom=14`}
              width="100%"
              height="100%"
              className="w-full h-full min-h-[420px] border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          ) : (
            <iframe
              title="Carte Ocarina Spa Bécancour"
              src={`https://maps.google.com/maps?q=${LAT},${LNG}&z=14&output=embed`}
              width="100%"
              height="100%"
              className="w-full h-full min-h-[420px] border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          )}
        </div>

        {/* Info card */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <h2 className="font-display text-2xl font-bold text-foreground">OCARINA SPA</h2>
            <p className="text-sm text-muted-foreground mt-1">Succursale Québec — Bécancour</p>

            <div className="mt-5 space-y-3 text-sm">
              <p className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 text-brand shrink-0" />
                <span>
                  {SITE.address.street}<br />
                  {SITE.address.city}, {SITE.address.region} {SITE.address.postalCode}
                </span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-brand shrink-0" />
                <a href={`tel:${SITE.phoneTel}`} onClick={trackLocatorPhone} className="font-semibold hover:text-brand">
                  {SITE.phone}
                </a>
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-2">
              <a
                href={`tel:${SITE.phoneTel}`}
                onClick={trackLocatorPhone}
                className="inline-flex items-center justify-center gap-2 bg-brand text-brand-foreground px-4 py-3 rounded-md font-semibold hover:bg-brand-dark transition-colors"
              >
                <Phone className="w-4 h-4" /> Appeler maintenant
              </a>
              <Link
                to="/contact"
                onClick={trackQuickSubmission}
                className="inline-flex items-center justify-center gap-2 bg-foreground text-background px-4 py-3 rounded-md font-semibold hover:opacity-90 transition-opacity"
              >
                <FileText className="w-4 h-4" /> Demander une soumission
              </Link>
              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={trackDirections}
                className="inline-flex items-center justify-center gap-2 border border-border bg-background text-foreground px-4 py-3 rounded-md font-semibold hover:bg-surface transition-colors"
              >
                <Navigation className="w-4 h-4" /> Obtenir un itinéraire
              </a>
              <a
                href={placeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-brand text-center mt-1"
              >
                Voir sur Google Maps →
              </a>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <h3 className="font-display font-semibold text-lg text-foreground">Services offerts</h3>
            <ul className="mt-4 grid grid-cols-1 gap-2 text-sm">
              <ServiceItem icon={Wrench} label="Réparation de spa" to="/services" />
              <ServiceItem icon={ShoppingBag} label="Vente de spa" to="/vente-spas" />
              <ServiceItem icon={Cog} label="Pièces de spa" to="/pieces" />
              <ServiceItem icon={Waves} label="Ouverture / fermeture de piscine" to="/piscine" />
              <ServiceItem icon={Sparkles} label="Diagnostic AI" to="/diagnostic" />
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function ServiceItem({ icon: Icon, label, to }: { icon: typeof Wrench; label: string; to: string }) {
  return (
    <li>
      <Link to={to} className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-surface text-foreground">
        <Icon className="w-4 h-4 text-brand" />
        <span>{label}</span>
      </Link>
    </li>
  );
}
