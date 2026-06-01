import { createFileRoute } from "@tanstack/react-router";
import { Phone, Siren, Snowflake, Truck, Clock, MapPin } from "lucide-react";
import { Layout } from "@/components/Layout";
import { ServiceRequestForm } from "@/components/ServiceRequestForm";
import { SITE, altLinks, breadcrumbSchema, localBusinessSchema } from "@/lib/seo";
import hiver from "@/assets/avant-apres-hiver.jpg";

export const Route = createFileRoute("/urgence-spa")({
  head: () => ({
    meta: [
      { title: "Urgence Spa 24/7 au Québec — Gel, panne, spa arrêté l'hiver" },
      {
        name: "description",
        content:
          "Service d'urgence spa 24/7 au Québec. Spa arrêté en hiver, risque de gel de plomberie, panne soudaine. Intervention rapide à Laval, Montréal, Rive-Nord.",
      },
      { property: "og:title", content: "Urgence Spa 24/7 — Ocarina Spa" },
      {
        property: "og:description",
        content:
          "Intervention rapide pour spa arrêté l'hiver, gel de plomberie, fuite ou panne électrique. Service partout au Québec.",
      },
      { property: "og:url", content: SITE.domain + "/urgence-spa" },
    ],
    links: altLinks({ path: "/urgence-spa", enPath: null }),
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(localBusinessSchema({ areaName: "Québec" })),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify(
          breadcrumbSchema([
            { name: "Accueil", url: SITE.domain + "/" },
            { name: "Urgence Spa", url: SITE.domain + "/urgence-spa" },
          ]),
        ),
      },
    ],
  }),
  component: UrgencePage,
});

const FEATURES = [
  { icon: Clock, title: "Déplacement rapide", desc: "Priorité aux pannes critiques l'hiver." },
  { icon: Snowflake, title: "Service hiver Québec", desc: "Spécialistes du froid québécois et du redémarrage hivernal." },
  { icon: Siren, title: "Gel de plomberie", desc: "Sauvetage de pompe, jets, plomberie PVC gelée." },
  { icon: Truck, title: "Pièces à bord", desc: "Sondes, relais, chauffe-eau et joints les plus courants." },
];

const ZONES = ["Laval", "Montréal", "Rive-Nord", "Terrebonne", "Blainville", "Mascouche", "Longueuil", "Trois-Rivières", "Saint-Jérôme"];

function UrgencePage() {
  return (
    <Layout>
      <section className="relative text-white">
        <img
          src={hiver}
          alt="Spa enneigé sauvé en pleine nuit d'hiver au Québec"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-red-900/90 via-red-800/85 to-red-900/90" />
        <div className="container mx-auto px-4 py-20 md:py-28 relative">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur px-4 py-1.5 rounded-full text-sm font-semibold">
            <Siren className="w-4 h-4 animate-pulse" /> Urgence Spa 24/7
          </div>
          <h1 className="mt-4 font-display text-4xl md:text-6xl font-bold max-w-3xl">
            Spa arrêté en hiver ? On intervient vite.
          </h1>
          <p className="mt-5 text-lg md:text-xl opacity-90 max-w-2xl">
            Quand un spa cesse de chauffer en plein hiver québécois, la plomberie peut geler en
            quelques heures. Appelez-nous — on priorise les urgences.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href={`tel:${SITE.phoneTel}`}
              className="inline-flex items-center gap-2 bg-white text-red-700 px-7 py-4 rounded-md font-bold text-lg hover:bg-red-50 shadow-2xl"
            >
              <Phone className="w-5 h-5" /> {SITE.phone}
            </a>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16 grid lg:grid-cols-2 gap-12">
        <div>
          <h2 className="font-display text-3xl font-bold text-foreground">
            Pourquoi appeler en urgence ?
          </h2>
          <ul className="mt-6 space-y-4">
            {FEATURES.map((f) => (
              <li key={f.title} className="flex gap-4">
                <f.icon className="w-8 h-8 text-brand shrink-0" strokeWidth={1.75} />
                <div>
                  <h3 className="font-semibold text-foreground">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </div>
              </li>
            ))}
          </ul>

          <h3 className="mt-10 font-display text-xl font-semibold text-foreground">
            Interventions fréquentes en hiver
          </h3>
          <div className="mt-4 flex flex-wrap gap-2">
            {ZONES.map((z) => (
              <span
                key={z}
                className="inline-flex items-center gap-1.5 bg-brand/10 border border-brand/30 text-foreground px-3 py-1.5 rounded-full text-sm"
              >
                <MapPin className="w-3.5 h-3.5 text-brand" /> {z}
              </span>
            ))}
          </div>
        </div>
        <ServiceRequestForm />
      </section>
    </Layout>
  );
}
