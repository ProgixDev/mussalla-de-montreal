/**
 * Central site config — the single source for metadata, robots, sitemap, and
 * manifest. NEXT_PUBLIC_SITE_URL drives canonical + Open Graph URLs.
 */
export const site = {
  name: "Mussalla de Montréal",
  shortName: "La caisse",
  description:
    "La caisse de la Mussalla de Montréal — chaque don et chaque dépense, visibles de tous, en direct.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  locale: "fr_CA",
  city: "Montréal (Québec)",
} as const;
