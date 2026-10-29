/** Public URL of the deployed site. Set NEXT_PUBLIC_SITE_URL in production. */
export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

export const nav = [
  { href: "/club", label: "Le club" },
  { href: "/equipes", label: "Équipes" },
  { href: "/matchs", label: "Matchs" },
  { href: "/installations", label: "Tronchenaz" },
  { href: "/actualites", label: "Actualités" },
  { href: "/partenaires", label: "Partenaires" },
  { href: "/contact", label: "Contact" },
] as const;
