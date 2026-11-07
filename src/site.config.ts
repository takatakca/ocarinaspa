/**
 * SEO + consent kit: the ONE settings file per site.
 *
 * Rules:
 * - Only facts already present in this repo. Never invent an address, hours, phone, rating or review.
 * - Unknown values stay `undefined` with a `TODO(owner)` comment; the JSON-LD builder skips them.
 * - `url` is the real production domain (see foodhubca/private/hosting/MOCHAHOST_DOMAINS.md), never *.lovable.app.
 */
import { SITE as BRAND } from "@/lib/seo";

export type SchemaType =
  "Organization" | "LocalBusiness" | "Restaurant" | "NGO" | "SportsOrganization" | "Event";

export type PostalAddress = {
  streetAddress: string;
  addressLocality: string;
  addressRegion: string;
  postalCode?: string | undefined;
  addressCountry: string;
};

export type SiteConfig = {
  /** Public business name. */
  name: string;
  /** Legal name if different (TODO(owner) when unknown). */
  legalName?: string | undefined;
  /** Real production origin, no trailing slash. */
  url: string;
  /** <html lang>. French first (Québec). */
  lang: "fr-CA";
  /** Open Graph locale. */
  locale: "fr_CA";
  defaultTitle: string;
  defaultDescription: string;
  /** Default share image: path under /public or absolute URL. undefined = no og:image. */
  ogImage?: string | undefined;
  /** Logo: path under /public or absolute URL. */
  logo?: string | undefined;
  schemaType: SchemaType;
  email?: string | undefined;
  /** E.164, e.g. "+15145550000". */
  phone?: string | undefined;
  address?: PostalAddress | undefined;
  /** Real social profile URLs only (no "#", no generic facebook.com). */
  sameAs: string[];
  /** Privacy policy route, used by the cookie banner. undefined = no page yet (TODO(owner)). */
  privacyPath?: string | undefined;
  /** Law 25 privacy officer. */
  privacyOfficer: { name?: string | undefined; email?: string | undefined };
};

// Ocarina already keeps its business facts in src/lib/seo.ts: reuse them, do not duplicate.
// Page schema (LocalBusiness, Service, FAQ, Breadcrumb) stays in src/lib/seo.ts.
export const SITE: SiteConfig = {
  name: BRAND.name,
  legalName: BRAND.legalName,
  url: BRAND.domain,
  lang: "fr-CA",
  locale: "fr_CA",
  // Same defaults as the root head() in src/routes/__root.tsx.
  defaultTitle: "Ocarina Spa Québec — Réparation de spas",
  defaultDescription:
    "Spécialiste en réparation, installation, ouverture, fermeture et entretien de spas. Service à domicile dans les zones desservies au Québec.",
  // TODO(owner): real 1200x630 share image; the logo is used for now.
  ogImage: "/ocarina-logo.png",
  logo: "/ocarina-logo.png",
  schemaType: "LocalBusiness",
  email: BRAND.email,
  phone: BRAND.phoneTel,
  address: {
    streetAddress: BRAND.address.street,
    addressLocality: BRAND.address.city,
    addressRegion: BRAND.address.region,
    postalCode: BRAND.address.postalCode,
    addressCountry: BRAND.address.country,
  },
  // TODO(owner): Facebook page URL (FACEBOOK_PAGE_URL is not set yet).
  sameAs: [],
  privacyPath: "/confidentialite",
  // The privacy page names the role and info@ocarinaspa.ca.
  // TODO(owner): name of the person responsible for personal information (Law 25), if you want it shown.
  privacyOfficer: { name: undefined, email: BRAND.email },
};
