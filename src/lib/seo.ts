export const SITE = {
  name: "Ocarina Spa Québec",
  domain: "https://ocarinaspa.ca",
  phone: "(819) 913-7727",
  phoneTel: "+18199137727",
  address: {
    street: "16280 Boul Bécancour",
    city: "Bécancour",
    region: "QC",
    postalCode: "G9H 2M1",
    country: "CA",
  },
  hours: "24/7",
  email: "info@ocarinaspa.ca",
};

export const localBusinessSchema = () => ({
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": SITE.domain + "/#business",
  name: SITE.name,
  url: SITE.domain,
  telephone: SITE.phoneTel,
  priceRange: "$$",
  image: SITE.domain + "/og-default.jpg",
  address: {
    "@type": "PostalAddress",
    streetAddress: SITE.address.street,
    addressLocality: SITE.address.city,
    addressRegion: SITE.address.region,
    postalCode: SITE.address.postalCode,
    addressCountry: SITE.address.country,
  },
  areaServed: { "@type": "AdministrativeArea", name: "Québec, Canada" },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      opens: "00:00",
      closes: "23:59",
    },
  ],
});

export const serviceSchema = (service: string, city: string) => ({
  "@context": "https://schema.org",
  "@type": "Service",
  serviceType: service,
  provider: { "@type": "LocalBusiness", name: SITE.name, telephone: SITE.phoneTel },
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
