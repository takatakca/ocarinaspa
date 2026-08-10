import { createServerFn } from "@tanstack/react-start";

export type PublicExperienceConfig = {
  googleReviewUrl: string | null;
  facebookPageUrl: string | null;
};

function safePublicUrl(value: string | undefined) {
  const raw = (value ?? "").trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

/** Public URLs only. No secret is ever returned from this function. */
export const getPublicExperienceConfig = createServerFn({ method: "GET" }).handler(
  async (): Promise<PublicExperienceConfig> => ({
    googleReviewUrl: safePublicUrl(
      process.env.GOOGLE_REVIEW_URL || process.env.VITE_GOOGLE_REVIEW_URL,
    ),
    facebookPageUrl: safePublicUrl(
      process.env.FACEBOOK_PAGE_URL || process.env.VITE_FACEBOOK_PAGE_URL,
    ),
  }),
);
