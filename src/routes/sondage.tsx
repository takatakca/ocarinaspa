import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { z } from "zod";
import { CheckCircle2, Copy, ExternalLink, Facebook, Loader2 } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { getSurveyByToken, submitSurvey } from "@/lib/post-payment.functions";
import {
  trackSurveyStarted,
  trackSurveySubmitted,
  trackCreditIssued,
  trackFacebookFollowClick,
} from "@/lib/gtag";
import { toast } from "sonner";

const FACEBOOK_URL =
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_FACEBOOK_PAGE_URL) ||
  "https://www.facebook.com/ocarinaspa";

const searchSchema = z.object({ token: z.string().optional() });

export const Route = createFileRoute("/sondage")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Sondage client — Ocarina Spa" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: SondagePage,
});

function SondagePage() {
  const { token } = Route.useSearch();
  const getFn = useServerFn(getSurveyByToken);
  const submitFn = useServerFn(submitSurvey);

  const [loading, setLoading] = useState(true);
  const [surveyExists, setSurveyExists] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [submitted, setSubmitted] = useState<{
    code: string;
    valueCents: number | null;
    currency: string;
    expiresAt: string;
  } | null>(null);

  const [form, setForm] = useState({
    technicianProfessional: "",
    problemResolved: "" as "" | "oui" | "partiellement" | "non",
    delayAcceptable: "" as "" | "oui" | "non",
    priceClear: "" as "" | "oui" | "non",
    wouldRecommend: "" as "" | "oui" | "non",
    improvementComment: "",
    serviceQuestion: "",
    wantsCallback: false,
    callbackTime: "",
  });

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    trackSurveyStarted();
    getFn({ data: { token } })
      .then((r) => {
        if (r.found) {
          setSurveyExists(true);
          if ((r.survey as any).submitted_at) setAlreadySubmitted(true);
        }
      })
      .finally(() => setLoading(false));
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setLoading(true);
    try {
      const r = await submitFn({
        data: {
          token,
          technicianProfessional: form.technicianProfessional || undefined,
          problemResolved: form.problemResolved || undefined,
          delayAcceptable: form.delayAcceptable || undefined,
          priceClear: form.priceClear || undefined,
          wouldRecommend: form.wouldRecommend || undefined,
          improvementComment: form.improvementComment || undefined,
          serviceQuestion: form.serviceQuestion || undefined,
          wantsCallback: form.wantsCallback,
          callbackTime: form.callbackTime || undefined,
        },
      });
      if (!r.ok) {
        toast.error(r.reason === "already_submitted" ? "Déjà soumis." : "Erreur.");
        return;
      }
      trackSurveySubmitted();
      const c = r.credit;
      trackCreditIssued(c?.credit_value_cents ?? undefined);
      setSubmitted({
        code: c?.credit_code ?? "",
        valueCents: c?.credit_value_cents ?? null,
        currency: c?.currency ?? "cad",
        expiresAt: c?.expires_at ?? "",
      });
    } catch {
      toast.error("Erreur. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Header />
      <main className="min-h-[70vh] bg-surface py-12 px-4">
        <div className="max-w-2xl mx-auto">
          {loading && !submitted ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-brand" />
            </div>
          ) : !token || !surveyExists ? (
            <div className="bg-background rounded-xl border border-border p-6 text-center">
              <h1 className="font-display text-2xl font-bold">Lien invalide</h1>
              <p className="text-muted-foreground mt-2">
                Ce lien de sondage n'est pas valide ou a expiré.
              </p>
            </div>
          ) : alreadySubmitted && !submitted ? (
            <div className="bg-background rounded-xl border border-border p-6 text-center">
              <CheckCircle2 className="w-12 h-12 mx-auto text-green-600 mb-2" />
              <h1 className="font-display text-2xl font-bold">Sondage déjà soumis</h1>
              <p className="text-muted-foreground mt-2">Merci pour votre retour !</p>
            </div>
          ) : submitted ? (
            <SurveyThankYou {...submitted} />
          ) : (
            <div className="bg-background rounded-xl border border-border shadow-sm p-6 md:p-8">
              <h1 className="font-display text-2xl md:text-3xl font-bold">
                Votre expérience Ocarina Spa
              </h1>
              <p className="text-muted-foreground mt-2 text-sm">
                Quelques questions rapides. À la fin, vous recevrez un crédit de 10&nbsp;%
                applicable sur votre prochaine facture.
              </p>

              <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                <Radio
                  label="Le technicien était-il professionnel ?"
                  value={form.technicianProfessional}
                  onChange={(v) => setForm({ ...form, technicianProfessional: v })}
                  options={[
                    { v: "oui", l: "Oui" },
                    { v: "non", l: "Non" },
                  ]}
                />
                <Radio
                  label="Le problème a-t-il été réglé ?"
                  value={form.problemResolved}
                  onChange={(v) =>
                    setForm({ ...form, problemResolved: v as "oui" | "partiellement" | "non" })
                  }
                  options={[
                    { v: "oui", l: "Oui" },
                    { v: "partiellement", l: "Partiellement" },
                    { v: "non", l: "Non" },
                  ]}
                />
                <Radio
                  label="Le délai était-il acceptable ?"
                  value={form.delayAcceptable}
                  onChange={(v) => setForm({ ...form, delayAcceptable: v as "oui" | "non" })}
                  options={[
                    { v: "oui", l: "Oui" },
                    { v: "non", l: "Non" },
                  ]}
                />
                <Radio
                  label="Le prix était-il clair avant l'intervention ?"
                  value={form.priceClear}
                  onChange={(v) => setForm({ ...form, priceClear: v as "oui" | "non" })}
                  options={[
                    { v: "oui", l: "Oui" },
                    { v: "non", l: "Non" },
                  ]}
                />
                <Radio
                  label="Recommanderiez-vous Ocarina Spa ?"
                  value={form.wouldRecommend}
                  onChange={(v) => setForm({ ...form, wouldRecommend: v as "oui" | "non" })}
                  options={[
                    { v: "oui", l: "Oui" },
                    { v: "non", l: "Non" },
                  ]}
                />

                <div>
                  <Label htmlFor="improvement">
                    Comment pouvons-nous améliorer votre expérience ?
                  </Label>
                  <Textarea
                    id="improvement"
                    className="mt-1"
                    rows={3}
                    maxLength={2000}
                    value={form.improvementComment}
                    onChange={(e) => setForm({ ...form, improvementComment: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="question">Avez-vous une question sur votre service ?</Label>
                  <Textarea
                    id="question"
                    className="mt-1"
                    rows={3}
                    maxLength={2000}
                    value={form.serviceQuestion}
                    onChange={(e) => setForm({ ...form, serviceQuestion: e.target.value })}
                    placeholder="Optionnel — nous vous répondrons."
                  />
                </div>

                <div className="border-t border-border pt-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.wantsCallback}
                      onChange={(e) => setForm({ ...form, wantsCallback: e.target.checked })}
                    />
                    Je veux être recontacté
                  </label>
                  {form.wantsCallback && (
                    <div className="mt-3">
                      <Label htmlFor="callback">Meilleur moment pour appeler</Label>
                      <Input
                        id="callback"
                        className="mt-1"
                        placeholder="ex: soir en semaine, samedi matin…"
                        value={form.callbackTime}
                        onChange={(e) => setForm({ ...form, callbackTime: e.target.value })}
                      />
                    </div>
                  )}
                </div>

                <Button type="submit" size="lg" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Envoi…
                    </>
                  ) : (
                    "Soumettre le sondage"
                  )}
                </Button>
              </form>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

function Radio({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { v: string; l: string }[];
}) {
  return (
    <div>
      <p className="text-sm font-medium mb-2">{label}</p>
      <div className="flex gap-2 flex-wrap">
        {options.map((o) => (
          <button
            key={o.v}
            type="button"
            onClick={() => onChange(o.v)}
            className={`px-4 py-2 rounded-md border text-sm ${
              value === o.v
                ? "border-brand bg-brand/10 text-brand font-medium"
                : "border-border hover:border-brand/50"
            }`}
          >
            {o.l}
          </button>
        ))}
      </div>
    </div>
  );
}

function SurveyThankYou({
  code,
  valueCents,
  currency,
  expiresAt,
}: {
  code: string;
  valueCents: number | null;
  currency: string;
  expiresAt: string;
}) {
  const value =
    valueCents != null
      ? new Intl.NumberFormat("fr-CA", { style: "currency", currency: currency.toUpperCase() }).format(
          valueCents / 100,
        )
      : null;
  const exp = expiresAt ? new Date(expiresAt).toLocaleDateString("fr-CA") : null;
  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Code copié");
    } catch {
      /* noop */
    }
  }
  return (
    <div className="space-y-4">
      <div className="bg-background rounded-xl border border-brand/40 shadow-sm p-6 text-center">
        <CheckCircle2 className="w-14 h-14 text-green-600 mx-auto mb-2" />
        <h1 className="font-display text-2xl font-bold">Merci pour votre retour</h1>
        <p className="text-muted-foreground mt-2">
          Votre opinion nous aide à améliorer notre service.
        </p>

        {code && (
          <div className="mt-6 border border-border rounded-lg p-5 bg-surface">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Votre crédit
            </p>
            <p className="font-display text-3xl font-bold text-brand mt-1">
              {value ?? "10 % de crédit"}
            </p>
            <div className="mt-3 flex items-center justify-center gap-2">
              <code className="px-3 py-1.5 border border-dashed border-brand/50 rounded-md font-mono text-sm">
                {code}
              </code>
              <button
                onClick={copy}
                className="p-1.5 text-muted-foreground hover:text-foreground"
                aria-label="Copier le code"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            {exp && (
              <p className="text-xs text-muted-foreground mt-3">
                Valide jusqu'au {exp} — utilisable une seule fois sur une prochaine facture
                Ocarina Spa. Non monnayable, non transférable, non cumulable.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="bg-background rounded-xl border border-border p-6">
        <div className="flex items-start gap-3">
          <Facebook className="w-6 h-6 text-brand mt-0.5" />
          <div>
            <h3 className="font-semibold">Suivez Ocarina Spa</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Conseils d'entretien, promotions et rappels saisonniers.
            </p>
            <a
              href={FACEBOOK_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackFacebookFollowClick()}
              className="inline-flex items-center gap-2 mt-3 border border-border px-5 py-2 rounded-md font-semibold hover:bg-surface"
            >
              Facebook <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
