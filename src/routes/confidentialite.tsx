import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { SITE } from "@/lib/seo";
import { clearPrivacyConsent } from "@/lib/privacy-consent";

export const Route = createFileRoute("/confidentialite")({
  component: PrivacyPage,
  head: () => ({
    meta: [
      { title: "Politique de confidentialité — Ocarina Spa" },
      { name: "description", content: "Politique de confidentialité, témoins, formulaires, paiements et renseignements personnels sur OcarinaSpa.ca." },
    ],
    links: [{ rel: "canonical", href: `${SITE.domain}/confidentialite` }],
  }),
});

function PrivacyPage() {
  const [reset, setReset] = useState(false);
  function changePreferences() {
    clearPrivacyConsent();
    setReset(true);
    window.setTimeout(() => window.location.reload(), 150);
  }

  return (
    <>
      <Header />
      <main className="bg-surface py-12">
        <article className="container mx-auto max-w-4xl px-4">
          <div className="rounded-2xl border border-border bg-background p-6 shadow-sm md:p-10">
            <p className="text-sm font-semibold uppercase tracking-wide text-brand">Confidentialité</p>
            <h1 className="mt-2 font-display text-3xl font-bold md:text-4xl">Politique de confidentialité</h1>
            <p className="mt-3 text-sm text-muted-foreground">Dernière mise à jour : 9 août 2026</p>

            <div className="mt-8 space-y-7 text-sm leading-7 text-foreground/90">
              <section>
                <h2 className="text-xl font-semibold">Responsable de la protection des renseignements personnels</h2>
                <p className="mt-2">Ocarina Spa Québec — Responsable de la protection des renseignements personnels<br />Courriel : <a className="text-brand underline" href={`mailto:${SITE.email}`}>{SITE.email}</a><br />Téléphone : <a className="text-brand underline" href={`tel:${SITE.phoneTel}`}>{SITE.phone}</a></p>
              </section>

              <section>
                <h2 className="text-xl font-semibold">Renseignements recueillis</h2>
                <p className="mt-2">Selon le service utilisé, nous pouvons recueillir les coordonnées que vous fournissez (nom, téléphone, courriel, ville), les renseignements nécessaires à une demande de service, à un pré-diagnostic, à une facture, à un paiement, à un sondage ou à une question de suivi. Les données de carte bancaire sont traitées par Stripe et ne sont pas enregistrées par Ocarina Spa dans le site.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold">Finalités</h2>
                <p className="mt-2">Ces renseignements servent notamment à répondre à une demande, planifier ou documenter un service, préparer et suivre une facture, confirmer un paiement, effectuer un suivi après service, gérer un crédit client, assurer la sécurité du système et conserver un historique opérationnel nécessaire au service à la clientèle.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold">Pré-diagnostic automatisé</h2>
                <p className="mt-2">Le pré-diagnostic utilise un traitement automatisé côté serveur pour organiser les symptômes communiqués et produire des pistes générales. Il ne remplace pas une inspection sur place et ne prend pas automatiquement une décision financière ou contractuelle à votre place. Les opérations financières administratives comportent un point d’approbation humaine.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold">Fournisseurs technologiques</h2>
                <p className="mt-2">Ocarina Spa utilise des fournisseurs spécialisés pour certaines fonctions, notamment Stripe pour les paiements et factures, Supabase pour l’authentification et les données, Google pour les mesures d’audience ou publicitaires lorsque vous les activez, et une infrastructure d’automatisation côté serveur pour certaines fonctions administratives. Selon le fournisseur et sa configuration, des renseignements peuvent être traités ou hébergés à l’extérieur du Québec.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold">Témoins et choix de confidentialité</h2>
                <p className="mt-2">Les fonctions nécessaires au site sont disponibles sans activer Google Analytics ou Google Ads. Les mesures d’audience et le suivi publicitaire ne sont chargés qu’après votre choix. Vous pouvez refuser les deux ou les activer séparément.</p>
                <Button type="button" variant="outline" className="mt-3" onClick={changePreferences}>{reset ? "Préférences réinitialisées…" : "Modifier mes préférences"}</Button>
              </section>

              <section>
                <h2 className="text-xl font-semibold">Conservation et sécurité</h2>
                <p className="mt-2">Nous conservons les renseignements seulement pour la durée nécessaire aux fins pour lesquelles ils ont été recueillis et aux obligations applicables. L’accès aux données administratives est restreint; les clés secrètes de paiement et les privilèges serveur ne sont pas exposés au navigateur.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold">Vos droits</h2>
                <p className="mt-2">Vous pouvez communiquer avec Ocarina Spa pour demander l’accès ou la rectification de vos renseignements, poser une question sur leur utilisation ou retirer un consentement lorsqu’il peut être retiré. Certaines données doivent toutefois être conservées lorsqu’une obligation légale ou comptable l’exige.</p>
              </section>
            </div>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
