import Link from "next/link";
import { club } from "@/content/club";
import { LAST_CHECKED } from "@/content/sources";
import { address, mapLinks } from "@/content/venue";
import { ArrowUpRight, Facebook, Globe, Mail, MapPin } from "@/components/ui/icons";
import { Wordmark } from "@/components/ui/wordmark";
import { formatShortDate } from "@/lib/format";

const columns = [
  {
    title: "Le club",
    links: [
      { href: "/club", label: "Histoire & identité" },
      { href: "/installations", label: "Stade de la Tronchenaz" },
      { href: "/actualites", label: "Actualités" },
      { href: "/partenaires", label: "Partenaires" },
    ],
  },
  {
    title: "Football",
    links: [
      { href: "/equipes", label: "Toutes les équipes" },
      { href: "/matchs", label: "Match center" },
      { href: "/equipes?section=juniores", label: "Football féminin" },
      { href: "/equipes?section=enfants", label: "Football des enfants" },
    ],
  },
  {
    title: "Pratique",
    links: [
      { href: "/rejoindre", label: "Rejoindre une équipe" },
      { href: "/contact", label: "Contact" },
      { href: "/sources", label: "Sources & vérification" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-night text-white">
      <div aria-hidden="true" className="h-1 bg-[linear-gradient(90deg,var(--color-primary-bright)_0_50%,var(--color-accent)_50%_100%)]" />
      <div className="container-site py-16 md:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_2fr]">
          <div>
            <Wordmark tone="light" />
            <p className="mt-6 max-w-sm text-muted-dark">
              Club de football de Villeneuve VD, fondé le {club.founded.label}. Membre de l&apos;ACVF, club n° {club.asfNumber}.
            </p>
            <ul className="mt-8 space-y-3 text-[0.9375rem]">
              <li className="flex gap-3">
                <MapPin size={18} className="mt-0.5 shrink-0 text-accent" />
                <a href={mapLinks.google} target="_blank" rel="noopener noreferrer" className="hover:text-accent">
                  Stade de la Tronchenaz, {address.street}, {address.postcode} {address.city}
                  <span className="sr-only"> (carte, nouvelle fenêtre)</span>
                </a>
              </li>
              <li className="flex gap-3">
                <Mail size={18} className="mt-0.5 shrink-0 text-accent" />
                <a href={`mailto:${club.contact.email}`} className="break-all hover:text-accent">
                  {club.contact.email}
                </a>
              </li>
              <li className="flex gap-3">
                <span className="mt-0.5 w-[18px] shrink-0" aria-hidden="true" />
                <span className="text-muted-dark">{club.contact.postal.slice(1).join(", ")}</span>
              </li>
            </ul>
            <div className="mt-8 flex gap-3">
              <a
                href={club.contact.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 transition-colors hover:border-accent hover:text-accent"
              >
                <Facebook size={20} />
                <span className="sr-only">Facebook du club (nouvelle fenêtre)</span>
              </a>
              <a
                href={club.contact.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 transition-colors hover:border-accent hover:text-accent"
              >
                <Globe size={20} />
                <span className="sr-only">Site officiel villeneuvesports.ch (nouvelle fenêtre)</span>
              </a>
            </div>
          </div>
          <div className="grid gap-10 sm:grid-cols-3">
            {columns.map((col) => (
              <nav key={col.title} aria-label={col.title}>
                <h2 className="eyebrow text-accent">{col.title}</h2>
                <ul className="mt-5 space-y-1">
                  {col.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="inline-flex min-h-10 items-center text-white/85 transition-colors hover:text-white">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>
        <div className="mt-16 flex flex-col gap-4 border-t border-line-dark pt-8 text-[0.8125rem] text-muted-dark md:flex-row md:items-center md:justify-between">
          <p>
            Contenus vérifiés le {formatShortDate(LAST_CHECKED)} à partir de sources publiques.{" "}
            <Link href="/sources" className="underline underline-offset-4 hover:text-white">
              Voir les sources
            </Link>
          </p>
          <a
            href="https://matchcenter-acvf.football.ch/default.aspx?oid=16&lng=2&v=1142"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 hover:text-white"
          >
            Match center officiel ACVF <ArrowUpRight size={14} />
            <span className="sr-only">(nouvelle fenêtre)</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
