import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { ServiceRequestForm } from "@/components/ServiceRequestForm";
import { SITE, localBusinessSchema, altLinks } from "@/lib/seo";
import { trackPhoneCall } from "@/lib/gtag";
import { Phone, CheckCircle2 } from "lucide-react";
import truck from "@/assets/ocarina-truck.jpg";

export const Route = createFileRoute("/en")({
  head: () => ({
    meta: [
      { title: "Hot Tub Repair & Spa Service in Quebec — Ocarina Spa" },
      { name: "description", content: "Professional hot tub and spa service across Quebec: repair, maintenance, installation, opening, closing. Pool service available. Call 819-913-7727." },
      { property: "og:title", content: "Ocarina Spa — Hot tub & spa service in Quebec" },
      { property: "og:description", content: "Mobile hot tub repair and maintenance across Quebec." },
      { property: "og:locale", content: "en_CA" },
    ],
    links: [
      { rel: "canonical", href: SITE.domain + "/en" },
      { rel: "alternate", hreflang: "en-CA", href: SITE.domain + "/en" },
      { rel: "alternate", hreflang: "fr-CA", href: SITE.domain + "/" },
      { rel: "alternate", hreflang: "x-default", href: SITE.domain + "/" },
    ],
    scripts: [{ type: "application/ld+json", children: JSON.stringify(localBusinessSchema()) }],
  }),
  component: () => (
    <Layout>
      <section className="bg-surface">
        <div className="container mx-auto px-4 py-16 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-brand font-semibold uppercase text-sm tracking-wide">Across Quebec</p>
            <h1 className="mt-3 font-display text-4xl md:text-5xl font-bold text-foreground">
              Hot tub repair, maintenance and spa service in Quebec
            </h1>
            <p className="mt-5 text-muted-foreground">
              Ocarina Spa offers professional mobile service for hot tubs, spas and pools across Quebec — repair, maintenance, installation, opening and closing.
            </p>
            <a href={`tel:${SITE.phoneTel}`} onClick={trackPhoneCall} className="mt-6 inline-flex items-center gap-2 bg-brand text-brand-foreground px-6 py-3.5 rounded-md font-semibold text-lg">
              <Phone className="w-5 h-5" /> Call {SITE.phone}
            </a>
            <ul className="mt-6 grid sm:grid-cols-2 gap-2 text-sm">
              {["Hot tub repair", "Hot tub maintenance", "Spa service", "Pool opening & closing", "Pool cleaning", "All brands"].map((b) => (
                <li key={b} className="flex items-center gap-2 text-foreground">
                  <CheckCircle2 className="w-4 h-4 text-brand" /> {b}
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm text-muted-foreground">
              <Link to="/" className="text-brand hover:underline">Version française →</Link>
            </p>
          </div>
          <img src={truck} alt="Ocarina Spa service truck" className="rounded-2xl shadow-2xl" />
        </div>
      </section>
      <section className="container mx-auto px-4 py-16 max-w-2xl">
        <ServiceRequestForm defaultService="Hot tub repair" />
      </section>
    </Layout>
  ),
});
