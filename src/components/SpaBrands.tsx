import { useMemo, useState } from "react";
import { Search, Wrench, Snowflake, CheckCircle2 } from "lucide-react";
import {
  SPA_BRAND_CATEGORIES,
  TOP_BRANDS_QC,
  WINTER_BRANDS,
  REPAIRED_SYSTEMS,
} from "@/data/spaBrands";

export function SpaBrands({ compact = false }: { compact?: boolean }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SPA_BRAND_CATEGORIES;
    return SPA_BRAND_CATEGORIES.map((cat) => ({
      ...cat,
      brands: cat.brands.filter((b) => b.toLowerCase().includes(q)),
    })).filter((c) => c.brands.length > 0);
  }, [query]);

  return (
    <section className="bg-background">
      <div className="container mx-auto px-4 py-16 md:py-20">
        <div className="max-w-3xl">
          <p className="text-brand font-semibold uppercase text-sm tracking-wide">
            Réparation toutes marques
          </p>
          <h2 className="mt-3 font-display text-3xl md:text-4xl font-bold text-foreground">
            Marques de spas que nous réparons au Québec
          </h2>
          <p className="mt-4 text-muted-foreground">
            Chez Ocarina Spa, nous réparons une grande variété de marques de spas, hot tubs et
            spas de nage au Québec. Même si chaque marque possède son propre design, plusieurs
            utilisent des composantes internes similaires comme Balboa, Gecko, Waterway ou LX.
            Cela nous permet d'intervenir sur les problèmes les plus fréquents : pompe,
            chauffe-eau, panneau de contrôle, jets, fuite d'eau, ozonateur, pack électronique
            et entretien général.
          </p>
        </div>

        {/* Top brands */}
        <div className="mt-10">
          <h3 className="font-display text-xl font-semibold text-foreground">
            Marques les plus fréquentes en réparation au Québec
          </h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
            Hydropool, Jacuzzi, Sundance, Arctic Spas, Beachcomber, Maax, Vita Spa, Bullfrog,
            Master Spas et Hot Spring sont les marques que nos techniciens voient le plus
            souvent.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {TOP_BRANDS_QC.map((b) => (
              <span
                key={b}
                className="inline-flex items-center gap-1.5 bg-brand/10 border border-brand/30 text-foreground px-3 py-1.5 rounded-full text-sm font-medium"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-brand" /> {b}
              </span>
            ))}
          </div>
        </div>

        {!compact && (
          <>
            {/* Search */}
            <div className="mt-12">
              <label className="block text-sm font-medium text-foreground mb-2">
                Rechercher votre marque de spa
              </label>
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ex. Jacuzzi, Hydropool, Coast Spas…"
                  className="w-full pl-10 pr-4 py-2.5 rounded-md border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>
            </div>

            {/* Categories */}
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              {filtered.map((cat) => (
                <div
                  key={cat.slug}
                  className="bg-card border border-border rounded-xl p-6"
                >
                  <h3 className="font-display text-lg font-semibold text-foreground">
                    {cat.title}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">{cat.description}</p>
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {cat.brands.map((b) => (
                      <li
                        key={b}
                        className="px-3 py-1 rounded-full bg-surface border border-border text-sm text-foreground"
                      >
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              {filtered.length === 0 && (
                <p className="text-muted-foreground">
                  Aucune marque trouvée. Appelez-nous : nous réparons aussi les marques rares.
                </p>
              )}
            </div>

            {/* Systems */}
            <div className="mt-12 bg-surface border border-border rounded-xl p-6 md:p-8">
              <div className="flex items-start gap-3">
                <Wrench className="w-6 h-6 text-brand shrink-0" strokeWidth={1.75} />
                <div>
                  <h3 className="font-display text-xl font-semibold text-foreground">
                    Systèmes de spa que nous réparons
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground max-w-3xl">
                    La plupart des spas utilisent des composantes similaires, même lorsque la
                    marque est différente. Nous pouvons intervenir sur les systèmes et pièces
                    courantes comme Balboa, Gecko, Waterway et LX.
                  </p>
                </div>
              </div>
              <ul className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {REPAIRED_SYSTEMS.map((s) => (
                  <li
                    key={s}
                    className="flex items-center gap-2 text-sm text-foreground"
                  >
                    <CheckCircle2 className="w-4 h-4 text-brand shrink-0" /> {s}
                  </li>
                ))}
              </ul>
            </div>

            {/* Winter-ready */}
            <div className="mt-10 bg-card border border-border rounded-xl p-6 md:p-8">
              <div className="flex items-start gap-3">
                <Snowflake className="w-6 h-6 text-brand shrink-0" strokeWidth={1.75} />
                <div>
                  <h3 className="font-display text-xl font-semibold text-foreground">
                    Réparation de spas conçus pour le climat du Québec
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground max-w-3xl">
                    Certaines marques sont reconnues pour leur performance dans les hivers
                    québécois grâce à leur isolation, leur efficacité énergétique et leurs
                    composantes adaptées au froid. Nous réparons notamment :
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {WINTER_BRANDS.map((b) => (
                      <span
                        key={b}
                        className="inline-flex items-center gap-1.5 bg-brand/10 border border-brand/30 text-foreground px-3 py-1.5 rounded-full text-sm font-medium"
                      >
                        {b}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
