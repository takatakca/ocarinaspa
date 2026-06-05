import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { SpaBrands } from "@/components/SpaBrands";
import { RepairsGrid } from "@/components/RepairsGrid";
import { EmergencyBanner } from "@/components/EmergencyBanner";
import { BeforeAfter } from "@/components/BeforeAfter";
import { CityLinks } from "@/components/CityLinks";
import { ServiceRequestForm } from "@/components/ServiceRequestForm";
import { Link } from "@tanstack/react-router";
import { Phone, CheckCircle2, Sparkles, AlertTriangle, AlertCircle } from "lucide-react";
import heroTechnician from "@/assets/hero-technicien-ocarina.jpg";
import { SITE, localBusinessSchema, faqSchema, altLinks } from "@/lib/seo";
import { trackPhoneCall, trackQuickSubmission } from "@/lib/gtag";

const FAQS = [
  { q: "Réparez-vous toutes les marques de spas ?", a: "Oui, nous travaillons sur toutes les marques et tous les modèles de spas et bains à remous au Québec." },
  { q: "Offrez-vous le service à domicile ?", a: "Oui, notre service mobile se déplace partout au Québec avec les pièces les plus courantes à bord." },
  { q: "Que faire si mon spa ne chauffe plus ?", a: "Appelez-nous au 819-913-7727. C'est l'un des problèmes les plus fréquents (chauffe-eau, sonde, débit) et souvent réparable dès le premier rendez-vous." },
  { q: "Faites-vous l'ouverture et la fermeture de spa ?", a: "Oui, nous offrons le service saisonnier d'ouverture et de fermeture (hivernation) de spa." },
  { q: "Faites-vous l'entretien et le nettoyage de piscine ?", a: "Oui — ouverture, fermeture, nettoyage et entretien de piscine résidentielle." },
  { q: "Est-ce que vous desservez ma ville ?", a: "Nous desservons l'ensemble du Québec. Consultez la page Villes desservies pour confirmer votre municipalité." },
];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ocarina Spa Québec — Réparation et vente de spas" },
      { name: "description", content: "Réparation, vente, entretien, installation, ouverture et fermeture de spas partout au Québec. Service à domicile. Appelez le 819-913-7727." },
      { property: "og:title", content: "Ocarina Spa Québec — Réparation & vente de spas" },
      { property: "og:description", content: "Service mobile partout au Québec : réparation, vente, entretien, ouverture et fermeture de spas." },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE.domain + "/ocarina-logo.png" },
      { property: "og:locale", content: "fr_CA" },
    ],
    links: altLinks({ path: "/", enPath: "/en" }),
    scripts: [
      { type: "application/ld+json", children: JSON.stringify(localBusinessSchema()) },
      { type: "application/ld+json", children: JSON.stringify(faqSchema(FAQS)) },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <Layout>
      <EmergencyBanner />

      {/* 1. Hero */}
      <section className="bg-surface">
        <div className="container mx-auto px-4 py-14 md:py-20 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-brand font-semibold tracking-wide uppercase text-sm">
              Techniciens spécialisés • Service au Québec
            </p>
            <h1 className="mt-3 font-display text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-foreground">
              Réparation et vente de <span className="text-brand">spas</span> partout au Québec
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-lg">
              Service mobile professionnel : diagnostic, réparation, ouverture, fermeture, pièces
              et installation. Toutes les marques — Balboa, Gecko, Waterway, LX.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href={`tel:${SITE.phoneTel}`} onClick={trackPhoneCall} className="inline-flex items-center gap-2 bg-brand text-brand-foreground px-6 py-3.5 rounded-md font-semibold text-lg hover:bg-brand-dark transition-colors shadow-lg shadow-brand/30">
                <Phone className="w-5 h-5" /> Appeler maintenant
              </a>
              <Link to="/contact" onClick={trackQuickSubmission} className="inline-flex items-center gap-2 border-2 border-brand text-brand px-6 py-3.5 rounded-md font-semibold text-lg hover:bg-brand hover:text-brand-foreground transition-colors">
                Soumission rapide
              </Link>
              <Link to="/diagnostic" className="inline-flex items-center gap-2 border border-border text-foreground px-6 py-3.5 rounded-md font-semibold text-lg hover:border-brand hover:text-brand transition-colors">
                <Sparkles className="w-5 h-5" /> Diagnostic AI
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-2">
              {["Service mobile", "Techniciens certifiés", "Réparation 1re visite", "Pièces à bord", "20+ ans d'expérience"].map((b) => (
                <span key={b} className="inline-flex items-center gap-1.5 bg-card border border-border px-3 py-1.5 rounded-full text-xs text-foreground">
                  <CheckCircle2 className="w-3.5 h-3.5 text-brand" /> {b}
                </span>
              ))}
            </div>
          </div>
          <div className="relative">
            <img
              src={heroTechnician}
              alt="Technicien Ocarina Spa en uniforme réparant un pack électronique de spa en hiver au Québec"
              width={1600}
              height={1067}
              className="w-full h-auto rounded-2xl shadow-2xl object-cover"
            />
          </div>
        </div>
      </section>

      {/* 2. Urgence Spa 24/7 */}
      <section className="bg-background">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="bg-gradient-to-br from-red-600 to-red-700 text-white rounded-2xl p-6 md:p-10 shadow-xl">
            <div className="grid md:grid-cols-[1fr_auto] gap-6 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide">
                  <AlertTriangle className="w-4 h-4" /> Urgence Spa 24/7
                </div>
                <h2 className="mt-3 font-display text-2xl md:text-3xl font-bold">
                  Spa en panne, fuite ou risque de gel ? Appelez tout de suite.
                </h2>
                <p className="mt-2 text-white/90">
                  Intervention rapide pour éviter les dommages — chauffe-eau hors service,
                  pompe bloquée, eau qui gèle dans les canalisations.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <a href={`tel:${SITE.phoneTel}`} onClick={trackPhoneCall} className="inline-flex items-center justify-center gap-2 bg-white text-red-700 px-6 py-3.5 rounded-md font-bold text-lg hover:bg-white/90 transition-colors shadow-lg">
                  <Phone className="w-5 h-5" /> {SITE.phone}
                </a>
                <Link to="/urgence-spa" className="text-center text-sm text-white/90 underline hover:text-white">
                  En savoir plus sur l'urgence 24/7 →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Réparations effectuées */}
      <RepairsGrid />

      {/* 4. Marques de spas réparées */}
      <SpaBrands compact />

      {/* 5. Avant / Après */}
      <BeforeAfter />

      {/* 6. Codes d'erreur — teaser */}
      <section className="bg-surface">
        <div className="container mx-auto px-4 py-16">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-brand font-semibold uppercase text-sm tracking-wide">
                Codes d'erreur de spa
              </p>
              <h2 className="mt-3 font-display text-3xl md:text-4xl font-bold text-foreground">
                FLO, OH, DR, SN… que veut dire le code sur ton panneau ?
              </h2>
              <p className="mt-4 text-muted-foreground">
                Notre guide bilingue regroupe les codes d'erreur les plus fréquents sur les spas
                Balboa, Gecko, Jacuzzi, Hydropool, Arctic Spas, Beachcomber, Sundance et plus.
                Identifie ta panne en quelques secondes.
              </p>
              <Link to="/codes-erreur" className="mt-6 inline-flex items-center gap-2 bg-brand text-brand-foreground px-5 py-3 rounded-md font-semibold hover:bg-brand-dark transition-colors">
                <AlertCircle className="w-5 h-5" /> Consulter les codes d'erreur
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { code: "FLO", msg: "Pas de débit d'eau" },
                { code: "OH", msg: "Surchauffe détectée" },
                { code: "DR", msg: "Niveau d'eau bas" },
                { code: "SN", msg: "Sonde défectueuse" },
              ].map((c) => (
                <div key={c.code} className="bg-card border border-border rounded-xl p-4 text-center">
                  <div className="font-display text-3xl font-bold text-brand">{c.code}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{c.msg}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 7. Diagnostic AI — teaser */}
      <section className="bg-background">
        <div className="container mx-auto px-4 py-16">
          <div className="bg-card border border-border rounded-2xl p-8 md:p-12 text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-brand/10 border border-brand/30 px-3 py-1.5 rounded-full text-sm text-brand font-semibold">
              <Sparkles className="w-4 h-4" /> Diagnostic AI gratuit
            </div>
            <h2 className="mt-4 font-display text-3xl md:text-4xl font-bold text-foreground">
              Décris ton problème, reçois un diagnostic + un rappel
            </h2>
            <p className="mt-4 text-muted-foreground">
              Remplis le formulaire — un technicien Ocarina Spa te rappelle pour planifier la
              visite. Toutes marques, tout le Québec.
            </p>
            <Link to="/diagnostic" className="mt-6 inline-flex items-center gap-2 bg-brand text-brand-foreground px-6 py-3.5 rounded-md font-semibold text-lg hover:bg-brand-dark transition-colors shadow-lg shadow-brand/30">
              <Sparkles className="w-5 h-5" /> Lancer le Diagnostic AI
            </Link>
          </div>
        </div>
      </section>

      {/* 8. Zones desservies */}
      <CityLinks />

      {/* 8b. SEO local */}
      <section className="bg-background">
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <div className="bg-surface border border-border rounded-xl p-6 md:p-8">
            <h2 className="font-display text-2xl font-bold text-foreground">
              Réparation de spas partout dans le Grand Montréal et au Québec
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Ocarina Spa offre la réparation de spas et hot tubs à <strong>Laval, Montréal,
              Terrebonne, Blainville, Repentigny, Mascouche, Saint-Jérôme, Longueuil,
              Trois-Rivières et Québec</strong>. Notre équipe mobile intervient à domicile pour
              le diagnostic, la réparation de pompes, de chauffe-eau, de packs électroniques,
              de fuites et la résolution des codes d'erreur (FLO, OH, DR, SN). Service
              d'urgence 24/7 en hiver pour éviter le gel des canalisations.
            </p>
          </div>
        </div>
      </section>

      {/* 9. FAQ + 10. Contact */}
      <section className="bg-surface">
        <div className="container mx-auto px-4 py-20 grid lg:grid-cols-2 gap-12">
          <div>
            <p className="text-brand font-semibold uppercase text-sm tracking-wide">Questions fréquentes</p>
            <h2 className="mt-3 font-display text-3xl md:text-4xl font-bold text-foreground">FAQ — Spa & piscine au Québec</h2>
            <div className="mt-6 space-y-3">
              {FAQS.map((f) => (
                <details key={f.q} className="group border border-border rounded-lg bg-card p-5">
                  <summary className="font-semibold text-foreground cursor-pointer">{f.q}</summary>
                  <p className="mt-2 text-sm text-muted-foreground">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
          <ServiceRequestForm />
        </div>
      </section>
    </Layout>
  );
}
