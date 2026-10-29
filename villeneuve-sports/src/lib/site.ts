/** Public URL of the deployed site, including any base path. Set NEXT_PUBLIC_SITE_URL in production. */
export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

/**
 * Search engines may index the site only when NEXT_PUBLIC_INDEXABLE=true.
 * Off by default so previews are never mistaken for the club's official site;
 * turn it on for the launch approved by the club.
 */
export const indexable = process.env.NEXT_PUBLIC_INDEXABLE === "true";

/** Absolute URL of a page, base path included (for canonical and sharing tags). */
export function pageUrl(path: string): string {
  return `${siteUrl}${path === "/" ? "/" : path}`;
}

export const nav = [
  { href: "/club", label: "Le club" },
  { href: "/equipes", label: "Équipes" },
  { href: "/matchs", label: "Matchs" },
  { href: "/installations", label: "Tronchenaz" },
  { href: "/actualites", label: "Actualités" },
  { href: "/partenaires", label: "Partenaires" },
  { href: "/contact", label: "Contact" },
] as const;
