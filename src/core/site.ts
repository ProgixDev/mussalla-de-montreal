/**
 * Central site config — the single source for metadata, robots, sitemap, and
 * manifest.
 */

const LOCAL_URL = "http://localhost:3000";

const isLoopback = (url: string) => /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:|\/|$)/i.test(url);

/**
 * The origin this deployment is actually reachable at.
 *
 * This is NOT only metadata: the TV QR code encodes it, so a wrong value here is a
 * broken donation path. A phone that scans `http://localhost:3000/caisse` opens ITS
 * OWN localhost and the donor sees nothing — the failure is silent and only shows up
 * on someone else's phone, never on the machine that built the page.
 *
 * Resolution order:
 *  1. An explicit, non-loopback NEXT_PUBLIC_SITE_URL — the custom domain, once there is one.
 *  2. Vercel's production domain, set automatically on every deploy, so the QR is
 *     correct the moment the site ships without anyone configuring anything.
 *  3. localhost, for `next dev`.
 *
 * A loopback NEXT_PUBLIC_SITE_URL is deliberately ignored when a Vercel domain exists:
 * that pairing is always a leftover `.env`, never an intent to point a public TV at
 * localhost. Read only from server components (see the `site` consumers) — the Vercel
 * var has no NEXT_PUBLIC_ prefix and so is absent in the browser.
 */
function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;

  if (vercel && (!explicit || isLoopback(explicit))) return `https://${vercel}`;
  return explicit || LOCAL_URL;
}

const url = resolveSiteUrl();

export const site = {
  name: "Mussalla de Montréal",
  shortName: "La caisse",
  description:
    "La caisse de la Mussalla de Montréal — chaque don et chaque dépense, visibles de tous, en direct.",
  url,
  /** Bare host for on-screen display, e.g. `mussalla-mtl.ca` — no scheme, no trailing slash. */
  host: url.replace(/^https?:\/\//, "").replace(/\/+$/, ""),
  locale: "fr_CA",
  city: "Montréal (Québec)",
} as const;
