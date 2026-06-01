import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, type FormEvent } from "react";
import { Phone, Sparkles, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { Layout } from "@/components/Layout";
import { SITE, altLinks, breadcrumbSchema } from "@/lib/seo";
import { diagnoseSpaIssue, type DiagnosticResult } from "@/lib/diagnostic.functions";

export const Route = createFileRoute("/diagnostic")({
  head: () => ({
    meta: [
      { title: "Diagnostiqueur de spa AI — Ocarina Spa Québec" },
      {
        name: "description",
        content:
          "Diagnostiquez votre problème de spa en moins d'une minute grâce à notre outil AI. Codes d'erreur, pompe, chauffe-eau, fuite — réponse instantanée.",
      },
      { property: "og:title", content: "Diagnostiqueur de spa AI gratuit — Ocarina Spa" },
      {
        property: "og:description",
        content:
          "Décris ton problème, on te donne une piste en quelques secondes — toutes marques.",
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DiagnosticResult | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await diagnose({
        data: {
          errorCode: String(fd.get("errorCode") || "").trim() || undefined,
          brand: String(fd.get("brand") || "").trim() || undefined,
          symptoms: String(fd.get("symptoms") || "").trim(),
          heating: (fd.get("heating") as string) as DiagnosticResultInput["heating"],
          pumpNoise: (fd.get("pumpNoise") as string) as DiagnosticResultInput["pumpNoise"],
        },
      });
      setResult(res);
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
            <Sparkles className="w-4 h-4" /> Outil AI gratuit
          </div>
          <h1 className="mt-4 font-display text-4xl md:text-5xl font-bold text-foreground">
            Diagnostiqueur de spa — réponse en quelques secondes
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Réponds aux quelques questions ci-dessous. Notre AI te donne une piste de
            réparation pour ton spa (toutes marques). Pour une intervention, appelle-nous au{" "}
            <a href={`tel:${SITE.phoneTel}`} className="text-brand font-semibold">
              {SITE.phone}
            </a>
            .
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-10 max-w-3xl">
        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 grid gap-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Code d'erreur affiché (optionnel)
              </label>
              <input
                name="errorCode"
                placeholder="Ex. FLO, OH, DR…"
                maxLength={20}
                className="w-full px-3 py-2.5 border border-border rounded-md bg-background"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Marque / modèle (optionnel)
              </label>
              <input
                name="brand"
                placeholder="Ex. Jacuzzi, Hydropool, Arctic Spas…"
                maxLength={80}
                className="w-full px-3 py-2.5 border border-border rounded-md bg-background"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Décris le problème *
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

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Le spa chauffe-t-il ?
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
                La pompe fait du bruit ?
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

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 bg-brand text-brand-foreground px-6 py-3 rounded-md font-semibold hover:bg-brand-dark transition-colors disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Analyse en cours…
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" /> Diagnostiquer mon spa
              </>
            )}
          </button>
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
              {error}
            </p>
          )}
        </form>

        {result && (
          <div className="mt-8 bg-card border border-border rounded-xl p-6">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-brand shrink-0 mt-1" />
              <div className="flex-1">
                <h2 className="font-display text-2xl font-bold text-foreground">Diagnostic AI</h2>
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
                    <h3 className="mt-5 font-semibold text-foreground">À essayer / vérifier</h3>
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
                      Une intervention technique est recommandée. Appelez-nous pour un
                      rendez-vous.
                    </p>
                  )}
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <a
                    href={`tel:${SITE.phoneTel}`}
                    className="inline-flex items-center gap-2 bg-brand text-brand-foreground px-5 py-2.5 rounded-md font-semibold"
                  >
                    <Phone className="w-4 h-4" /> Appeler {SITE.phone}
                  </a>
                  <Link
                    to="/contact"
                    className="inline-flex items-center gap-2 border-2 border-brand text-brand px-5 py-2.5 rounded-md font-semibold"
                  >
                    Demander une soumission
                  </Link>
                </div>
                <p className="mt-4 text-xs text-muted-foreground">
                  Ce diagnostic est informatif. Seule une inspection physique permet de
                  confirmer la panne.
                </p>
              </div>
            </div>
          </div>
        )}
      </section>
    </Layout>
  );
}

type DiagnosticResultInput = {
  heating?: "oui" | "non" | "intermittent" | "inconnu";
  pumpNoise?: "oui" | "non" | "inconnu";
};
