import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import {
  Phone,
  ShieldCheck,
  Search,
  ExternalLink,
  Loader2,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Send,
  Copy,
  Info,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { findInvoice, type InvoiceLookupResult } from "@/lib/invoices.functions";
import {
  getInteracConfig,
  selectInteracPayment,
  type InteracConfig,
} from "@/lib/post-payment.functions";
import { SITE } from "@/lib/seo";
import {
  trackInvoicePageView,
  trackInvoiceLookup,
  trackInvoiceFound,
  trackInvoicePayClick,
  trackInteracSelected,
  trackPhoneCall,
} from "@/lib/gtag";
import { toast } from "sonner";
import logo from "@/assets/ocarina-logo.png";

export const Route = createFileRoute("/payer-facture")({
  head: () => ({
    meta: [
      { title: "Payer une facture — Ocarina Spa" },
      {
        name: "description",
        content:
          "Payez votre facture Ocarina Spa par carte (Stripe) ou par virement Interac. Portail sécurisé.",
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

type Method = "card" | "interac" | null;

function PayerFacturePage() {
  const lookup = useServerFn(findInvoice);
  const interacFn = useServerFn(selectInteracPayment);
  const interacCfgFn = useServerFn(getInteracConfig);

  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<InvoiceLookupResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [method, setMethod] = useState<Method>(null);
  const [interacCfg, setInteracCfg] = useState<InteracConfig | null>(null);
  const [interacConfirmed, setInteracConfirmed] = useState(false);

  useEffect(() => {
    trackInvoicePageView();
    interacCfgFn().then(setInteracCfg).catch(() => setInteracCfg(null));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setMethod(null);
    setInteracConfirmed(false);
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

  function handleCardPay(url: string) {
    trackInvoicePayClick();
    window.location.href = url;
  }

  async function handleInteracConfirm() {
    setLoading(true);
    try {
      const r = await interacFn({ data: { invoiceNumber, emailOrPhone } });
      if (r.ok) {
        setInteracConfirmed(true);
        trackInteracSelected();
        toast.success("Merci — nous confirmerons la réception du virement.");
      } else if ("reason" in r) {
        toast.error(
          r.reason === "already_paid"
            ? "Cette facture est déjà payée."
            : "Impossible d'enregistrer le paiement Interac. Réessayez.",
        );
      }
    } catch {
      toast.error("Erreur. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  }

  const showMethodChoice =
    result?.found === true && result.payable && !method && !interacConfirmed;
  const showCardBox = result?.found === true && method === "card";
  const showInteracBox = result?.found === true && method === "interac" && !interacConfirmed;

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
              Payez par carte (Stripe) ou par virement Interac.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 bg-background border border-border rounded-full px-4 py-1.5 text-sm">
              <ShieldCheck className="w-4 h-4 text-brand" />
              <span>Paiement sécurisé — aucune carte stockée sur ce site</span>
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
                      ? "Le numéro de facture existe mais l'email ou téléphone fourni ne correspond pas."
                      : "Aucune facture ne correspond. Vérifiez auprès d'Ocarina Spa."}
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
                  <p className="mt-4 text-sm border-t border-border pt-4">{result.description}</p>
                )}

                <div className="mt-4 flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Statut :</span>
                  <StatusBadge status={result.status} />
                </div>

                {/* Already paid */}
                {result.status === "paid" && (
                  <div className="mt-5 rounded-md border border-green-300 bg-green-50 p-4 text-sm text-green-900 dark:bg-green-950/30 dark:border-green-800 dark:text-green-200">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
                      <div className="flex-1">
                        <p className="font-semibold">Facture payée. Merci !</p>
                        <p className="mt-1">
                          Aidez-nous en donnant votre avis sur le service.
                        </p>
                        <Link
                          to="/paiement-confirme"
                          search={{ n: result.invoiceNumber, c: emailOrPhone }}
                          className="inline-block mt-3 underline font-medium"
                        >
                          Évaluer mon expérience →
                        </Link>
                      </div>
                    </div>
                  </div>
                )}

                {/* Method choice */}
                {showMethodChoice && (
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <button
                      onClick={() => setMethod("card")}
                      className="border border-border rounded-lg p-4 text-left hover:border-brand hover:bg-brand/5 transition-colors"
                    >
                      <CreditCard className="w-6 h-6 text-brand mb-2" />
                      <p className="font-semibold">Carte de crédit / débit</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Paiement sécurisé Stripe, reçu immédiat.
                      </p>
                    </button>
                    <button
                      onClick={() => setMethod("interac")}
                      className="border border-border rounded-lg p-4 text-left hover:border-brand hover:bg-brand/5 transition-colors"
                    >
                      <Send className="w-6 h-6 text-brand mb-2" />
                      <p className="font-semibold">Virement Interac</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Depuis votre banque canadienne — confirmation manuelle.
                      </p>
                    </button>
                  </div>
                )}

                {/* Card box */}
                {showCardBox && result.hostedInvoiceUrl && (
                  <div className="mt-5 rounded-md border border-border bg-background p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <CreditCard className="w-5 h-5 text-brand" />
                      <p className="font-semibold">Paiement par carte (Stripe)</p>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Vous serez redirigé vers la page de paiement sécurisée Stripe.
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      <Button onClick={() => handleCardPay(result.hostedInvoiceUrl!)} size="lg">
                        Payer maintenant <ExternalLink className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="lg" onClick={() => setMethod(null)}>
                        Changer de méthode
                      </Button>
                    </div>
                  </div>
                )}

                {/* Interac box */}
                {showInteracBox && (
                  <InteracPanel
                    cfg={interacCfg}
                    amount={formatAmount(result.amountDueCents, result.currency)}
                    invoiceNumber={result.invoiceNumber}
                    onBack={() => setMethod(null)}
                    onConfirm={handleInteracConfirm}
                    loading={loading}
                  />
                )}

                {/* Interac confirmed */}
                {interacConfirmed && (
                  <div className="mt-5 rounded-md border border-brand/40 bg-brand/5 p-4">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-6 h-6 text-brand mt-0.5" />
                      <div>
                        <p className="font-semibold">Merci !</p>
                        <p className="text-sm mt-1">
                          Envoyez maintenant votre virement Interac. Nous confirmerons
                          manuellement dès réception, puis votre facture passera au statut
                          «&nbsp;payée&nbsp;».
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Besoin d'aide ? Appelez le{" "}
                          <a href={`tel:${SITE.phoneTel}`} className="underline">
                            {SITE.phone}
                          </a>
                          .
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <p className="text-xs text-muted-foreground text-center mt-6">
              Vos informations de paiement sont traitées par Stripe. Ocarina Spa ne stocke jamais
              vos données de carte.
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

function InteracPanel({
  cfg,
  amount,
  invoiceNumber,
  onBack,
  onConfirm,
  loading,
}: {
  cfg: InteracConfig | null;
  amount: string;
  invoiceNumber: string;
  onBack: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copié");
    } catch {
      /* noop */
    }
  }
  const configured = cfg && cfg.recipientEmail;
  return (
    <div className="mt-5 rounded-md border border-border bg-background p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Send className="w-5 h-5 text-brand" />
        <p className="font-semibold">Virement Interac</p>
      </div>

      {!configured ? (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-200">
          <p className="font-medium">Virement Interac temporairement indisponible.</p>
          <p className="mt-1">
            Appelez le{" "}
            <a href={`tel:${SITE.phoneTel}`} className="underline">
              {SITE.phone}
            </a>{" "}
            pour obtenir les coordonnées de virement.
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm">
            Vous pouvez payer cette facture par virement Interac. Utilisez le numéro de facture
            comme message ou référence du virement.
          </p>
          <dl className="grid gap-3 sm:grid-cols-2 text-sm">
            <InteracField label="Destinataire" value={cfg!.recipientName} />
            <InteracField label="Courriel Interac" value={cfg!.recipientEmail!} copyable onCopy={copy} />
            <InteracField label="Montant exact" value={amount} copyable onCopy={copy} highlight />
            <InteracField
              label="Message à inscrire"
              value={invoiceNumber}
              copyable
              onCopy={copy}
              highlight
            />
          </dl>

          <div className="rounded-md border border-border bg-surface p-3 text-xs text-muted-foreground flex gap-2">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              {cfg!.autodepositEnabled ? (
                <>Aucune question de sécurité requise (autodépôt activé).</>
              ) : (
                <>
                  Une question de sécurité peut être demandée par votre banque. La réponse vous a
                  été communiquée séparément par Ocarina Spa.
                </>
              )}
              <br />
              Le paiement sera confirmé manuellement après réception.
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button onClick={onConfirm} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Enregistrement…
                </>
              ) : (
                <>J'ai envoyé le virement</>
              )}
            </Button>
            <Button variant="outline" onClick={onBack} disabled={loading}>
              Changer de méthode
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function InteracField({
  label,
  value,
  copyable,
  onCopy,
  highlight,
}: {
  label: string;
  value: string;
  copyable?: boolean;
  onCopy?: (s: string) => void;
  highlight?: boolean;
}) {
  return (
    <div className="border border-border rounded-md p-2 bg-surface">
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="flex items-center justify-between gap-2 mt-1">
        <span className={`font-medium break-all ${highlight ? "text-brand" : ""}`}>{value}</span>
        {copyable && (
          <button
            type="button"
            onClick={() => onCopy?.(value)}
            className="text-muted-foreground hover:text-foreground p-1"
            aria-label={`Copier ${label}`}
          >
            <Copy className="w-4 h-4" />
          </button>
        )}
      </dd>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    paid: {
      label: "Payée",
      className: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
    },
    open: {
      label: "En attente de paiement",
      className: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
    },
    pending_interac: {
      label: "En attente virement Interac",
      className: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
    },
    interac_received: {
      label: "Interac reçu",
      className: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
    },
    draft: { label: "Brouillon", className: "bg-muted text-muted-foreground" },
    void: { label: "Annulée", className: "bg-muted text-muted-foreground" },
    uncollectible: { label: "Non recouvrable", className: "bg-muted text-muted-foreground" },
  };
  const s = map[status] ?? { label: status, className: "bg-muted text-muted-foreground" };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${s.className}`}
    >
      {s.label}
    </span>
  );
}
