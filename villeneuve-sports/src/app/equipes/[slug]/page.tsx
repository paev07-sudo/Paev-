import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ViewTransition } from "react";
import { MatchCard } from "@/components/matches/match-card";
import { StandingTable } from "@/components/matches/standing-table";
import { teamMark } from "@/components/teams/team-card";
import { ArrowRight, Calendar, Clock, Mail, MapPin, Users } from "@/components/ui/icons";
import { ButtonLink, Notice } from "@/components/ui/primitives";
import { CheckedOn, SourceList, VerificationBadge, verificationHelp } from "@/components/ui/verification";
import { club } from "@/content/club";
import { matchesForTeam, standings } from "@/content/matches";
import { LAST_CHECKED } from "@/content/sources";
import { audienceLabels, getTeam, sections, teams } from "@/content/teams";

export function generateStaticParams() {
  return teams.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: PageProps<"/equipes/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const team = getTeam(slug);
  if (!team) return {};
  return {
    title: team.shortName,
    description: `${team.name} — ${team.competition ?? team.category}. ${team.summary}`,
    alternates: { canonical: `/equipes/${team.slug}` },
  };
}

function InfoBlock({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[4px] border border-line bg-card p-6">
      <div className="flex items-center gap-3 text-primary">
        {icon}
        <h3 className="eyebrow">{title}</h3>
      </div>
      <div className="mt-3 text-[0.9375rem] text-ink">{children}</div>
    </div>
  );
}

