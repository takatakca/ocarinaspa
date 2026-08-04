import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { checkIsAdmin } from "@/lib/admin-invoices.functions";
import { getSystemStatus, type SystemStatus } from "@/lib/admin-status.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle2, XCircle, FileText, Sparkles } from "lucide-react";

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

  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [tags, setTags] = useState({ ads: false, ga4: false });

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
              <Sparkles className="mr-2 h-4 w-4" /> Expérience
            </Link>
          </Button>
        </div>
      </div>

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
          <StatusRow label="Stripe backend" ok={!!status?.stripeSecret} note="Clé secrète Stripe (server-only)" />
          <StatusRow label="Webhook Stripe" ok={!!status?.stripeWebhookSecret} note="Signing secret du webhook" />
          <StatusRow label="Interac" ok={!!status?.interacEmail} note="Courriel de virement Interac" />
          <StatusRow
            label="Question de sécurité Interac"
            ok={!!status?.interacSecurityQuestion}
            note="Optionnel si autodépôt activé"
          />
          <StatusRow label="Allow-list admin" ok={!!status?.adminEmails} note="ADMIN_EMAILS" />
          <StatusRow
            label="Google Review URL"
            ok={Boolean((import.meta as any).env?.VITE_GOOGLE_REVIEW_URL)}
            note="Lien officiel d'avis Google"
          />
          <StatusRow
            label="Facebook URL"
            ok={Boolean((import.meta as any).env?.VITE_FACEBOOK_PAGE_URL)}
            note="Page Facebook Ocarina Spa"
          />
        </CardContent>
      </Card>
    </div>
  );
}
