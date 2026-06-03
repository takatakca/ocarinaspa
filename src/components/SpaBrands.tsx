import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Search, Wrench, Snowflake, CheckCircle2 } from "lucide-react";
import {
  SPA_BRAND_CATEGORIES,
  WINTER_BRANDS,
  REPAIRED_SYSTEMS,
} from "@/data/spaBrands";
import { FEATURED_BRANDS, BRAND_IMAGES } from "@/data/brandImages";

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
            Marques de spas réparées
          </p>
          <h2 className="mt-3 font-display text-3xl md:text-4xl font-bold text-foreground">
            Marques de spas que nous réparons au Québec
          </h2>
          <p className="mt-4 text-muted-foreground">
            Ocarina Spa intervient sur la majorité des marques de spas, hot tubs et spas de
            nage présents au Québec. Plusieurs marques utilisent des composantes communes —
            Balboa, Gecko, Waterway, LX — ce qui nous permet de diagnostiquer rapidement les
            problèmes courants.
          </p>
        </div>

        {/* Featured brand cards with images */}
        <div className="mt-10 grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {FEATURED_BRANDS.map((b) => (
            <div
              key={b.name}
              className="group bg-card border border-border rounded-xl overflow-hidden hover:shadow-xl hover:border-brand/50 transition-all flex flex-col"
            >
              <div className="aspect-[4/3] overflow-hidden bg-surface">
                <img
                  src={b.img}
                  alt={`Réparation de spa ${b.name} au Québec`}
                  width={800}
                  height={600}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-4 flex flex-col flex-1">
                <h3 className="font-semibold text-foreground text-sm leading-tight">{b.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground flex-1">{b.tag}</p>
                <Link
                  to="/contact"
                  className="mt-3 inline-flex items-center justify-center gap-1 bg-brand/10 text-brand hover:bg-brand hover:text-brand-foreground px-3 py-2 rounded-md text-xs font-semibold transition-colors"
                >
                  Réparer cette marque →
                </Link>
              </div>
            </div>
          ))}
        </div>

        {!compact && (
          <>
            {/* Search */}
            <div className="mt-14">
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
                    {cat.brands.map((b) => {
                      const img = BRAND_IMAGES[b];
                      return (
                        <li
                          key={b}
                          className="inline-flex items-center gap-2 pl-1 pr-3 py-1 rounded-full bg-surface border border-border text-sm text-foreground"
                        >
                          {img ? (
                            <img
                              src={img}
                              alt=""
                              aria-hidden="true"
                              width={28}
                              height={28}
                              loading="lazy"
                              className="w-6 h-6 rounded-full object-cover"
                            />
                          ) : (
                            <span className="w-6 h-6 rounded-full bg-brand/15 inline-flex items-center justify-center text-[10px] font-bold text-brand">
                              {b.charAt(0)}
                            </span>
                          )}
                          {b}
                        </li>
                      );
                    })}
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
                    Composantes internes communes à la majorité des marques : Balboa, Gecko,
                    Waterway et LX.
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
                    Spas conçus pour l'hiver québécois
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground max-w-3xl">
                    Marques particulièrement performantes par grand froid grâce à leur isolation
                    et leurs composantes adaptées :
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
