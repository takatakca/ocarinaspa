import logo from "@/assets/ocarina-logo.png";

export const SITE = {
  name: "Ocarina Spa",
  legalName: "Ocarina Spa Québec",
  domain: "https://ocarinaspa.ca",
  phone: "819-913-7727",
  phoneTel: "+18199137727",
  email: "info@ocarinaspa.ca",
  logo,
  address: {
    street: "16280 Boul Bécancour",
    city: "Bécancour",
    region: "QC",
    postalCode: "G9H 2M1",
    country: "CA",
  },
};

export const localBusinessSchema = (extra?: { areaName?: string; image?: string }) => ({
  "@context": "https://schema.org",
  "@type": ["LocalBusiness", "HomeAndConstructionBusiness"],
  "@id": SITE.domain + "/#business",
  name: SITE.legalName,
  alternateName: SITE.name,
  url: SITE.domain,
  telephone: SITE.phoneTel,
  priceRange: "$$",
  image: extra?.image ?? SITE.domain + "/ocarina-logo.png",
  logo: SITE.domain + "/ocarina-logo.png",
  address: {
    "@type": "PostalAddress",
    streetAddress: SITE.address.street,
    addressLocality: SITE.address.city,
    addressRegion: SITE.address.region,
    postalCode: SITE.address.postalCode,
    addressCountry: SITE.address.country,
  },
  areaServed: extra?.areaName
    ? { "@type": "City", name: extra.areaName }
    : { "@type": "AdministrativeArea", name: "Québec, Canada" },
  openingHoursSpecification: [{
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],
    opens: "00:00", closes: "23:59",
  }],
});

export const serviceSchema = (service: string, city: string) => ({
  "@context": "https://schema.org",
  "@type": "Service",
  serviceType: service,
  provider: { "@type": "LocalBusiness", name: SITE.legalName, telephone: SITE.phoneTel },
  areaServed: { "@type": "City", name: city },
  name: `${service} à ${city}`,
});

export const faqSchema = (faqs: Array<{ q: string; a: string }>) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
});

/**
 * Build canonical + hreflang link tags for a page.
 * Pass the FR path; the EN equivalent (or `/en`) is added automatically.
 */
export const altLinks = (opts: {
  path: string;
  enPath?: string | null;
  lang?: "fr-CA" | "en-CA";
}) => {
  const lang = opts.lang ?? "fr-CA";
  const fr = SITE.domain + opts.path;
  const en = opts.enPath === null ? null : SITE.domain + (opts.enPath ?? "/en");
  const self = lang === "en-CA" ? en! : fr;
  const links: Array<{ rel: string; href: string; hreflang?: string }> = [
    { rel: "canonical", href: self },
    { rel: "alternate", hreflang: "fr-CA", href: fr },
  ];
  if (en) {
    links.push({ rel: "alternate", hreflang: "en-CA", href: en });
    links.push({ rel: "alternate", hreflang: "x-default", href: fr });
  }
  return links;
};

export const breadcrumbSchema = (items: Array<{ name: string; url: string }>) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((it, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: it.name,
    item: it.url,
  })),
});
