import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, type FormEvent } from "react";
import { Phone, Sparkles, AlertTriangle, CheckCircle2, Loader2, Calendar, ShieldCheck } from "lucide-react";
import { Layout } from "@/components/Layout";
import { SITE, altLinks, breadcrumbSchema } from "@/lib/seo";
import {
  diagnoseSpaIssue,
  saveDiagnosticLead,
  updateDiagnosticLeadAI,
  type DiagnosticResult,
} from "@/lib/diagnostic.functions";
import {
  trackPhoneCall,
  trackDiagnosticComplete,
  trackDiagnosticLeadSubmit,
  trackQuickSubmission,
} from "@/lib/gtag";

export const Route = createFileRoute("/diagnostic")({
  head: () => ({
    meta: [
      { title: "Diagnostiqueur de spa AI — Ocarina Spa Québec" },
      {
        name: "description",
        content:
          "Diagnostiquez votre problème de spa grâce à notre outil AI. Un technicien Ocarina Spa vous rappelle pour planifier une visite.",
      },
      { property: "og:title", content: "Diagnostiqueur de spa AI — Ocarina Spa" },
      {
        property: "og:description",
        content:
          "Remplissez le formulaire, recevez un diagnostic AI et un rappel d'un technicien Ocarina Spa.",
      },
      { property: "og:url", content: SITE.domain + "/diagnostic" },
    ],
    links: altLinks({ path: "/diagnostic", enPath: null }),
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(
          breadcrumbSchema([
            { name: "Accueil", url: SITE.domain + "/" },
            { name: "Diagnostic AI", url: SITE.domain + "/diagnostic" },
          ]),
        ),
      },
    ],
  }),
  component: DiagnosticPage,
});

