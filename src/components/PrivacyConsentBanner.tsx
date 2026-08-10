import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { readPrivacyConsent, savePrivacyConsent, type PrivacyConsent } from "@/lib/privacy-consent";
import { initializeGoogleTagsForConsent } from "@/lib/gtag";

export function PrivacyConsentBanner() {
  const [consent, setConsent] = useState<PrivacyConsent | null | undefined>(undefined);
  const [customizing, setCustomizing] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    const existing = readPrivacyConsent();
    setConsent(existing);
    if (existing) initializeGoogleTagsForConsent(existing);
  }, []);

  function apply(next: { analytics: boolean; marketing: boolean }) {
    const saved = savePrivacyConsent(next);
    setConsent(saved);
    setAnalytics(saved.analytics);
    setMarketing(saved.marketing);
    initializeGoogleTagsForConsent(saved);
  }

  if (consent === undefined || consent !== null) return null;

  return (
    <aside className="fixed inset-x-0 bottom-0 z-[100] border-t border-border bg-background/98 shadow-2xl backdrop-blur" aria-label="Préférences de confidentialité">
      <div className="container mx-auto max-w-6xl px-4 py-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <p className="font-semibold text-foreground">Vos préférences de confidentialité</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Les témoins nécessaires au fonctionnement du site restent actifs. Avec votre accord, nous pouvons aussi activer les mesures d’audience et le suivi publicitaire Google. Vous pouvez refuser ou choisir séparément chaque usage.
            </p>
            <Link to="/confidentialite" className="mt-1 inline-block text-sm font-medium text-brand hover:underline">Politique de confidentialité</Link>
          </div>
          {!customizing ? (
            <div className="flex flex-wrap gap-2 lg:justify-end">
              <Button type="button" variant="outline" onClick={() => apply({ analytics: false, marketing: false })}>Tout refuser</Button>
              <Button type="button" variant="outline" onClick={() => setCustomizing(true)}>Personnaliser</Button>
              <Button type="button" onClick={() => apply({ analytics: true, marketing: true })}>Tout accepter</Button>
            </div>
          ) : (
            <div className="min-w-full rounded-lg border border-border bg-surface p-4 lg:min-w-[360px]">
              <label className="flex items-start justify-between gap-4 py-2">
                <span><strong className="block text-sm">Mesure d’audience</strong><span className="text-xs text-muted-foreground">Google Analytics 4</span></span>
                <input type="checkbox" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} className="mt-1 h-5 w-5 accent-[var(--brand)]" />
              </label>
              <label className="flex items-start justify-between gap-4 border-t border-border py-2">
                <span><strong className="block text-sm">Publicité et conversions</strong><span className="text-xs text-muted-foreground">Google Ads</span></span>
                <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} className="mt-1 h-5 w-5 accent-[var(--brand)]" />
              </label>
              <div className="mt-3 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setCustomizing(false)}>Retour</Button>
                <Button type="button" onClick={() => apply({ analytics, marketing })}>Enregistrer mes choix</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
