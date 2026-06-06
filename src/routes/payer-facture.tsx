import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Phone, ShieldCheck, Search, ExternalLink, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { findInvoice, type InvoiceLookupResult } from "@/lib/invoices.functions";
import { SITE } from "@/lib/seo";
import {
  trackInvoicePageView,
  trackInvoiceLookup,
  trackInvoiceFound,
  trackInvoicePayClick,
  trackPhoneCall,
} from "@/lib/gtag";
import logo from "@/assets/ocarina-logo.png";

export const Route = createFileRoute("/payer-facture")({
  head: () => ({
    meta: [
      { title: "Payer une facture — Ocarina Spa" },
      {
        name: "description",
        content:
          "Payez votre facture Ocarina Spa de façon sécurisée. Entrez votre numéro de facture pour accéder au paiement.",
      },
      { name: "robots", content: "noindex,follow" },
    ],
  }),
  component: PayerFacturePage,
});

function formatAmount(cents: number, currency: string) {
  return new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

function PayerFacturePage() {
  const lookup = useServerFn(findInvoice);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<InvoiceLookupResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    trackInvoicePageView();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);
    trackInvoiceLookup();
    try {
      const res = await lookup({ data: { invoiceNumber, emailOrPhone } });
      setResult(res);
      if (res.found) trackInvoiceFound();
    } catch (err) {
      console.error(err);
      setError("Une erreur est survenue. Veuillez réessayer ou nous appeler.");
    } finally {
      setLoading(false);
    }
  }

  function handlePayClick(url: string) {
    trackInvoicePayClick();
    window.location.href = url;
  }

  return (
    <>
      <Header />
      <main className="min-h-[70vh] bg-surface py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <img src={logo} alt="Ocarina Spa" className="h-16 w-auto mx-auto mb-4" />
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
              Payer une facture Ocarina Spa
            </h1>
            <p className="text-muted-foreground mt-3">
              Entrez votre numéro de facture pour accéder au paiement sécurisé.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 bg-background border border-border rounded-full px-4 py-1.5 text-sm">
              <ShieldCheck className="w-4 h-4 text-brand" />
              <span>Paiement sécurisé par Stripe</span>
            </div>
          </div>

          <div className="bg-background rounded-xl border border-border shadow-sm p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="invoiceNumber">Numéro de facture</Label>
                <Input
                  id="invoiceNumber"
                  required
                  autoComplete="off"
                  placeholder="Ex. OCAR-0001"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="emailOrPhone">Email ou téléphone</Label>
                <Input
                  id="emailOrPhone"
                  required
                  placeholder="votre@email.com ou 819-555-1234"
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Utilisé pour vérifier votre identité.
                </p>
              </div>

              <Button type="submit" disabled={loading} className="w-full" size="lg">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Recherche...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" /> Rechercher ma facture
                  </>
                )}
              </Button>
            </form>

            {error && (
              <div className="mt-6 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {result && !result.found && (
              <div className="mt-6 flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-200 dark:border-amber-800">
                <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold">Facture introuvable</p>
                  <p className="mt-1">
                    {result.reason === "mismatch"
                      ? "Le numéro de facture existe mais l'email ou téléphone fourni ne correspond pas. Vérifiez et réessayez."
                      : "Aucune facture ne correspond à ce numéro. Vérifiez auprès d'Ocarina Spa."}
                  </p>
                </div>
              </div>
            )}

            {result && result.found && (
              <div className="mt-6 rounded-lg border border-border bg-surface p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Facture
                    </p>
                    <p className="font-display text-xl font-bold">{result.invoiceNumber}</p>
                    {result.customerName && (
                      <p className="text-sm text-muted-foreground mt-1">{result.customerName}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Montant dû
                    </p>
                    <p className="font-display text-2xl font-bold text-brand">
                      {formatAmount(result.amountDueCents, result.currency)}
                    </p>
                  </div>
                </div>

                {result.description && (
                  <p className="mt-4 text-sm border-t border-border pt-4">
                    {result.description}
                  </p>
                )}

                <div className="mt-4 flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Statut :</span>
                  <StatusBadge status={result.status} />
                </div>

                {result.payable && result.hostedInvoiceUrl ? (
                  <Button
                    onClick={() => handlePayClick(result.hostedInvoiceUrl!)}
                    className="w-full mt-5"
                    size="lg"
                  >
                    Payer maintenant <ExternalLink className="w-4 h-4" />
                  </Button>
                ) : (
                  <div className="mt-5 flex items-start gap-2 rounded-md border border-border bg-background p-4 text-sm">
                    {result.status === "paid" ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                        <span>Cette facture est déjà payée. Merci !</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
                        <span>
                          Cette facture n'est pas payable en ligne pour le moment. Contactez-nous
                          au {SITE.phone}.
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            <p className="text-xs text-muted-foreground text-center mt-6">
              Vos informations de paiement sont traitées de façon sécurisée par Stripe. Ocarina Spa
              ne stocke jamais vos données de carte.
            </p>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground mb-2">Besoin d'aide avec votre facture ?</p>
            <a
              href={`tel:${SITE.phoneTel}`}
              onClick={trackPhoneCall}
              className="inline-flex items-center gap-2 bg-brand text-brand-foreground px-5 py-3 rounded-md font-semibold hover:bg-brand-dark transition-colors"
            >
              <Phone className="w-4 h-4" /> Appeler {SITE.phone}
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    paid: { label: "Payée", className: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300" },
    open: { label: "En attente de paiement", className: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300" },
    draft: { label: "Brouillon", className: "bg-muted text-muted-foreground" },
    void: { label: "Annulée", className: "bg-muted text-muted-foreground" },
    uncollectible: { label: "Non recouvrable", className: "bg-muted text-muted-foreground" },
  };
  const s = map[status] ?? { label: status, className: "bg-muted text-muted-foreground" };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${s.className}`}>
      {s.label}
    </span>
  );
}
