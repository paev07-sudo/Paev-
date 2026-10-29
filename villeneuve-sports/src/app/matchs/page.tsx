import type { Metadata } from "next";
import { DateGate } from "@/components/matches/date-gate";
import { MatchCard } from "@/components/matches/match-card";
import { MatchCenterFilter } from "@/components/matches/match-center";
import { StandingTable } from "@/components/matches/standing-table";
import { ArrowUpRight } from "@/components/ui/icons";
import { Notice, PageHero, SectionHeading } from "@/components/ui/primitives";
import { CheckedOn } from "@/components/ui/verification";
import { teams } from "@/content/teams";
import { getDataSource } from "@/lib/data-source";
import { pageUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Match center",
  description: "Résultats, rencontres à venir et classements du Villeneuve-Sports, avec la date de vérification de chaque donnée.",
  alternates: { canonical: pageUrl("/matchs") },
};

const ACVF = "https://matchcenter-acvf.football.ch/default.aspx?oid=16&lng=2&v=1142";

export default async function MatchesPage() {
  const source = getDataSource();
  const [matches, standings] = await Promise.all([source.getMatches(), source.getStandings()]);

  const cards = Object.fromEntries(
    matches.map((m) => [
      m.id,
      m.status === "scheduled" ? (
        <DateGate key={m.id} date={m.date} past={<MatchCard match={m} passed />}>
          <MatchCard match={m} />
        </DateGate>
      ) : (
        <MatchCard key={m.id} match={m} />
      ),
    ]),
  );

  return (
    <>
      <PageHero
        eyebrow="Match center"
        title={
          <>
            Matchs &<br />
            <span className="text-accent">classements</span>
          </>
        }
        intro={
          <p>
            Les rencontres et classements du Villeneuve-Sports vérifiés dans des sources publiques. Ce n&apos;est pas un flux en direct : chaque
            donnée affiche sa source et sa date de vérification.
          </p>
        }
      >
        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
          <CheckedOn date={source.updatedOn} tone="dark" />
          <span className="text-[0.8125rem] text-muted-dark">Source des données : {source.label}</span>
        </div>
      </PageHero>

      <section aria-label="Rencontres" className="bg-night py-14 text-white md:py-20">
        <div className="container-site">
          <MatchCenterFilter
            matches={matches.map(({ id, home, away, status, date }) => ({ id, home, away, status, date }))}
            teams={teams.map(({ slug, shortName }) => ({ slug, shortName }))}
            cards={cards}
            today={
              <Notice tone="dark" title="Calendrier complet">
                Les rencontres de championnat de la semaine (actifs, juniors, juniores) sont publiées par l&apos;ACVF. Seules les dates
                vérifiées apparaissent ici.{" "}
                <a href={ACVF} target="_blank" rel="noopener noreferrer" className="font-semibold text-accent underline underline-offset-4">
                  Voir le calendrier officiel
                </a>
              </Notice>
            }
          />
        </div>
      </section>

      <section aria-labelledby="classements" className="on-light py-16 md:py-24">
        <div className="container-site">
          <SectionHeading
            id="classements"
            eyebrow="Classements"
            title="Les tableaux"
            intro={<p>Extraits vérifiés. Les tableaux complets et à jour sont tenus par l&apos;ACVF.</p>}
          />
          <div className="mt-10 grid gap-8 xl:grid-cols-2">
            {standings.map((s) => (
              <div key={s.id} data-reveal className="min-w-0">
                <StandingTable standing={s} />
              </div>
            ))}
          </div>
          <a
            href={ACVF}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-10 inline-flex min-h-12 items-center gap-2 rounded-[3px] bg-primary px-6 font-display text-[1.0625rem] font-bold uppercase tracking-[0.06em] text-white transition-colors hover:bg-night"
          >
            Match center officiel ACVF <ArrowUpRight size={18} />
            <span className="sr-only">(nouvelle fenêtre)</span>
          </a>
        </div>
      </section>

      <section aria-labelledby="donnees" className="on-light border-t border-line bg-paper-2 py-14">
        <div className="container-site max-w-3xl">
          <h2 id="donnees" className="display text-[2rem]">
            Brancher les données officielles
          </h2>
          <p className="mt-3 text-muted">
            Le site lit aujourd&apos;hui un relevé statique. Un point d&apos;intégration (<code className="rounded bg-card px-1.5 py-0.5 text-[0.875em]">src/lib/data-source.ts</code>)
            permet de brancher un export du club (Clubcorner / FOOT Gestion) ou un flux autorisé de l&apos;ACVF sans modifier les pages.
          </p>
        </div>
      </section>
    </>
  );
}
