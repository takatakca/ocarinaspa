import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Star, CheckCircle2, ExternalLink, Loader2, MessageSquare, Facebook } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { submitPostPaymentRating } from "@/lib/post-payment.functions";
import { SITE } from "@/lib/seo";
import {
  trackPostPaymentRatingStarted,
  trackPostPaymentRatingSubmitted,
  trackGoogleReviewPromptShown,
  trackGoogleReviewClick,
  trackLowRatingFollowupCreated,
  trackFacebookFollowClick,
} from "@/lib/gtag";
import { toast } from "sonner";

const searchSchema = z.object({
  n: z.string().optional(),
  c: z.string().optional(),
});

export const Route = createFileRoute("/paiement-confirme")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Merci pour votre paiement — Ocarina Spa" },
      { name: "robots", content: "noindex,follow" },
    ],
  }),
  component: PaiementConfirmePage,
});

const GOOGLE_REVIEW_URL =
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_GOOGLE_REVIEW_URL) ||
  "https://g.page/r/ocarinaspa/review";
const FACEBOOK_URL =
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_FACEBOOK_PAGE_URL) ||
  "https://www.facebook.com/ocarinaspa";

function PaiementConfirmePage() {
  const search = Route.useSearch();
  const submitRating = useServerFn(submitPostPaymentRating);

  const [invoiceNumber, setInvoiceNumber] = useState(search.n ?? "");
  const [emailOrPhone, setEmailOrPhone] = useState(search.c ?? "");
  const [rating, setRating] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState<{
    rating: number;
    surveyToken: string;
    needsFollowup: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    trackPostPaymentRatingStarted();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!rating) {
      toast.error("Sélectionnez une note.");
      return;
    }
    setLoading(true);
    try {
      const r = await submitRating({
        data: { invoiceNumber, emailOrPhone, rating },
      });
      if (!r.ok) {
        toast.error(
          r.reason === "mismatch"
            ? "Email ou téléphone ne correspond pas."
            : "Facture introuvable.",
        );
        return;
      }
      setSubmitted({
        rating: r.rating,
        surveyToken: r.surveyToken,
        needsFollowup: r.needsFollowup,
      });
      trackPostPaymentRatingSubmitted(r.rating);
      if (r.needsFollowup) trackLowRatingFollowupCreated();
      if (r.rating >= 4) trackGoogleReviewPromptShown();
    } catch {
      toast.error("Erreur — réessayez.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Header />
      <main className="min-h-[70vh] bg-surface py-12 px-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center">
            <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-3" />
            <h1 className="font-display text-3xl md:text-4xl font-bold">
              Merci pour votre paiement
            </h1>
            <p className="text-muted-foreground mt-2">
              Aidez-nous à améliorer votre expérience Ocarina Spa.
            </p>
          </div>

          {!submitted ? (
            <div className="bg-background rounded-xl border border-border shadow-sm p-6 md:p-8">
              <form onSubmit={handleSubmit} className="space-y-5">
                {(!search.n || !search.c) && (
                  <>
                    <div>
                      <Label htmlFor="n">Numéro de facture</Label>
                      <Input
                        id="n"
                        required
                        value={invoiceNumber}
                        onChange={(e) => setInvoiceNumber(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="c">Email ou téléphone</Label>
                      <Input
                        id="c"
                        required
                        value={emailOrPhone}
                        onChange={(e) => setEmailOrPhone(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </>
                )}

                <div>
                  <p className="font-medium mb-3">
                    Comment évaluez-vous votre expérience générale avec Ocarina Spa ?
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setRating(n)}
                        aria-label={`${n} étoile${n > 1 ? "s" : ""}`}
                        className={`flex-1 min-w-[60px] flex flex-col items-center gap-1 border-2 rounded-lg p-3 transition ${
                          rating === n
                            ? "border-brand bg-brand/10"
                            : "border-border hover:border-brand/50"
                        }`}
                      >
                        <Star
                          className={`w-6 h-6 ${
                            rating !== null && n <= rating
                              ? "fill-amber-400 text-amber-400"
                              : "text-muted-foreground"
                          }`}
                        />
                        <span className="text-xs font-medium">{n}</span>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Note interne Ocarina Spa. Ce n'est pas un avis Google.
                  </p>
                </div>

                <Button type="submit" disabled={loading} size="lg" className="w-full">
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Envoi…
                    </>
                  ) : (
                    "Envoyer ma note"
                  )}
                </Button>
              </form>
            </div>
          ) : (
            <PostRatingActions
              rating={submitted.rating}
              surveyToken={submitted.surveyToken}
              needsFollowup={submitted.needsFollowup}
            />
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

function PostRatingActions({
  rating,
  surveyToken,
  needsFollowup,
}: {
  rating: number;
  surveyToken: string;
  needsFollowup: boolean;
}) {
  return (
    <div className="space-y-4">
      {rating >= 4 ? (
        <div className="bg-background rounded-xl border border-border shadow-sm p-6">
          <h2 className="font-display text-xl font-semibold">Merci pour votre confiance</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Si vous souhaitez partager votre expérience publiquement, vous pouvez laisser un avis
            honnête sur Google. Votre avis doit refléter votre vraie expérience — vous êtes libre
            de laisser l'avis que vous souhaitez.
          </p>
          <a
            href={GOOGLE_REVIEW_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackGoogleReviewClick()}
            className="inline-flex items-center gap-2 mt-4 bg-brand text-brand-foreground px-5 py-2.5 rounded-md font-semibold hover:bg-brand-dark"
          >
            Laisser un avis Google <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      ) : (
        <div className="bg-background rounded-xl border border-red-300 dark:border-red-900 shadow-sm p-6">
          <h2 className="font-display text-xl font-semibold text-red-700 dark:text-red-400">
            Nous voulons corriger la situation
          </h2>
          <p className="text-sm mt-2">
            Nous sommes désolés que votre expérience n'ait pas été parfaite. Notre équipe va
            vous recontacter{needsFollowup ? " rapidement" : ""}.
          </p>
          <p className="text-sm mt-2">
            <a href={`tel:${SITE.phoneTel}`} className="text-brand underline font-semibold">
              Appelez-nous au {SITE.phone}
            </a>{" "}
            ou complétez le sondage ci-dessous pour nous expliquer ce qui s'est passé.
          </p>
        </div>
      )}

      <div className="bg-background rounded-xl border border-border shadow-sm p-6">
        <div className="flex items-start gap-3">
          <MessageSquare className="w-6 h-6 text-brand shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold">Aidez-nous à améliorer notre service</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Complétez un court sondage interne et recevez un crédit de 10&nbsp;% applicable
              sur votre prochaine facture Ocarina Spa.
            </p>
            <a
              href={`/sondage?token=${encodeURIComponent(surveyToken)}`}
              className="inline-block mt-3 bg-brand text-brand-foreground px-5 py-2.5 rounded-md font-semibold hover:bg-brand-dark"
            >
              Remplir le sondage
            </a>
          </div>
        </div>
      </div>

      <div className="bg-background rounded-xl border border-border shadow-sm p-6">
        <div className="flex items-start gap-3">
          <Facebook className="w-6 h-6 text-brand shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold">Suivez Ocarina Spa</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Conseils d'entretien, promotions saisonnières et rappels ouverture/fermeture.
            </p>
            <a
              href={FACEBOOK_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackFacebookFollowClick()}
              className="inline-block mt-3 border border-border px-5 py-2.5 rounded-md font-semibold hover:bg-surface"
            >
              Suivre notre page Facebook
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
