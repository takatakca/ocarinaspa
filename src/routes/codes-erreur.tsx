import { createFileRoute, Link } from "@tanstack/react-router";
import { Phone, AlertTriangle } from "lucide-react";
import { Layout } from "@/components/Layout";
import { SITE, altLinks, breadcrumbSchema, faqSchema } from "@/lib/seo";
import { SPA_ERROR_CODES } from "@/data/spaErrorCodes";

export const Route = createFileRoute("/codes-erreur")({
  head: () => ({
    meta: [
      { title: "Codes d'erreur de spa (FLO, OH, DR, SN…) — Ocarina Spa Québec" },
      {
        name: "description",
        content:
          "Signification et solutions des codes d'erreur de spa : FLO, FLC, OH, DR, SN, ICE, HL, LF. Diagnostic Balboa, Gecko et réparation au Québec.",
      },
      { property: "og:title", content: "Codes d'erreur de spa — Ocarina Spa" },
      {
        property: "og:description",
        content:
          "Tous les codes d'erreur expliqués : FLO, OH, DR, SN, ICE, HL, LF, FLC. Réparation toutes marques au Québec.",
      },
      { property: "og:url", content: SITE.domain + "/codes-erreur" },
    ],
    links: altLinks({ path: "/codes-erreur", enPath: null }),
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(
          breadcrumbSchema([
            { name: "Accueil", url: SITE.domain + "/" },
            { name: "Codes d'erreur", url: SITE.domain + "/codes-erreur" },
          ]),
        ),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify(
          faqSchema(
            SPA_ERROR_CODES.map((c) => ({
              q: `Que signifie le code ${c.code} sur un spa ?`,
              a: `${c.meaning} ${c.action}`,
            })),
          ),
        ),
      },
    ],
  }),
  component: CodesErreurPage,
});

function CodesErreurPage() {
  return (
    <Layout>
      <section className="bg-surface">
        <div className="container mx-auto px-4 py-14 md:py-20 max-w-4xl">
          <p className="text-brand font-semibold uppercase text-sm tracking-wide">
            Guide diagnostic
          </p>
          <h1 className="mt-3 font-display text-4xl md:text-5xl font-bold text-foreground">
            Codes d'erreur de spa — significations et solutions
          </h1>
          <p className="mt-5 text-lg text-muted-foreground">
            La plupart des spas (Jacuzzi, Hydropool, Arctic, Sundance, Beachcomber, Maax,
            Bullfrog…) utilisent des systèmes Balboa ou Gecko qui affichent les mêmes codes
            d'erreur. Voici les plus fréquents au Québec et ce qu'il faut faire.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={`tel:${SITE.phoneTel}`}
              className="inline-flex items-center gap-2 bg-brand text-brand-foreground px-6 py-3 rounded-md font-semibold hover:bg-brand-dark"
            >
              <Phone className="w-5 h-5" /> Aide immédiate {SITE.phone}
            </a>
            <Link
              to="/diagnostic"
              className="inline-flex items-center gap-2 border-2 border-brand text-brand px-6 py-3 rounded-md font-semibold hover:bg-brand hover:text-brand-foreground"
            >
              Diagnostic AI gratuit
            </Link>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-14 max-w-4xl">
        <div className="grid gap-5">
          {SPA_ERROR_CODES.map((c) => (
            <article
              key={c.code}
              id={`code-${c.code.toLowerCase()}`}
              className="bg-card border border-border rounded-xl p-6 scroll-mt-24"
            >
              <div className="flex items-start gap-4">
                <div className="shrink-0 w-16 h-16 rounded-lg bg-brand/10 border border-brand/30 flex items-center justify-center">
                  <span className="font-display text-xl font-bold text-brand">{c.code}</span>
                </div>
                <div className="flex-1">
                  <h2 className="font-display text-xl font-semibold text-foreground">
                    {c.title}
                  </h2>
                  <p className="mt-2 text-muted-foreground">{c.meaning}</p>
                  <p className="mt-3 text-sm font-medium text-foreground">Causes fréquentes :</p>
                  <ul className="mt-1 list-disc list-inside text-sm text-muted-foreground">
                    {c.causes.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                  <p className="mt-3 text-sm bg-surface border border-border rounded-md p-3 text-foreground">
                    <AlertTriangle className="inline w-4 h-4 text-brand mr-1" />
                    <strong>Que faire :</strong> {c.action}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-12 bg-surface border border-border rounded-xl p-6 text-center">
          <h3 className="font-display text-xl font-semibold text-foreground">
            Votre code n'est pas dans la liste ?
          </h3>
          <p className="mt-2 text-muted-foreground">
            Appelez-nous ou essayez notre diagnostiqueur AI — vous obtenez une piste en moins
            d'une minute.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <a
              href={`tel:${SITE.phoneTel}`}
              className="inline-flex items-center gap-2 bg-brand text-brand-foreground px-5 py-2.5 rounded-md font-semibold"
            >
              <Phone className="w-4 h-4" /> {SITE.phone}
            </a>
            <Link
              to="/diagnostic"
              className="inline-flex items-center gap-2 border-2 border-brand text-brand px-5 py-2.5 rounded-md font-semibold"
            >
              Lancer le diagnostic AI
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}
