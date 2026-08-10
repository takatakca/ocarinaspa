import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { z } from "zod";
import {
  Star,
  CheckCircle2,
  ExternalLink,
  Loader2,
  MessageSquare,
  Facebook,
  Phone,
  AlertCircle,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { getPostPaymentStatus, submitPostPaymentRating } from "@/lib/post-payment.functions";
import { getPublicExperienceConfig, type PublicExperienceConfig } from "@/lib/public-experience.functions";
import { SITE } from "@/lib/seo";
import {
  trackPostPaymentRatingStarted,
  trackPostPaymentRatingSubmitted,
  trackInvoicePaid,
  trackGoogleReviewPromptShown,
  trackGoogleReviewClick,
  trackLowRatingFollowupCreated,
  trackFacebookFollowClick,
  trackPhoneCall,
} from "@/lib/gtag";
import { toast } from "sonner";

const searchSchema = z.object({ t: z.string().optional() });

export const Route = createFileRoute("/paiement-confirme")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Merci pour votre paiement — Ocarina Spa" },
      { name: "robots", content: "noindex,nofollow" },
      { name: "referrer", content: "no-referrer" },
    ],
  }),
  component: PaiementConfirmePage,
});

function PaiementConfirmePage() {
  const { t: token } = Route.useSearch();
  const submitRating = useServerFn(submitPostPaymentRating);
  const statusFn = useServerFn(getPostPaymentStatus);
  const configFn = useServerFn(getPublicExperienceConfig);
  const [rating, setRating] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState<{
    rating: number;
    surveyToken: string;
    needsFollowup: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [paymentState, setPaymentState] = useState<"checking" | "paid" | "not_paid" | "invalid">(token ? "checking" : "invalid");
  const [publicConfig, setPublicConfig] = useState<PublicExperienceConfig>({
    googleReviewUrl: null,
    facebookPageUrl: null,
  });

  useEffect(() => {
    if (token) {
      trackPostPaymentRatingStarted();
      setPaymentState("checking");
      statusFn({ data: { token } })
        .then((status) => {
          if (!status.ok) {
            setPaymentState("invalid");
            return;
          }
          if (status.paid) {
            setPaymentState("paid");
            trackInvoicePaid();
          } else {
            setPaymentState("not_paid");
          }
        })
        .catch(() => setPaymentState("invalid"));
    }
    configFn().then(setPublicConfig).catch(() => undefined);
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    if (!rating) {
      toast.error("Sélectionnez une note.");
      return;
    }
    setLoading(true);
    try {
      const r = await submitRating({ data: { token, rating } });
      if (!r.ok) {
        const message =
          r.reason === "not_paid"
            ? "Le paiement doit être confirmé avant d'évaluer le service."
            : r.reason === "rate_limited"
              ? "Trop de tentatives. Réessayez plus tard."
              : "Ce lien n'est plus valide. Retrouvez votre facture pour continuer.";
        toast.error(message);
        return;
      }
      setSubmitted({
        rating: r.rating,
        surveyToken: r.surveyToken,
        needsFollowup: r.needsFollowup,
      });
      trackPostPaymentRatingSubmitted(r.rating);
      trackGoogleReviewPromptShown();
      if (r.needsFollowup) trackLowRatingFollowupCreated();
    } catch {
      toast.error("Erreur — réessayez.");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <>
        <Header />
        <main className="min-h-[70vh] bg-surface py-12 px-4">
          <div className="max-w-lg mx-auto bg-background border border-border rounded-xl p-7 text-center shadow-sm">
            <h1 className="font-display text-2xl font-bold">Retrouvez d'abord votre facture</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Pour protéger vos renseignements, l'expérience après paiement est ouverte depuis une
              facture vérifiée plutôt qu'avec vos coordonnées dans l'adresse web.
            </p>
            <Button asChild className="mt-5">
              <Link to="/payer-facture">Retrouver ma facture</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (paymentState !== "paid") {
    const checking = paymentState === "checking";
    return (
      <>
        <Header />
        <main className="min-h-[70vh] bg-surface py-12 px-4">
          <div className="max-w-lg mx-auto bg-background border border-border rounded-xl p-7 text-center shadow-sm">
            {checking ? <Loader2 className="w-8 h-8 animate-spin mx-auto text-brand mb-3" /> : <AlertCircle className="w-10 h-10 mx-auto text-amber-600 mb-3" />}
            <h1 className="font-display text-2xl font-bold">
              {checking ? "Vérification du paiement" : paymentState === "not_paid" ? "Paiement non confirmé" : "Lien non valide"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {checking
                ? "Nous vérifions directement le statut de la facture auprès de Stripe."
                : paymentState === "not_paid"
                  ? "La facture n'est pas encore marquée payée. Revenez à votre facture ou réessayez dans quelques instants."
                  : "Ce lien n'est plus valide. Retrouvez votre facture pour continuer."}
            </p>
            {!checking && (
              <Button asChild className="mt-5">
                <Link to="/payer-facture">Retrouver ma facture</Link>
              </Button>
            )}
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-[70vh] bg-surface py-12 px-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center">
            <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-3" />
            <h1 className="font-display text-3xl md:text-4xl font-bold">Merci pour votre paiement</h1>
            <p className="text-muted-foreground mt-2">
              Votre retour nous aide à améliorer le service Ocarina Spa.
            </p>
          </div>

          {!submitted ? (
            <div className="bg-background rounded-xl border border-border shadow-sm p-6 md:p-8">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <p className="font-medium mb-3">Comment évaluez-vous votre expérience générale ?</p>
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
                    Cette note est interne à Ocarina Spa et n'est pas publiée sur Google.
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
              googleReviewUrl={publicConfig.googleReviewUrl}
              facebookUrl={publicConfig.facebookPageUrl}
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
  googleReviewUrl,
  facebookUrl,
}: {
  rating: number;
  surveyToken: string;
  needsFollowup: boolean;
  googleReviewUrl: string | null;
  facebookUrl: string | null;
}) {
  return (
    <div className="space-y-4">
      {rating <= 3 && (
        <div className="bg-background rounded-xl border border-red-300 dark:border-red-900 shadow-sm p-6">
          <h2 className="font-display text-xl font-semibold text-red-700 dark:text-red-400">
            Nous voulons mieux comprendre ce qui s'est passé
          </h2>
          <p className="text-sm mt-2">
            Votre demande a été signalée à notre équipe{needsFollowup ? " pour un suivi" : ""}.
            Vous pouvez aussi nous joindre directement.
          </p>
          <a
            href={`tel:${SITE.phoneTel}`}
            onClick={trackPhoneCall}
            className="inline-flex items-center gap-2 mt-3 text-brand underline font-semibold"
          >
            <Phone className="w-4 h-4" /> {SITE.phone}
          </a>
        </div>
      )}

      <div className="bg-background rounded-xl border border-border shadow-sm p-6">
        <h2 className="font-display text-xl font-semibold">Partager votre expérience sur Google</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Si vous le souhaitez, vous pouvez laisser un avis honnête qui reflète votre expérience.
          Cette étape est entièrement facultative et n'a aucun effet sur votre crédit client.
        </p>
        {googleReviewUrl ? (
          <a
            href={googleReviewUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackGoogleReviewClick()}
            className="inline-flex items-center gap-2 mt-4 bg-brand text-brand-foreground px-5 py-2.5 rounded-md font-semibold hover:bg-brand-dark"
          >
            Laisser un avis Google <ExternalLink className="w-4 h-4" />
          </a>
        ) : (
          <p className="mt-3 text-xs text-muted-foreground">
            Le lien d'avis Google sera affiché ici dès qu'il sera configuré par l'administrateur.
          </p>
        )}
      </div>

      <div className="bg-background rounded-xl border border-border shadow-sm p-6">
        <div className="flex items-start gap-3">
          <MessageSquare className="w-6 h-6 text-brand shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold">Aidez-nous à améliorer notre service</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Complétez notre court sondage interne et recevez un crédit magasin égal à 10&nbsp;%
              du montant réellement payé, applicable sur un prochain service Ocarina Spa.
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

      {facebookUrl && (
        <div className="bg-background rounded-xl border border-border shadow-sm p-6">
          <div className="flex items-start gap-3">
            <Facebook className="w-6 h-6 text-brand shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold">Suivez Ocarina Spa</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Conseils d'entretien, rappels saisonniers et nouvelles de l'entreprise.
              </p>
              <a
                href={facebookUrl}
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
      )}
    </div>
  );
}
