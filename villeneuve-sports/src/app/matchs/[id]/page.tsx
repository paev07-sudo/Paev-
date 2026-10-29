import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Calendar, Clock, MapPin } from "@/components/ui/icons";
import { Notice } from "@/components/ui/primitives";
import { CheckedOn, SourceList, VerificationBadge, verificationHelp } from "@/components/ui/verification";
import { getMatch, matches, outcome } from "@/content/matches";
import { LAST_CHECKED } from "@/content/sources";
import { getTeam } from "@/content/teams";
import { formatLongDate } from "@/lib/format";

export function generateStaticParams() {
  return matches.map((m) => ({ id: m.id }));
}

export async function generateMetadata({ params }: PageProps<"/matchs/[id]">): Promise<Metadata> {
  const { id } = await params;
  const m = getMatch(id);
  if (!m) return {};
  const score = m.score ? ` ${m.score.home}–${m.score.away}` : "";
  return {
    title: `${m.home.name}${score} ${m.away.name}`,
    description: `${m.competition}, ${formatLongDate(m.date)}.`,
    alternates: { canonical: `/matchs/${m.id}` },
  };
}

const outcomeLabel = { V: "Victoire", N: "Match nul", D: "Défaite" } as const;

export default async function MatchPage({ params }: PageProps<"/matchs/[id]">) {
  const { id } = await params;
  const match = getMatch(id);
  if (!match) notFound();
  const res = outcome(match);
  const ourSlug = match.home.teamSlug ?? match.away.teamSlug;
  const team = ourSlug ? getTeam(ourSlug) : undefined;

  return (
    <>
      <header className="grain relative overflow-hidden bg-night pb-16 pt-[calc(var(--header-h)+3rem)] text-white md:pb-24 md:pt-[calc(var(--header-h)+4.5rem)]">
        <div aria-hidden="true" className="pitch-lines absolute inset-0 opacity-60" />
        <div aria-hidden="true" className="absolute left-1/2 top-1/2 h-[30rem] w-[30rem] -translate-x-1/2 -translate-y-1/3 rounded-full border border-white/[0.07]" />
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1 bg-[linear-gradient(90deg,var(--color-primary-bright)_0_50%,var(--color-accent)_50%_100%)]" />
        <div className="container-site relative">
          <nav aria-label="Fil d'Ariane" className="mb-8 text-[0.875rem] text-muted-dark">
            <Link href="/matchs" className="hover:text-white">
              Match center
            </Link>{" "}
            / <span className="text-white">{match.competition}</span>
          </nav>
          <div className="flex flex-wrap items-center justify-center gap-3 text-center">
            <span className="eyebrow rounded-[2px] bg-accent px-2 py-1 text-[0.6875rem] text-night">{match.competition}</span>
            <VerificationBadge level={match.verification} tone="dark" />
          </div>
          {match.format === "tournoi" ? (
            <h1 className="display mt-10 text-center text-[clamp(2.75rem,8vw,6.5rem)]">{match.home.name}</h1>
          ) : (
          <h1 className="mt-10 grid grid-cols-[1fr_auto_1fr] items-center gap-4 md:gap-10">
            <span className={`display text-right text-[clamp(1.75rem,5vw,4.25rem)] ${match.home.teamSlug ? "text-white" : "text-white/75"}`}>{match.home.name}</span>
            <span className="display rounded-[4px] bg-navy px-4 py-3 text-[clamp(2.5rem,8vw,6rem)] tabular-nums text-white ring-1 ring-line-dark md:px-8">
              {match.score ? (
                <>
                  {match.score.home}
                  <span className="text-muted-dark">–</span>
                  {match.score.away}
                </>
              ) : (
                <span className="text-[0.4em] tracking-[0.12em] text-muted-dark">VS</span>
              )}
              <span className="sr-only"> contre </span>
            </span>
            <span className={`display text-[clamp(1.75rem,5vw,4.25rem)] ${match.away.teamSlug ? "text-white" : "text-white/75"}`}>{match.away.name}</span>
          </h1>
          )}
          {res && <p className="mt-6 text-center font-display text-[1.25rem] font-bold uppercase tracking-[0.08em] text-accent">{outcomeLabel[res]}</p>}
          <ul className="mt-10 flex flex-wrap justify-center gap-x-8 gap-y-3 text-[0.9375rem] text-muted-dark">
            <li className="inline-flex items-center gap-2">
              <Calendar size={18} className="text-accent" />
              <time dateTime={match.date}>{formatLongDate(match.date)}</time>
            </li>
            {match.time && (
              <li className="inline-flex items-center gap-2">
                <Clock size={18} className="text-accent" /> {match.time}
              </li>
            )}
            <li className="inline-flex items-center gap-2">
              <MapPin size={18} className="text-accent" /> {match.venue ?? "Lieu non précisé par la source"}
            </li>
          </ul>
        </div>
      </header>

      <section className="on-light py-14 md:py-20">
        <div className="container-site grid max-w-5xl gap-10 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <h2 className="display text-[2.25rem]">{match.format === "tournoi" ? "Le tournoi" : "Le match"}</h2>
            {match.summary ? <p className="mt-4 text-lg leading-relaxed">{match.summary}</p> : <p className="mt-4 text-muted">Aucun compte rendu publié pour cette rencontre.</p>}
            {match.note && (
              <div className="mt-6">
                <Notice title="À noter">{match.note}</Notice>
              </div>
            )}
          </div>
          <aside className="space-y-4">
            <div className="rounded-[4px] border border-line bg-card p-6">
              <p className="eyebrow text-primary">Fiabilité</p>
              <p className="mt-2 text-[0.9375rem] text-muted">{verificationHelp(match.verification)}</p>
              <SourceList ids={match.sources} className="mt-4" />
              <div className="mt-3">
                <CheckedOn date={LAST_CHECKED} />
              </div>
            </div>
            {team && (
              <Link
                href={`/equipes/${team.slug}`}
                className="group flex items-center justify-between gap-4 rounded-[4px] bg-primary p-6 text-white transition-colors hover:bg-night"
              >
                <span>
                  <span className="eyebrow block text-accent">Équipe</span>
                  <span className="display mt-1 block text-[1.75rem]">{team.shortName}</span>
                </span>
                <ArrowRight size={22} className="transition-transform group-hover:translate-x-1" />
              </Link>
            )}
          </aside>
        </div>
      </section>
    </>
  );
}