export default async function TeamPage({ params }: PageProps<"/equipes/[slug]">) {
  const { slug } = await params;
  const team = getTeam(slug);
  if (!team) notFound();

  const section = sections.find((s) => s.id === team.section)!;
  const teamMatches = matchesForTeam(team.slug).sort((a, b) => b.date.localeCompare(a.date));
  const teamStandings = standings.filter((s) => s.teamSlug === team.slug);
  const siblings = teams.filter((t) => t.section === team.section && t.slug !== team.slug);

  return (
    <>
      <header className="grain relative overflow-hidden bg-night pb-14 pt-[calc(var(--header-h)+3rem)] text-white md:pb-20 md:pt-[calc(var(--header-h)+4.5rem)]">
        <div aria-hidden="true" className="pitch-lines absolute inset-0 opacity-60" />
        <ViewTransition name={`team-mark-${team.slug}`}>
          <span
            aria-hidden="true"
            data-ghost={teamMark(team)}
            className="ghost display pointer-events-none absolute -bottom-[0.18em] right-[-0.04em] text-[clamp(10rem,32vw,28rem)] leading-none text-white/[0.06]"
          />
        </ViewTransition>
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1 bg-[linear-gradient(90deg,var(--color-primary-bright)_0_50%,var(--color-accent)_50%_100%)]" />
        <div className="container-site relative">
          <nav aria-label="Fil d'Ariane" className="mb-8 text-[0.875rem] text-muted-dark">
            <ol className="flex flex-wrap items-center gap-2">
              <li>
                <Link href="/equipes" className="hover:text-white">
                  Équipes
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link href={`/equipes?section=${section.id}`} className="hover:text-white">
                  {section.label}
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li aria-current="page" className="text-white">
                {team.shortName}
              </li>
            </ol>
          </nav>
          <div className="flex flex-wrap items-center gap-3">
            <span className="eyebrow rounded-[2px] bg-accent px-2 py-1 text-[0.6875rem] text-night">{section.label}</span>
            <VerificationBadge level={team.verification} tone="dark" />
            <span className="text-[0.9375rem] text-muted-dark">{audienceLabels[team.audience]} · Saison {team.season}</span>
          </div>
          <h1 className="display mt-6 max-w-5xl text-[clamp(3rem,9vw,7rem)]">{team.shortName}</h1>
          <p className="mt-2 font-display text-[clamp(1.25rem,2.5vw,1.75rem)] font-semibold uppercase tracking-[0.02em] text-accent">
            {team.competition ?? "Compétition 2026/27 à confirmer"}
          </p>
          <p className="mt-6 max-w-2xl text-lg text-muted-dark">{team.summary}</p>
          <dl className="mt-10 grid max-w-3xl grid-cols-1 gap-6 border-t border-white/15 pt-6 sm:grid-cols-3">
            <div>
              <dt className="eyebrow text-[0.6875rem] text-muted-dark">Nom officiel</dt>
              <dd className="mt-1.5 font-semibold">{team.name}</dd>
            </div>
            <div>
              <dt className="eyebrow text-[0.6875rem] text-muted-dark">Catégorie</dt>
              <dd className="mt-1.5 font-semibold">{team.category}</dd>
            </div>
            <div>
              <dt className="eyebrow text-[0.6875rem] text-muted-dark">Format</dt>
              <dd className="mt-1.5 font-semibold">{team.competitionType === "championnat" ? "Championnat ACVF" : team.competitionType === "tournois" ? "Tournois" : "À confirmer"}</dd>
            </div>
          </dl>
        </div>
      </header>

      <section className="on-light py-14 md:py-20">
        <div className="container-site grid gap-10 lg:grid-cols-[1.4fr_1fr]">
          <div className="min-w-0 space-y-12">
            {team.verification !== "confirmed" && (
              <Notice title={team.verification === "unconfirmed" ? "Équipe à confirmer" : "Information de source unique"}>
                {verificationHelp(team.verification)} {team.note}
              </Notice>
            )}

            <div>
              <h2 className="display text-[2.25rem]">Matchs & résultats</h2>
              {teamMatches.length > 0 ? (
                <div className="mt-6 grid gap-5 md:grid-cols-2">
                  {teamMatches.map((m) => (
                    <MatchCard key={m.id} match={m} />
                  ))}
                </div>
              ) : (
                <div className="mt-6 rounded-[4px] border border-dashed border-line bg-card px-6 py-10">
                  <p className="font-semibold">Aucun match vérifié pour cette équipe.</p>
                  <p className="mt-1 text-muted">Le calendrier de la semaine est publié sur le match center de l&apos;ACVF.</p>
                  <a
                    href="https://matchcenter-acvf.football.ch/default.aspx?oid=16&lng=2&v=1142"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex min-h-11 items-center gap-2 font-semibold text-primary underline underline-offset-4"
                  >
                    Ouvrir le match center ACVF <ArrowRight size={16} />
                  </a>
                </div>
              )}
            </div>

            {teamStandings.length > 0 && (
              <div>
                <h2 className="display text-[2.25rem]">Classements</h2>
                <div className="mt-6 space-y-8">
                  {teamStandings.map((s) => (
                    <StandingTable key={s.id} standing={s} />
                  ))}
                </div>
              </div>
            )}

            <div>
              <h2 className="display text-[2.25rem]">Photo d&apos;équipe</h2>
              {team.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={team.photo.src} width={team.photo.width} height={team.photo.height} alt={team.photo.alt} className="mt-6 w-full rounded-[4px]" loading="lazy" />
              ) : (
                <div className="relative mt-6 flex aspect-[16/7] items-end overflow-hidden rounded-[4px] bg-night p-6 text-white">
                  <div aria-hidden="true" className="pitch-lines absolute inset-0 opacity-70" />
                  <p className="relative max-w-md text-[0.9375rem] text-muted-dark">
                    La photo officielle de l&apos;équipe sera publiée ici lorsque le club la transmettra, avec l&apos;accord des joueurs et des
                    parents.
                  </p>
                </div>
              )}
            </div>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-28 lg:self-start" aria-label="Informations pratiques">
            <InfoBlock icon={<Users size={20} />} title="Encadrement">
              {team.staff.length > 0 ? (
                <ul className="space-y-1">
                  {team.staff.map((p) => (
                    <li key={p.name}>
                      <span className="font-semibold">{p.name}</span> · {p.role}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted">Entraîneurs 2026/27 non publiés.</p>
              )}
            </InfoBlock>
            <InfoBlock icon={<Clock size={20} />} title="Entraînements">
              {team.training.length > 0 ? (
                <ul className="space-y-1">
                  {team.training.map((s) => (
                    <li key={`${s.day}-${s.time}`}>
                      {s.day} · {s.time} · {s.place}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted">Horaires 2026/27 non publiés. Renseignez-vous auprès du club.</p>
              )}
            </InfoBlock>
            <InfoBlock icon={<MapPin size={20} />} title="Lieu">
              <p>
                Le club reçoit à la Tronchenaz (stade et terrain annexe), à Villeneuve.{" "}
                <Link href="/installations" className="font-semibold text-primary underline underline-offset-4">
                  Accès
                </Link>
              </p>
            </InfoBlock>
            <InfoBlock icon={<Calendar size={20} />} title="Recrutement">
              <p className="text-muted">{team.recruitment ?? "Statut non publié : contactez le club pour savoir si l'équipe accueille de nouveaux joueurs."}</p>
            </InfoBlock>
            <div className="rounded-[4px] bg-primary p-6 text-white">
              <p className="eyebrow text-accent">Contact & inscription</p>
              <p className="mt-2 text-[0.9375rem] text-white/85">Pas de contact par équipe publié : le club répond à l&apos;adresse générale.</p>
              <div className="mt-5 flex flex-col gap-3">
                <ButtonLink href={`/rejoindre?equipe=${team.slug}`} variant="accent">
                  Demande d&apos;inscription
                </ButtonLink>
                <a href={`mailto:${club.contact.email}?subject=${encodeURIComponent(`Renseignements — ${team.shortName}`)}`} className="inline-flex min-h-11 items-center gap-2 font-semibold underline underline-offset-4">
                  <Mail size={18} /> {club.contact.email}
                </a>
              </div>
            </div>
            <div className="space-y-2 pt-2">
              <SourceList ids={team.sources} />
              <CheckedOn date={LAST_CHECKED} />
            </div>
          </aside>
        </div>
      </section>

      {siblings.length > 0 && (
        <nav aria-label={`Autres équipes : ${section.label}`} className="on-light border-t border-line bg-paper-2 py-12">
          <div className="container-site">
            <p className="eyebrow text-primary">{section.label}</p>
            <ul className="mt-4 flex flex-wrap gap-3">
              {siblings.map((t) => (
                <li key={t.slug}>
                  <Link href={`/equipes/${t.slug}`} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-card px-5 font-semibold transition-colors hover:border-primary hover:text-primary">
                    {t.shortName} <ArrowRight size={16} />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      )}
    </>
  );
}
