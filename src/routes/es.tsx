import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { ServiceRequestForm } from "@/components/ServiceRequestForm";
import { SITE, localBusinessSchema } from "@/lib/seo";
import { trackPhoneCall } from "@/lib/gtag";
import { Phone, CheckCircle2 } from "lucide-react";
import technician from "@/assets/hero-technicien-ocarina.jpg";

export const Route = createFileRoute("/es")({
  head: () => ({
    meta: [
      { title: "Reparación de spas y jacuzzis en Quebec — Ocarina Spa" },
      { name: "description", content: "Servicio móvil de reparación y mantenimiento de spas en Quebec. Ocarina Spa: diagnóstico, mantenimiento, apertura y cierre." },
      { property: "og:title", content: "Ocarina Spa — Servicio de spas en Quebec" },
      { property: "og:description", content: "Servicio móvil para spas y jacuzzis en Quebec." },
      { property: "og:locale", content: "es_CA" },
    ],
    links: [
      { rel: "canonical", href: SITE.domain + "/es" },
      { rel: "alternate", hreflang: "es", href: SITE.domain + "/es" },
      { rel: "alternate", hreflang: "fr-CA", href: SITE.domain + "/" },
      { rel: "alternate", hreflang: "en-CA", href: SITE.domain + "/en" },
      { rel: "alternate", hreflang: "x-default", href: SITE.domain + "/" },
    ],
    scripts: [{ type: "application/ld+json", children: JSON.stringify(localBusinessSchema()) }],
  }),
  component: () => (
    <Layout>
      <section className="bg-surface">
        <div className="container mx-auto px-4 py-16 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-brand font-semibold uppercase text-sm tracking-wide">Servicio en Quebec</p>
            <h1 className="mt-3 font-display text-4xl md:text-5xl font-bold text-foreground">Reparación y mantenimiento de spas en Quebec</h1>
            <p className="mt-5 text-muted-foreground">Ocarina Spa ofrece servicio móvil para spas y jacuzzis: diagnóstico, reparación, mantenimiento, instalación, apertura y cierre.</p>
            <a href={`tel:${SITE.phoneTel}`} onClick={trackPhoneCall} className="mt-6 inline-flex items-center gap-2 bg-brand text-brand-foreground px-6 py-3.5 rounded-md font-semibold text-lg"><Phone className="w-5 h-5" /> Llamar {SITE.phone}</a>
            <ul className="mt-6 grid sm:grid-cols-2 gap-2 text-sm">
              {["Reparación de spas", "Mantenimiento", "Servicio móvil", "Apertura y cierre", "Servicio de invierno", "Principales marcas"].map((b) => <li key={b} className="flex items-center gap-2 text-foreground"><CheckCircle2 className="w-4 h-4 text-brand" /> {b}</li>)}
            </ul>
            <p className="mt-6 text-sm text-muted-foreground"><Link to="/" className="text-brand hover:underline">Français</Link> · <Link to="/en" className="text-brand hover:underline">English</Link></p>
          </div>
          <img src={technician} alt="Técnico de Ocarina Spa trabajando en un spa exterior" className="rounded-2xl shadow-2xl" />
        </div>
      </section>
      <section className="container mx-auto px-4 py-16 max-w-2xl">
        <p className="mb-4 text-sm text-muted-foreground">El formulario de servicio se procesa actualmente en francés; nuestro equipo puede continuar el seguimiento en español.</p>
        <ServiceRequestForm defaultService="Réparation de spa" />
      </section>
    </Layout>
  ),
});