function DiagnosticPage() {
  const diagnose = useServerFn(diagnoseSpaIssue);
  const saveLead = useServerFn(saveDiagnosticLead);
  const updateLead = useServerFn(updateDiagnosticLeadAI);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DiagnosticResult | null>(null);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!consent) {
      setError("Vous devez accepter d'être contacté par Ocarina Spa pour continuer.");
      return;
    }

    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const get = (k: string) => String(fd.get(k) || "").trim();

    try {
      // 1) Save lead first — guarantees we capture the contact even if AI fails.
      const lead = await saveLead({
        data: {
          full_name: get("full_name"),
          phone: get("phone"),
          email: get("email"),
          city: get("city"),
          brand: get("brand"),
          model: get("model") || null,
          spa_year: get("year") || null,
          error_code: get("errorCode") || null,
          problem_description: get("symptoms"),
          heating: get("heating") || null,
          pump_works: get("pumpWorks") || null,
          pump_noise: get("pumpNoise") || null,
          since: get("since") || null,
          consent: true,
          source_url: typeof window !== "undefined" ? window.location.href : null,
        },
      });
      setLeadId(lead.id ?? null);
      trackDiagnosticLeadSubmit();

      // 2) Run AI diagnostic
      const res = await diagnose({
        data: {
          errorCode: get("errorCode") || undefined,
          brand: get("brand") || undefined,
          model: get("model") || undefined,
          year: get("year") || undefined,
          symptoms: get("symptoms"),
          heating: (get("heating") as "oui" | "non" | "intermittent" | "inconnu") || undefined,
          pumpWorks: (get("pumpWorks") as "oui" | "non" | "inconnu") || undefined,
          pumpNoise: (get("pumpNoise") as "oui" | "non" | "inconnu") || undefined,
          since: get("since") || undefined,
          city: get("city") || undefined,
        },
      });
      setResult(res);
      trackDiagnosticComplete();

      // 3) Best-effort: enrich the lead with AI output for follow-up
      if (lead.id) {
        try {
          await updateLead({
            data: {
              id: lead.id,
              ai_diagnostic: res.diagnostic,
              ai_causes: res.likelyCauses,
              ai_actions: res.actions,
              ai_urgency: res.urgency,
              ai_recommend_call: res.recommendCall,
            },
          });
        } catch (e) {
          console.warn("updateDiagnosticLeadAI failed", e);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout>
      <section className="bg-surface">
        <div className="container mx-auto px-4 py-14 md:py-20 max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-brand/10 border border-brand/30 px-3 py-1.5 rounded-full text-sm text-brand font-semibold">
            <Sparkles className="w-4 h-4" /> Outil AI + rappel d'un technicien
          </div>
          <h1 className="mt-4 font-display text-4xl md:text-5xl font-bold text-foreground">
            Diagnostiqueur de spa Ocarina Spa
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Remplis le formulaire ci-dessous. Tu reçois immédiatement un diagnostic AI et un
            technicien Ocarina Spa te rappelle pour planifier une visite. Pour une urgence,
            appelle directement le{" "}
            <a href={`tel:${SITE.phoneTel}`} onClick={trackPhoneCall} className="text-brand font-semibold">
              {SITE.phone}
            </a>
            .
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-10 max-w-3xl">
        <form
          onSubmit={handleSubmit}
          className="bg-card border border-border rounded-xl p-6 grid gap-5"
        >
          {/* === Coordonnées (obligatoire avant l'IA) === */}
          <div>
            <h2 className="font-display text-xl font-semibold text-foreground">Vos coordonnées</h2>
            <p className="text-sm text-muted-foreground">
              Requis pour qu'un technicien Ocarina Spa puisse vous rappeler.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Nom complet *
              </label>
              <input
                name="full_name"
                required
                minLength={2}
                maxLength={100}
                placeholder="Ex. Jean Tremblay"
                className="w-full px-3 py-2.5 border border-border rounded-md bg-background"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Téléphone *
              </label>
              <input
                name="phone"
                type="tel"
                required
                minLength={7}
                maxLength={30}
                placeholder="Ex. 819-555-1234"
                className="w-full px-3 py-2.5 border border-border rounded-md bg-background"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Courriel *
              </label>
              <input
                name="email"
                type="email"
                required
                maxLength={255}
                placeholder="vous@exemple.com"
                className="w-full px-3 py-2.5 border border-border rounded-md bg-background"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Ville *
              </label>
              <input
                name="city"
                required
                minLength={2}
                maxLength={80}
                placeholder="Ex. Laval, Montréal…"
                className="w-full px-3 py-2.5 border border-border rounded-md bg-background"
              />
            </div>
          </div>

          {/* === Spa === */}
          <div className="pt-2 border-t border-border">
            <h2 className="font-display text-xl font-semibold text-foreground mt-3">Votre spa</h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Marque du spa *
              </label>
              <input
                name="brand"
                required
                minLength={1}
                maxLength={80}
                placeholder="Ex. Jacuzzi, Hydropool, Arctic Spas…"
                className="w-full px-3 py-2.5 border border-border rounded-md bg-background"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Modèle (optionnel)
              </label>
              <input
                name="model"
                maxLength={80}
                placeholder="Ex. J-345, Serenity 6800…"
                className="w-full px-3 py-2.5 border border-border rounded-md bg-background"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Année approximative (optionnel)
              </label>
              <input
                name="year"
                maxLength={10}
                placeholder="Ex. 2018"
                className="w-full px-3 py-2.5 border border-border rounded-md bg-background"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Code d'erreur affiché (optionnel)
              </label>
              <input
                name="errorCode"
                maxLength={20}
                placeholder="Ex. FLO, OH, DR…"
                className="w-full px-3 py-2.5 border border-border rounded-md bg-background"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Description du problème *
            </label>
            <textarea
              name="symptoms"
              required
              minLength={3}
              maxLength={2000}
              rows={4}
              placeholder="Ex. Le spa ne chauffe plus depuis hier, l'eau est à 28°C, le panneau affiche FLO."
              className="w-full px-3 py-2.5 border border-border rounded-md bg-background"
            />
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Le spa chauffe ?
              </label>
              <select
                name="heating"
                defaultValue="inconnu"
                className="w-full px-3 py-2.5 border border-border rounded-md bg-background"
              >
                <option value="inconnu">Je ne sais pas</option>
                <option value="oui">Oui, normalement</option>
                <option value="intermittent">Intermittent</option>
                <option value="non">Non, plus du tout</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                La pompe fonctionne ?
              </label>
              <select
                name="pumpWorks"
                defaultValue="inconnu"
                className="w-full px-3 py-2.5 border border-border rounded-md bg-background"
              >
                <option value="inconnu">Je ne sais pas</option>
                <option value="oui">Oui</option>
                <option value="non">Non</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Bruit anormal pompe ?
              </label>
              <select
                name="pumpNoise"
                defaultValue="inconnu"
                className="w-full px-3 py-2.5 border border-border rounded-md bg-background"
              >
                <option value="inconnu">Je ne sais pas</option>
                <option value="non">Non, silencieuse</option>
                <option value="oui">Oui, bruit anormal</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Depuis quand ?
            </label>
            <input
              name="since"
              placeholder="Ex. Depuis 2 jours, depuis ce matin…"
              maxLength={80}
              className="w-full px-3 py-2.5 border border-border rounded-md bg-background"
            />
          </div>

          {/* === Consentement === */}
          <label className="flex items-start gap-3 bg-surface border border-border rounded-md p-4 cursor-pointer">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-1 w-4 h-4 accent-brand"
              required
            />
            <span className="text-sm text-foreground">
              <ShieldCheck className="inline w-4 h-4 text-brand mr-1" />
              J'accepte qu'Ocarina Spa me contacte concernant ma demande de diagnostic. *
            </span>
          </label>

          <button
            type="submit"
            disabled={loading || !consent}
            className="inline-flex items-center justify-center gap-2 bg-brand text-brand-foreground px-6 py-3.5 rounded-md font-semibold text-lg hover:bg-brand-dark transition-colors disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Analyse en cours…
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" /> Obtenir mon diagnostic
              </>
            )}
          </button>

          {error && (
            <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3">
              {error}
            </p>
          )}

          {leadId && !result && !loading && (
            <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md p-3">
              Demande enregistrée — un technicien Ocarina Spa vous contactera rapidement.
            </p>
          )}
        </form>

        {result && (
          <div className="mt-8 bg-card border border-border rounded-xl p-6">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-brand shrink-0 mt-1" />
              <div className="flex-1">
                <h2 className="font-display text-2xl font-bold text-foreground">
                  Diagnostic AI
                </h2>
                <p className="mt-2 text-foreground">{result.diagnostic}</p>

                {result.likelyCauses.length > 0 && (
                  <>
                    <h3 className="mt-5 font-semibold text-foreground">Causes probables</h3>
                    <ul className="mt-2 list-disc list-inside text-muted-foreground space-y-1">
                      {result.likelyCauses.map((c) => (
                        <li key={c}>{c}</li>
                      ))}
                    </ul>
                  </>
                )}

                {result.actions.length > 0 && (
                  <>
                    <h3 className="mt-5 font-semibold text-foreground">
                      Actions recommandées / conseils temporaires
                    </h3>
                    <ul className="mt-2 list-disc list-inside text-muted-foreground space-y-1">
                      {result.actions.map((c) => (
                        <li key={c}>{c}</li>
                      ))}
                    </ul>
                  </>
                )}

                <div
                  className={`mt-5 rounded-md p-4 border ${
                    result.urgency === "haute"
                      ? "bg-red-50 border-red-200 text-red-900"
                      : result.urgency === "moyenne"
                        ? "bg-amber-50 border-amber-200 text-amber-900"
                        : "bg-emerald-50 border-emerald-200 text-emerald-900"
                  }`}
                >
                  <p className="flex items-center gap-2 font-semibold">
                    <AlertTriangle className="w-4 h-4" />
                    Niveau d'urgence : {result.urgency}
                  </p>
                  {result.recommendCall && (
                    <p className="mt-2 text-sm">
                      Une intervention technique est recommandée. Appelez Ocarina Spa pour
                      planifier une visite.
                    </p>
                  )}
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <a
                    href={`tel:${SITE.phoneTel}`}
                    onClick={trackPhoneCall}
                    className="inline-flex items-center gap-2 bg-brand text-brand-foreground px-5 py-3 rounded-md font-semibold hover:bg-brand-dark transition-colors"
                  >
                    <Phone className="w-4 h-4" /> Appeler maintenant — {SITE.phone}
                  </a>
                  <Link
                    to="/contact"
                    onClick={trackQuickSubmission}
                    className="inline-flex items-center gap-2 border-2 border-brand text-brand px-5 py-3 rounded-md font-semibold hover:bg-brand hover:text-brand-foreground transition-colors"
                  >
                    <Calendar className="w-4 h-4" /> Planifier une visite
                  </Link>
                </div>
                <p className="mt-4 text-xs text-muted-foreground">
                  Ce diagnostic est informatif. Seule une inspection physique permet de
                  confirmer la panne. Votre demande est déjà enregistrée chez Ocarina Spa.
                </p>
              </div>
            </div>
          </div>
        )}
      </section>
    </Layout>
  );
}
