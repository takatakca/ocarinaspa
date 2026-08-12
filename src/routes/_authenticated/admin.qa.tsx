import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { checkIsAdmin } from "@/lib/admin-invoices.functions";
import { getSystemStatus, runAdminReconciliation, type SystemStatus } from "@/lib/admin-status.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle2, XCircle, FileText, Activity, RefreshCw } from "lucide-react";
import { AW_LABELS } from "@/lib/gtag";

export const Route = createFileRoute("/_authenticated/admin/qa")({
  component: AdminQaPage,
  head: () => ({
    meta: [
      { title: "Admin — QA paiement facture Ocarina Spa" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
});

const GOOGLE_ADS_ID = "AW-18182973757";
const GA4_ID = "G-8YYZKVZBW0";

const CHECKLIST: { id: string; label: string; hint?: string }[] = [
  { id: "1", label: "Créer une facture test de 1 $ CAD (Stripe test mode)", hint: "Dashboard Stripe → Invoices → Create invoice, ou /admin/factures" },
  { id: "2", label: "Copier le numéro de facture (ex. OCAR-0042)" },
  { id: "3", label: "Aller sur /payer-facture" },
  { id: "4", label: "Entrer le numéro de facture + email ou téléphone" },
  { id: "5", label: "Vérifier que la facture apparaît avec le bon montant" },
  { id: "6", label: "Cliquer « Payer par carte »" },
  { id: "7", label: "Payer avec la carte test Stripe", hint: "4242 4242 4242 4242 — date future, CVC libre" },
  { id: "8", label: "Vérifier la réception du webhook invoice.paid", hint: "Stripe Dashboard → Developers → Events" },
  { id: "9", label: "Vérifier que le statut est « Payée » dans /admin/factures" },
  { id: "10", label: "Tester la note client (1-5 étoiles) sur /paiement-confirme" },
  { id: "11", label: "Tester le sondage complet" },
  { id: "12", label: "Vérifier la génération du crédit 10 % (OCARINA10-XXXX)" },
  { id: "13", label: "Vérifier les données dans /admin/experience" },
  { id: "14", label: "PROD — vraie facture de petit montant : création admin → /payer-facture → paiement → webhook → paid → /paiement-confirme → note → sondage → crédit 10 % → /admin/experience" },
  { id: "15", label: "PROD — Interac : pending_interac → admin confirme réception → suivi/sondage" },
  { id: "16", label: "PROD — remboursement complet Stripe : crédit 10 % inutilisé annulé/réconcilié" },
  { id: "17", label: "PROD — réutiliser le crédit OCARINA10-XXXX sur une nouvelle facture", hint: "Réduction Stripe réelle, crédit marqué utilisé, réutilisation impossible" },
  { id: "18", label: "Conformité Google Review : lien visible pour toutes les notes (1-5★), aucun incitatif, crédit lié au sondage seulement" },
];

function StatusRow({ label, ok, note }: { label: string; ok: boolean; note?: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border py-3 last:border-0">
      <div>
        <p className="font-medium">{label}</p>
        {note ? <p className="text-sm text-muted-foreground">{note}</p> : null}
      </div>
      <span
        className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${
          ok ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
        }`}
      >
        {ok ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
        {ok ? "Configuré" : "Non configuré"}
      </span>
    </div>
  );
}

function AdminQaPage() {
  const checkFn = useServerFn(checkIsAdmin);
  const statusFn = useServerFn(getSystemStatus);
  const reconcileFn = useServerFn(runAdminReconciliation);

  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [tags, setTags] = useState({ ads: false, ga4: false });
  const [reconcileBusy, setReconcileBusy] = useState(false);
  const [reconcileReport, setReconcileReport] = useState<any>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await checkFn();
        if (cancelled) return;
        setIsAdmin(res.isAdmin);
        if (res.isAdmin) setStatus(await statusFn());
      } catch {
        if (!cancelled) setIsAdmin(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [checkFn, statusFn]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("ocarina_qa_checklist");
      if (saved) setDone(JSON.parse(saved));
    } catch {
      /* ignore */
    }
    const scripts = Array.from(document.querySelectorAll("script"))
      .map((s) => s.getAttribute("src") || s.textContent || "")
      .join(" ");
    const hasGtag = typeof (window as any).gtag === "function";
    setTags({
      ads: hasGtag && scripts.includes(GOOGLE_ADS_ID),
      ga4: hasGtag && scripts.includes(GA4_ID),
    });
  }, []);

  function toggle(id: string) {
    setDone((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem("ocarina_qa_checklist", JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  async function runReconcile() {
    setReconcileBusy(true);
    try {
      setReconcileReport(await reconcileFn());
      setStatus(await statusFn());
    } finally {
      setReconcileBusy(false);
    }
  }

  if (isAdmin === null) {
    return <div className="container py-20 text-center text-muted-foreground">Vérification de l'accès…</div>;
  }

  if (!isAdmin) {
    return (
      <div className="container py-20 text-center">
        <h1 className="text-2xl font-bold">Accès refusé</h1>
        <p className="mt-2 text-muted-foreground">Cette page est réservée aux administrateurs Ocarina Spa.</p>
      </div>
    );
  }

  const completed = CHECKLIST.filter((c) => done[c.id]).length;

  const GATE: { label: string; ok: boolean }[] = [
    { label: "Stripe live configuré", ok: !!status?.stripeLiveMode && !!status?.stripeSecret && !!status?.stripePublishableKey && !!status?.stripeKeyModesMatch },
    { label: "Compte Stripe vérifié", ok: !!status?.stripeApiReachable && !!status?.stripeAccountMatches },
    { label: "Webhook live configuré", ok: !!status?.stripeWebhookSecret },
    { label: "TPS vérifiée auprès de Stripe (5 %, active, live)", ok: !!status?.gstRegistration && !!status?.stripeGstTaxRate && !!status?.stripeGstTaxRateVerified },
    { label: "TVQ vérifiée auprès de Stripe (9,975 %, active, live)", ok: !!status?.qstRegistration && !!status?.stripeQstTaxRate && !!status?.stripeQstTaxRateVerified },
    { label: "Interac configuré", ok: !!status?.interacEmail && !!status?.interacName },
    { label: "Cron d'automatisation configuré", ok: !!status?.automationCronSecret },
    { label: "Google Ads configuré", ok: tags.ads && Object.values(AW_LABELS).some(Boolean) },
    { label: "GA4 configuré", ok: tags.ga4 },
    { label: "Google Review configuré", ok: !!status?.googleReviewUrl },
    { label: "Facebook configuré", ok: !!status?.facebookPageUrl },
    { label: "Livraison courriel configurée", ok: !!status?.emailDelivery },
    { label: "Migrations base de données appliquées", ok: !!status?.hardeningMigrationApplied && !!status?.creditRedemptionMigrationApplied && !!status?.refundReconciliationMigrationApplied },
    { label: "Accès admin vérifié", ok: !!status?.adminAccessVerified && !!status?.adminEmails },
    { label: "Conformité Google Review (aucun filtrage, aucun incitatif)", ok: !!status?.googleReviewCompliance },
  ];
  const gatePassed = GATE.filter((g) => g.ok).length;
  const gateReady = gatePassed === GATE.length;

  return (
    <div className="container max-w-4xl py-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Test paiement facture</h1>
          <p className="text-muted-foreground">QA manuel du flow complet facture → paiement → sondage → crédit.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/admin/factures">
              <FileText className="mr-2 h-4 w-4" /> Factures
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/admin/experience">
              <Activity className="mr-2 h-4 w-4" /> Expérience
            </Link>
          </Button>
        </div>
      </div>


      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Porte de lancement (Go-Live)</span>
            <span className={`text-sm font-normal ${gateReady ? "text-primary" : "text-destructive"}`}>
              {gatePassed}/{GATE.length} vert
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="mb-3 text-sm text-muted-foreground">
            Ne pas passer en production tant que ces points ne sont pas tous verts.
          </p>
          {GATE.map((g) => (
            <StatusRow key={g.label} label={g.label} ok={g.ok} />
          ))}
          <div
            className={`mt-4 rounded-md border p-3 text-sm font-medium ${
              gateReady ? "border-primary/40 bg-primary/10 text-primary" : "border-destructive/40 bg-destructive/10 text-destructive"
            }`}
          >
            {gateReady ? "Porte ouverte : la configuration production est complète." : "Porte fermée : configuration production incomplète."}
          </div>
        </CardContent>
      </Card>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Checklist QA</span>
            <span className="text-sm font-normal text-muted-foreground">
              {completed}/{CHECKLIST.length} complété
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {CHECKLIST.map((item, i) => (
            <label
              key={item.id}
              className="flex cursor-pointer items-start gap-3 rounded-md border border-border p-3 transition-colors hover:bg-muted/50"
            >
              <Checkbox checked={!!done[item.id]} onCheckedChange={() => toggle(item.id)} className="mt-0.5" />
              <span>
                <span className={done[item.id] ? "line-through text-muted-foreground" : "font-medium"}>
                  {i + 1}. {item.label}
                </span>
                {item.hint ? <span className="block text-sm text-muted-foreground">{item.hint}</span> : null}
              </span>
            </label>
          ))}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader className="flex-row items-center justify-between gap-3">
          <div><CardTitle>Contrôle backend</CardTitle><p className="mt-1 text-sm text-muted-foreground">Réconcilie Stripe, crédits expirés/réservés et suivis post-paiement sans créer de nouvelle opération financière.</p></div>
          <Button type="button" variant="outline" onClick={runReconcile} disabled={reconcileBusy}><RefreshCw className={`mr-2 h-4 w-4 ${reconcileBusy ? "animate-spin" : ""}`} />{reconcileBusy ? "Contrôle…" : "Lancer le contrôle"}</Button>
        </CardHeader>
        {reconcileReport && <CardContent className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-md border p-3"><strong>{reconcileReport.checkedInvoices}</strong><br />factures vérifiées</div>
          <div className="rounded-md border p-3"><strong>{reconcileReport.repairedInvoices}</strong><br />statuts réparés</div>
          <div className="rounded-md border p-3"><strong>{reconcileReport.expiredCredits}</strong><br />crédits expirés</div>
          <div className="rounded-md border p-3"><strong>{reconcileReport.flaggedCreditReservations}</strong><br />crédits à contrôler</div>
          <div className="rounded-md border p-3"><strong>{reconcileReport.deliveredFollowups}</strong><br />suivis relivrés</div>
          {reconcileReport.warnings?.length > 0 && <div className="sm:col-span-2 lg:col-span-5 rounded-md border border-amber-300 bg-amber-50 p-3 text-amber-900"><strong>Avertissements :</strong><ul className="mt-1 list-disc pl-5">{reconcileReport.warnings.map((w: string) => <li key={w}>{w}</li>)}</ul></div>}
        </CardContent>}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>État système</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="mb-3 text-sm text-muted-foreground">
            Aucune valeur secrète n'est affichée — uniquement l'état de configuration.
          </p>
          <StatusRow label="Google Ads tag" ok={tags.ads} note={GOOGLE_ADS_ID} />
          <StatusRow label="GA4 tag" ok={tags.ga4} note={GA4_ID} />
          <StatusRow label="Google Ads conversion labels" ok={Object.values(AW_LABELS).some(Boolean)} note="Les events GA4 fonctionnent sans labels; les conversions Google Ads dédiées exigent leurs labels AW-.../XXXX." />
          <StatusRow label="Stripe backend" ok={!!status?.stripeSecret} note="Clé secrète Stripe (server-only)" />
          <StatusRow label="Stripe API joignable" ok={!!status?.stripeApiReachable} note="Lecture seule de l’état du compte Stripe." />
          <StatusRow label="Compte Stripe attendu" ok={!!status?.stripeAccountMatches} note="STRIPE_ACCOUNT_ID doit correspondre au compte de la clé active." />
          <StatusRow label="Clé publique Stripe" ok={!!status?.stripePublishableKey} note="Requise pour le Payment Element intégré." />
          <StatusRow label="Modes des clés Stripe cohérents" ok={!!status?.stripeKeyModesMatch} note="La clé secrète et la clé publique doivent être toutes les deux test ou toutes les deux live." />
          <StatusRow label="Webhook Stripe" ok={!!status?.stripeWebhookSecret} note="Signing secret du webhook" />
          <StatusRow label="Migration pré-production" ok={!!status?.hardeningMigrationApplied} note="Mémoire, idempotence, tokens et ledger webhook disponibles." />
          <StatusRow label="Crédits magasin transactionnels" ok={!!status?.creditRedemptionMigrationApplied} note="Réservation atomique et protection contre le double usage." />
          <StatusRow label="Réconciliation remboursements" ok={!!status?.refundReconciliationMigrationApplied} note="Colonnes de remboursement + webhook charge.refunded disponibles." />
          <StatusRow label="Watchdog automatique" ok={!!status?.automationCronSecret} note="AUTOMATION_CRON_SECRET — à appeler périodiquement via /api/internal/automation-reconcile." />
          <StatusRow label="Interac" ok={!!status?.interacEmail} note="Courriel de virement Interac" />
          <StatusRow
            label="Question de sécurité Interac"
            ok={!!status?.interacSecurityQuestion}
            note="Optionnel si autodépôt activé"
          />
          <StatusRow label="Allow-list admin" ok={!!status?.adminEmails} note="ADMIN_EMAILS" />
          <StatusRow label="Mode Stripe live" ok={!!status?.stripeLiveMode} note="Doit rester test jusqu’à validation finale, puis passer live." />
          <StatusRow label="No TPS" ok={!!status?.gstRegistration} note="Requis pour les factures taxables en production." />
          <StatusRow label="No TVQ" ok={!!status?.qstRegistration} note="Requis pour les factures taxables en production." />
          <StatusRow label="Stripe Tax Rate TPS" ok={!!status?.stripeGstTaxRate} note="STRIPE_TAX_RATE_GST_ID" />
          <StatusRow label="Stripe Tax Rate TVQ" ok={!!status?.stripeQstTaxRate} note="STRIPE_TAX_RATE_QST_ID" />
          <StatusRow label="Taux Stripe validés" ok={!!status?.stripeTaxRatesValid} note="TPS 5 % et TVQ 9,975 %, actifs dans Stripe." />
          <StatusRow label="Assistant backend" ok={!!status?.lovableAi} note="LOVABLE_API_KEY" />
          <StatusRow label="URL publique du site" ok={!!status?.publicSiteUrl} note="PUBLIC_SITE_URL pour les liens automatiques post-paiement." />
          <StatusRow label="Google Review URL" ok={!!status?.googleReviewUrl} note="Lien officiel d'avis Google" />
          <StatusRow label="Facebook URL" ok={!!status?.facebookPageUrl} note="Page Facebook Ocarina Spa" />
          <StatusRow label="Livraison courriel" ok={!!status?.emailDelivery} note="Fournisseur transactionnel — un envoi réel doit être testé de bout en bout." />
        </CardContent>
      </Card>
    </div>
  );
}
