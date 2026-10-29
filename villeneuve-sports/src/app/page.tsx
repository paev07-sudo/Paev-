import Link from "next/link";
import { Hero } from "@/components/home/hero";
import { Ticker } from "@/components/home/ticker";
import { DateGate } from "@/components/matches/date-gate";
import { MatchCard } from "@/components/matches/match-card";
import { NewsCard } from "@/components/news/news-card";
import { TeamCard } from "@/components/teams/team-card";
import { ArrowRight, Lightbulb, MapPin } from "@/components/ui/icons";
import { ButtonLink, Notice, SectionHeading } from "@/components/ui/primitives";
import { CheckedOn, SourceList, VerificationBadge } from "@/components/ui/verification";
import { club, identityPillars } from "@/content/club";
import { matches, standings } from "@/content/matches";
import { sortedNews } from "@/content/news";
import { LAST_CHECKED } from "@/content/sources";
import { sponsors, sponsorsListedOn } from "@/content/sponsors";
import { teams } from "@/content/teams";
import { venues } from "@/content/venue";
import { formatShortDate } from "@/lib/format";

export default function HomePage() {
  const played = matches.filter((m) => m.status === "played" && m.score).sort((a, b) => b.date.localeCompare(a.date));
  const upcoming = matches.filter((m) => m.status === "scheduled").sort((a, b) => a.date.localeCompare(b.date));
  const title = standings.find((s) => s.id === "4e-ligue-g6-2025-26")!;
  const featured = ["premiere-equipe", "juniores-ff17", "juniors-d7-1", "juniors-e", "deuxieme-equipe", "juniors-f"]
    .map((slug) => teams.find((t) => t.slug === slug)!)
    .filter(Boolean);
  const latest = sortedNews().slice(0, 3);

  const tickerItems = [
    { label: "2026/27", text: "1re équipe · 3e ligue, groupe 2" },
    ...upcoming.map((m) => ({ label: "À venir", text: `${formatShortDate(m.date)} · ${m.competition} · ${m.venue ?? ""}` })),
    ...played.slice(0, 2).map((m) => ({
      label: "Résultat",
      text: `${formatShortDate(m.date)} · ${m.home.name} ${m.score!.home}–${m.score!.away} ${m.away.name}`,
    })),
    { label: "Titre", text: "Champion du groupe 6 de 4e ligue 2025/26 · 57 points" },
    { label: "Club", text: `${club.teamCount.value} équipes engagées à l'ACVF` },
  ];

  return (
    <>
      <Hero />
      <Ticker items={tickerItems} updatedLabel={`Informations vérifiées le ${formatShortDate(LAST_CHECKED)}.`} />

      {/* Identity */}
      <section aria-labelledby="identite" className="on-light py-20 md:py-28">
        <div className="container-site grid gap-14 lg:grid-cols-[1fr_1.15fr] lg:gap-20">
          <SectionHeading
            id="identite"
            eyebrow="Le club"
            title={
              <>
                Cent ans de football
                <br />
                au bout du Léman
              </>
            }
            intro={
              <p>
                Fondé le {club.founded.label}, le Villeneuve-Sports a traversé un siècle en bleu et jaune. Relancé en 2015 par un comité presque
                entièrement renouvelé, il a reconstruit son mouvement junior et décroché en 2026 le titre du groupe 6 de 4e ligue.
              </p>
            }
          />
          <div className="grid gap-px overflow-hidden rounded-[4px] border border-line bg-line sm:grid-cols-2">
            {identityPillars.map((p, i) => (
              <div key={p.label} className="flex flex-col bg-card p-6 md:p-7" data-reveal style={{ "--reveal-i": i } as React.CSSProperties}>
                <span className="display text-[clamp(2.8rem,5vw,3.75rem)] text-primary">{p.figure}</span>
                <h3 className="mt-3 font-display text-[1.25rem] font-bold uppercase tracking-[0.02em]">{p.label}</h3>
                <p className="mt-2 text-[0.9375rem] text-muted">{p.text}</p>
                <div className="mt-auto flex flex-wrap items-center gap-3 pt-5">
                  <VerificationBadge level={p.verification} />
                  <SourceList ids={p.sources} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="container-site mt-12">
          <Link href="/club" className="group inline-flex items-center gap-2 font-display text-[1.05rem] font-bold uppercase tracking-[0.08em] text-primary">
            Histoire, comité et valeurs <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </section>

      {/* Season spotlight */}
      <section aria-labelledby="saison" className="grain relative overflow-hidden bg-night py-20 text-white md:py-28">
        <div aria-hidden="true" className="pitch-lines absolute inset-0 opacity-50" />
        <div aria-hidden="true" data-ghost="57" className="ghost display pointer-events-none absolute -right-8 top-6 text-[clamp(10rem,30vw,26rem)] leading-none text-white/[0.035]" />
        <div className="container-site relative grid gap-14 lg:grid-cols-[1.1fr_1fr] lg:items-end">
          <div>
            <SectionHeading
              id="saison"
              tone="dark"
              eyebrow="Saison 2025/26"
              title={
                <>
                  Champion.
                  <br />
                  <span className="text-accent">Cap sur la 3e ligue.</span>
                </>
              }
              intro={
                <p>
                  Le 24 mai 2026, une victoire 2–0 contre le FC Aigle II offre à la première équipe le titre du groupe 6 de 4e ligue, à deux journées de
                  la fin. En 2026/27, Villeneuve-Sports I découvre le groupe 2 de 3e ligue.
                </p>
              }
            />
            <div className="mt-9 flex flex-col gap-3 xs:flex-row" data-reveal>
              <ButtonLink href="/actualites/champion-4e-ligue-groupe-6" variant="accent">
                Lire le récit du titre
              </ButtonLink>
              <ButtonLink href="/matchs" variant="ghost-light">
                Match center
              </ButtonLink>
            </div>
          </div>
          <div data-reveal>
            <div className="rounded-[4px] border border-line-dark bg-navy/80 p-6 backdrop-blur-sm md:p-8">
              <div className="flex items-center justify-between gap-4">
                <h3 className="font-display text-[1.25rem] font-bold uppercase">{title.competition}</h3>
                <VerificationBadge level={title.verification} tone="dark" />
              </div>
              <dl className="mt-6 grid grid-cols-3 gap-4 text-center sm:grid-cols-6">
                {[
                  ["J", title.rows[0].played],
                  ["V", title.rows[0].won],
                  ["N", title.rows[0].drawn],
                  ["D", title.rows[0].lost],
                  ["Buts", `${title.rows[0].goalsFor}:${title.rows[0].goalsAgainst}`],
                  ["Pts", title.rows[0].points],
                ].map(([k, v]) => (
                  <div key={k as string} className="rounded-[3px] bg-night/70 px-2 py-3">
                    <dt className="eyebrow text-[0.6875rem] text-muted-dark">{k}</dt>
                    <dd className={`display mt-1 text-[1.75rem] ${k === "Pts" ? "text-accent" : "text-white"}`}>{v}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-5 text-[0.875rem] text-muted-dark">
                Classement relevé en {title.snapshot.toLowerCase()}. 2e : FC Aigle II, 50 points (points de pénalité déduits).
              </p>
              <SourceList ids={title.sources} tone="dark" className="mt-3" />
            </div>
          </div>
        </div>
      </section>

      {/* Matches */}
      <section aria-labelledby="matchs" className="bg-night pb-20 text-white md:pb-28">
        <div className="container-site">
          <div className="flex flex-col justify-between gap-6 border-t border-line-dark pt-16 md:flex-row md:items-end">
            <SectionHeading id="matchs" tone="dark" eyebrow="Match center" title="Au programme" />
            <div data-reveal>
              <CheckedOn date={LAST_CHECKED} tone="dark" />
            </div>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {upcoming.map((m) => (
              <DateGate key={m.id} date={m.date}>
                <div data-reveal className="md:col-span-2">
                  <p className="eyebrow mb-3 text-accent">À venir</p>
                  <MatchCard match={m} />
                </div>
              </DateGate>
            ))}
            {played.slice(0, 2).map((m, i) => (
              <div key={m.id} data-reveal style={{ "--reveal-i": i + 1 } as React.CSSProperties}>
                <p className="eyebrow mb-3 text-muted-dark">Résultat</p>
                <MatchCard match={m} />
              </div>
            ))}
          </div>
          <div className="mt-8" data-reveal>
            <Notice tone="dark" title="Pas de score en direct">
              Le calendrier complet et les résultats de la semaine sont publiés par l&apos;ACVF. Ce site affiche les rencontres vérifiées dans des
              sources publiques, avec leur date de vérification.{" "}
              <a
                href="https://matchcenter-acvf.football.ch/default.aspx?oid=16&lng=2&v=1142"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-accent underline underline-offset-4"
              >
                Ouvrir le match center ACVF
              </a>
            </Notice>
          </div>
        </div>
      </section>

      {/* Teams */}
      <section aria-labelledby="equipes" className="on-light py-20 md:py-28">
        <div className="container-site">
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
            <SectionHeading
              id="equipes"
              eyebrow={`${club.teamCount.value} équipes`}
              title="Une famille, toutes les générations"
              intro={<p>Des Juniors G aux actifs, en passant par les juniores filles : chaque équipe a sa fiche, sa compétition et ses sources.</p>}
            />
            <div data-reveal>
              <ButtonLink href="/equipes" variant="primary">
                Toutes les équipes
              </ButtonLink>
            </div>
          </div>
        </div>
        <div className="mt-12">
          <ul
            className="container-site flex snap-x snap-mandatory gap-5 overflow-x-auto pb-6 [scrollbar-width:thin] md:grid md:snap-none md:grid-cols-2 md:overflow-visible lg:grid-cols-3"
            aria-label="Équipes à la une"
          >
            {featured.map((t, i) => (
              <li key={t.slug} className="w-[82%] shrink-0 snap-start xs:w-[60%] md:w-auto" data-reveal style={{ "--reveal-i": i } as React.CSSProperties}>
                <TeamCard team={t} />
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Facilities */}
      <section aria-labelledby="tronchenaz" className="relative overflow-hidden bg-primary py-20 text-white md:py-28">
        <div aria-hidden="true" className="absolute inset-0 opacity-[0.12]">
          <svg className="h-full w-full" viewBox="0 0 105 68" preserveAspectRatio="xMidYMid slice" fill="none" stroke="white" strokeWidth="0.25">
            <rect x="2" y="2" width="101" height="64" />
            <line x1="52.5" y1="2" x2="52.5" y2="66" />
            <circle cx="52.5" cy="34" r="9.15" />
            <rect x="2" y="13.84" width="16.5" height="40.32" />
            <rect x="86.5" y="13.84" width="16.5" height="40.32" />
          </svg>
        </div>
        <div className="container-site relative grid gap-12 lg:grid-cols-2 lg:items-center">
          <SectionHeading
            id="tronchenaz"
            tone="dark"
            eyebrow="Notre maison"
            title={
              <>
                Stade de la
                <br />
                Tronchenaz
              </>
            }
            intro={
              <p className="text-white/85">
                Un terrain principal en gazon naturel éclairé et un terrain annexe, au cœur de la zone sportive communale de la Tronchenaz, à Villeneuve.
              </p>
            }
          />
          <div className="grid gap-4 sm:grid-cols-2" data-reveal>
            {venues.map((v) => (
              <div key={v.slug} className="rounded-[4px] bg-night/40 p-6 ring-1 ring-white/15">
                <p className="eyebrow text-accent">{v.kind}</p>
                <h3 className="display mt-2 text-[1.75rem]">{v.name}</h3>
                <ul className="mt-4 space-y-1.5 text-[0.9375rem] text-white/85">
                  {v.facts.slice(0, 3).map((f) => (
                    <li key={f.label} className="flex justify-between gap-4 border-b border-white/10 pb-1.5">
                      <span className="text-white/65">{f.label}</span>
                      <span className="font-semibold">{f.value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="inline-flex items-center gap-2 text-[0.9375rem] text-white/85">
                <MapPin size={18} className="text-accent" /> Route de la Tronchenaz 14, 1844 Villeneuve
              </p>
              <ButtonLink href="/installations" variant="accent">
                Découvrir le stade
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>

      {/* News */}
      <section aria-labelledby="actus" className="on-light py-20 md:py-28">
        <div className="container-site">
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
            <SectionHeading id="actus" eyebrow="Actualités" title="La vie du club" />
            <div data-reveal>
              <ButtonLink href="/actualites" variant="ghost-dark">
                Toutes les actualités
              </ButtonLink>
            </div>
          </div>
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {latest.map((a, i) => (
              <div key={a.slug} data-reveal style={{ "--reveal-i": i } as React.CSSProperties}>
                <NewsCard article={a} featured={i === 0} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sponsors */}
      <section aria-labelledby="partenaires" className="on-light border-t border-line bg-paper-2 py-16 md:py-20">
        <div className="container-site">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <SectionHeading id="partenaires" eyebrow="Ils soutiennent le club" title="Partenaires" />
            <p className="max-w-sm text-[0.875rem] text-muted" data-reveal>
              {sponsorsListedOn}. Liste non exhaustive, logos sur autorisation uniquement.
            </p>
          </div>
          <ul className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-[4px] border border-line bg-line md:grid-cols-3 lg:grid-cols-6">
            {sponsors.map((s) => (
              <li key={s.name} className="flex min-h-28 flex-col justify-center bg-card px-5 py-6" data-reveal>
                <span className="font-display text-[1.15rem] font-bold uppercase leading-tight text-ink">{s.name}</span>
                {s.location && <span className="mt-1 text-[0.8125rem] text-muted">{s.location}</span>}
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
            <SourceList ids={["club-sponsors"]} />
            <Link href="/partenaires" className="group inline-flex items-center gap-2 font-display text-[1.05rem] font-bold uppercase tracking-[0.08em] text-primary">
              Devenir partenaire <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* Join */}
      <section aria-labelledby="rejoindre" className="relative overflow-hidden bg-accent py-20 text-night md:py-24">
        <div aria-hidden="true" data-ghost="1921" className="ghost display pointer-events-none absolute -bottom-10 right-0 text-[clamp(8rem,22vw,20rem)] leading-none text-night/[0.06]" />
        <div className="container-site relative grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:items-center">
          <div>
            <p className="eyebrow flex items-center gap-3 text-night/80">
              <span aria-hidden="true" className="h-px w-8 bg-night" /> Inscriptions
            </p>
            <h2 id="rejoindre" className="display mt-4 text-[clamp(2.6rem,7vw,5.75rem)]">
              Enfile le bleu et jaune
            </h2>
            <p className="mt-5 max-w-xl text-lg text-night/80">
              Enfants, ados, filles, adultes : découvre les catégories du club et la marche à suivre. Selon la page d&apos;inscription du club, un
              rabais familial s&apos;applique à la cotisation lorsqu&apos;un frère ou une sœur joue déjà au club.
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <ButtonLink href="/rejoindre" variant="primary" className="w-full sm:w-auto">
              Comment s&apos;inscrire
            </ButtonLink>
            <p className="flex gap-2 text-[0.875rem] text-night/75">
              <Lightbulb size={18} className="shrink-0" />
              Pas encore sûr de la catégorie ? Écris au club, il t&apos;oriente vers la bonne équipe.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
