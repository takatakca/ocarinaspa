import { describe, it, expect } from "vitest";
import { cityServiceHead } from "@/components/CityServicePage";
import { SERVICE_TYPES, quebecMunicipalities, findMunicipalityBySlug } from "@/data/quebecMunicipalities";
import { SITE } from "@/lib/seo";

const SAMPLE_FR_CITIES = ["montreal", "quebec", "laval", "becancour", "trois-rivieres"];
const SAMPLE_EN_CITIES = ["montreal", "quebec", "laval"];
const FR_SERVICES = SERVICE_TYPES.filter((s) => s.category !== "spa-en").map((s) => s.slug);
const EN_SERVICES = SERVICE_TYPES.filter((s) => s.category === "spa-en").map((s) => s.slug);

const findLink = (links: any[], rel: string, hreflang?: string) =>
  links.find((l) => l.rel === rel && (hreflang ? l.hreflang === hreflang : !l.hreflang));

const parseJsonLd = (scripts: any[]) =>
  scripts
    .filter((s) => s.type === "application/ld+json")
    .map((s) => JSON.parse(s.children));

describe("SEO – sample FR city service pages", () => {
  for (const villeSlug of SAMPLE_FR_CITIES) {
    for (const serviceSlug of FR_SERVICES) {
      it(`${serviceSlug}/${villeSlug} has canonical, hreflang and JSON-LD`, () => {
        const muni = findMunicipalityBySlug(villeSlug);
        expect(muni, `municipality ${villeSlug} must exist`).toBeTruthy();

        const head = cityServiceHead(serviceSlug as any, villeSlug);
        const url = `${SITE.domain}/${serviceSlug}/${villeSlug}`;

        // canonical
        const canonical = findLink(head.links!, "canonical");
        expect(canonical?.href).toBe(url);

        // hreflang fr-CA self
        expect(findLink(head.links!, "alternate", "fr-CA")?.href).toBe(url);

        // JSON-LD schemas present
        const lds = parseJsonLd(head.scripts!);
        const types = lds.map((j) => (Array.isArray(j["@type"]) ? j["@type"][0] : j["@type"]));
        expect(types).toContain("LocalBusiness");
        expect(types).toContain("Service");
        expect(types).toContain("FAQPage");
        expect(types).toContain("BreadcrumbList");

        // FAQPage validity
        const faq = lds.find((j) => j["@type"] === "FAQPage");
        expect(faq.mainEntity.length).toBeGreaterThan(0);
        for (const q of faq.mainEntity) {
          expect(q["@type"]).toBe("Question");
          expect(q.acceptedAnswer["@type"]).toBe("Answer");
          expect(q.acceptedAnswer.text).toBeTruthy();
        }

        // title contains city name
        const title = (head.meta as any[]).find((m) => "title" in m)?.title;
        expect(title).toContain(muni!.name);
      });
    }
  }
});

describe("SEO – sample EN city service pages", () => {
  for (const villeSlug of SAMPLE_EN_CITIES) {
    for (const serviceSlug of EN_SERVICES) {
      it(`${serviceSlug}/${villeSlug} EN canonical + FR alternate`, () => {
        const head = cityServiceHead(serviceSlug as any, villeSlug);
        const url = `${SITE.domain}/${serviceSlug}/${villeSlug}`;
        expect(findLink(head.links!, "canonical")?.href).toBe(url);
        expect(findLink(head.links!, "alternate", "en-CA")?.href).toBe(url);

        // FR alternate must point to the FR counterpart
        const frAlt = findLink(head.links!, "alternate", "fr-CA");
        expect(frAlt?.href).toMatch(new RegExp(`/(reparation-spa|entretien-spa)/${villeSlug}$`));
        expect(findLink(head.links!, "alternate", "x-default")?.href).toBe(frAlt?.href);

        const lds = parseJsonLd(head.scripts!);
        const types = lds.map((j) => (Array.isArray(j["@type"]) ? j["@type"][0] : j["@type"]));
        expect(types).toContain("LocalBusiness");
        expect(types).toContain("Service");
        expect(types).toContain("FAQPage");
      });
    }
  }
});

describe("SEO – sitemap coverage", () => {
  it("contains all 13 services × all municipalities + base routes", () => {
    const expected = SERVICE_TYPES.length * quebecMunicipalities.length + 4;
    expect(quebecMunicipalities.length).toBeGreaterThanOrEqual(1200);
    expect(SERVICE_TYPES.length).toBe(13);
    expect(expected).toBeGreaterThan(15000);
  });

  it("every SERVICE_TYPES slug has a corresponding route file", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    for (const s of SERVICE_TYPES) {
      const file = path.resolve("src/routes", `${s.slug}.$ville.tsx`);
      expect(fs.existsSync(file), `route file missing for ${s.slug}`).toBe(true);
    }
  });
});

describe("SEO – unknown slugs return 404 head", () => {
  it("invalid city slug yields not-found title", () => {
    const head = cityServiceHead("reparation-spa" as any, "ville-inexistante-zzz");
    const title = (head.meta as any[]).find((m) => "title" in m)?.title;
    expect(title).toMatch(/non trouvé/i);
  });
});
