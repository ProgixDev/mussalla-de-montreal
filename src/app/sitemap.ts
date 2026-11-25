import type { MetadataRoute } from "next";
import { site } from "@/core/site";

type Entry = MetadataRoute.Sitemap[number];

/** Public, indexable routes. Keep auth/account/api and the focused surfaces (/portail, /tv, /admin) out. */
const ROUTES: { path: string; changeFrequency: Entry["changeFrequency"]; priority: number }[] = [
  { path: "", changeFrequency: "weekly", priority: 1 },
  { path: "/activites", changeFrequency: "weekly", priority: 0.9 },
  { path: "/evenements", changeFrequency: "daily", priority: 0.9 },
  { path: "/adhesion", changeFrequency: "monthly", priority: 0.8 },
  { path: "/caisse", changeFrequency: "daily", priority: 0.7 },
  { path: "/apprendre", changeFrequency: "monthly", priority: 0.6 },
  { path: "/benevolat", changeFrequency: "monthly", priority: 0.6 },
  { path: "/imam", changeFrequency: "monthly", priority: 0.5 },
];

/** Add a row per public, indexable route. */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return ROUTES.map((r) => ({
    url: `${site.url}${r.path}`,
    lastModified,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
