import { useEffect, useRef, useState } from "react";
import { CreditCard, ExternalLink, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trackInvoicePayClick } from "@/lib/gtag";

declare global {
  interface Window {
    Stripe?: (publishableKey: string) => any;
  }
}

let stripeJsPromise: Promise<void> | null = null;

function loadStripeJs() {
  if (typeof window === "undefined") return Promise.reject(new Error("Browser required"));
  if (window.Stripe) return Promise.resolve();
  if (stripeJsPromise) return stripeJsPromise;

  stripeJsPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[src="https://js.stripe.com/v3/"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Stripe.js unavailable")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://js.stripe.com/v3/";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Stripe.js unavailable"));
    document.head.appendChild(script);
  });

  return stripeJsPromise;
}

export function InvoiceStripePayment({
  publishableKey,
  clientSecret,
  experienceToken,
  fallbackUrl,
  onBack,
}: {
  publishableKey: string;
  clientSecret: string;
  experienceToken: string;
  fallbackUrl: string | null;
  onBack: () => void;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const stripeRef = useRef<any>(null);
  const elementsRef = useRef<any>(null);
  const paymentElementRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        await loadStripeJs();
        if (cancelled || !window.Stripe || !mountRef.current) return;

        const stripe = window.Stripe(publishableKey);
        const elements = stripe.elements({
          clientSecret,
          appearance: {
            theme: "stripe",
            variables: {
              borderRadius: "8px",
              fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            },
          },
        });
        const paymentElement = elements.create("payment", { layout: "tabs" });
        paymentElement.mount(mountRef.current);
        paymentElement.on("ready", () => !cancelled && setReady(true));

        stripeRef.current = stripe;
        elementsRef.current = elements;
        paymentElementRef.current = paymentElement;
      } catch (err) {
        console.error("[stripe-elements] initialization failed", err);
        if (!cancelled) {
          setError("Le formulaire sécurisé n’a pas pu charger. Utilisez le paiement Stripe externe ci-dessous.");
        }
      }
    })();

    return () => {
      cancelled = true;
      try {
        paymentElementRef.current?.destroy?.();
      } catch {
        // Stripe Element cleanup is best-effort.
      }
    };
  }, [publishableKey, clientSecret]);

  async function submitPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!stripeRef.current || !elementsRef.current) return;

    setSubmitting(true);
    setError(null);
    trackInvoicePayClick();
    try {
      const returnUrl = `${window.location.origin}/paiement-confirme?t=${encodeURIComponent(experienceToken)}`;
      const { error: stripeError } = await stripeRef.current.confirmPayment({
        elements: elementsRef.current,
        confirmParams: { return_url: returnUrl },
      });
      if (stripeError) {
        setError(stripeError.message || "Le paiement n’a pas pu être confirmé.");
      }
    } catch (err) {
      console.error("[stripe-elements] confirm failed", err);
      setError("Le paiement n’a pas pu être confirmé. Réessayez ou utilisez la page Stripe sécurisée.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-5 rounded-lg border border-border bg-background p-4 md:p-5">
      <div className="mb-4 flex items-start gap-3">
        <div className="rounded-md bg-brand/10 p-2">
          <CreditCard className="h-5 w-5 text-brand" />
        </div>
        <div>
          <p className="font-semibold">Paiement sécurisé sur OcarinaSpa.ca</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Le formulaire de carte est fourni directement par Stripe. Ocarina Spa ne reçoit ni ne stocke votre numéro de carte.
          </p>
        </div>
      </div>

      <form onSubmit={submitPayment}>
        {!ready && !error ? (
          <div className="mb-4 flex items-center gap-2 rounded-md border border-border bg-surface p-4 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Chargement du paiement sécurisé…
          </div>
        ) : null}
        <div ref={mountRef} className={error && !ready ? "hidden" : "min-h-[90px]"} />

        {error ? (
          <div className="mt-3 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="submit" size="lg" disabled={!ready || submitting}>
            {submitting ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Paiement en cours…</>
            ) : (
              <><ShieldCheck className="h-4 w-4" /> Confirmer le paiement</>
            )}
          </Button>
          <Button type="button" variant="outline" size="lg" onClick={onBack} disabled={submitting}>
            Changer de méthode
          </Button>
        </div>
      </form>

      {fallbackUrl ? (
        <div className="mt-4 border-t border-border pt-4">
          <a
            href={fallbackUrl}
            onClick={trackInvoicePayClick}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline"
          >
            Ouvrir la page de paiement Stripe <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <p className="mt-1 text-xs text-muted-foreground">
            Solution de secours si votre navigateur bloque le formulaire intégré.
          </p>
        </div>
      ) : null}
    </div>
  );
}
