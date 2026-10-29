import type { MetadataRoute } from "next";
import { matches } from "@/content/matches";
import { news } from "@/content/news";
import { LAST_CHECKED } from "@/content/sources";
import { teams } from "@/content/teams";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const at = new Date(`${LAST_CHECKED}T12:00:00Z`);
  const page = (path: string, priority: number): MetadataRoute.Sitemap[number] => ({ url: `${siteUrl}${path}`, lastModified: at, priority });
  return [
    page("/", 1),
    page("/club", 0.8),
    page("/equipes", 0.9),
    page("/matchs", 0.9),
    page("/installations", 0.7),
    page("/actualites", 0.8),
    page("/rejoindre", 0.9),
    page("/partenaires", 0.6),
    page("/contact", 0.7),
    page("/sources", 0.3),
    ...teams.map((t) => page(`/equipes/${t.slug}`, 0.7)),
    ...news.map((a) => page(`/actualites/${a.slug}`, 0.6)),
    ...matches.map((m) => page(`/matchs/${m.id}`, 0.4)),
  ];
}
