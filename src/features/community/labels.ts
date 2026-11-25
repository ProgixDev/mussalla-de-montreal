import { seatsLeft } from "@/core/portal/derive";
import type { Activity, ActivityCategory, Audience, EventKind } from "@/core/portal/types";
import { formatCAD } from "@/lib/format";

/**
 * Public-facing wording for the community pages. Pure (no hooks, no "use client") so the
 * Server Components (events) and the client forms share exactly the same labels.
 */

export const AUDIENCE_LABELS: Record<Audience, string> = {
  femmes: "Femmes",
  hommes: "Hommes",
  enfants: "Enfants",
  tous: "Tous publics",
};

export const CATEGORY_LABELS: Record<ActivityCategory, string> = {
  coran: "Coran",
  arabe: "Arabe",
  sport: "Sport",
  communaute: "Communauté",
  dars: "Dars",
};

export const EVENT_KIND_LABELS: Record<EventKind, string> = {
  dars: "Dars",
  halaqa: "Halaqa",
  evenement: "Événement",
  priere: "Prière",
  annonce: "Annonce",
};

/** « 6 à 9 ans », « 16 ans et plus », « Jusqu’à 12 ans », « Tous âges ». */
export function ageRangeLabel(a: Pick<Activity, "ageMin" | "ageMax">): string {
  if (a.ageMin !== null && a.ageMax !== null) return `${a.ageMin} à ${a.ageMax} ans`;
  if (a.ageMin !== null) return `${a.ageMin} ans et plus`;
  if (a.ageMax !== null) return `Jusqu’à ${a.ageMax} ans`;
  return "Tous âges";
}

/** « Gratuit » or « 40 $ / mois ». */
export function priceLabel(a: Pick<Activity, "monthlyPriceCents">): string {
  return a.monthlyPriceCents === 0 ? "Gratuit" : `${formatCAD(a.monthlyPriceCents)} / mois`;
}

/** « Complet — liste d’attente », « 1 place restante », « 6 places restantes ». */
export function seatsLabel(a: Activity): string {
  const left = seatsLeft(a);
  if (left === 0) return "Complet — liste d’attente";
  return left === 1 ? "1 place restante" : `${left} places restantes`;
}

/** Activities a child would join (children's audience, or an upper age under 18). */
export const isChildActivity = (a: Pick<Activity, "audience" | "ageMax">): boolean =>
  a.audience === "enfants" || (a.ageMax !== null && a.ageMax < 18);

export const lowerFirst = (s: string): string => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s);

const pad = (n: number) => String(n).padStart(2, "0");

/** The visitor's local day as ISO ("2026-11-25") — never toISOString(), which is UTC. */
export function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** The centre's day (Montréal), for server-side filtering of upcoming events. */
export function centreToday(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** Calendar arithmetic on a bare ISO day, done in UTC so no time zone can shift it. */
export function addDaysIso(iso: string, days: number): string {
  const [y = 1970, m = 1, d = 1] = iso.slice(0, 10).split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + days));
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}
