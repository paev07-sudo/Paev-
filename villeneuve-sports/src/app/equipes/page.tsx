import type { Metadata } from "next";
import { TeamDirectory } from "@/components/teams/team-directory";
import { Notice, PageHero } from "@/components/ui/primitives";
import { CheckedOn, VerificationBadge } from "@/components/ui/verification";
import { club } from "@/content/club";
import { LAST_CHECKED } from "@/content/sources";
import { teams } from "@/content/teams";
import { getDataSource } from "@/lib/data-source";

export const metadata: Metadata = {
  title: "Équipes",
  description: "Toutes les équipes du Villeneuve-Sports en 2026/27 : actifs, seniors, juniors, juniores filles et football des enfants.",
  alternates: { canonical: "/equipes" },
};

export default async function TeamsPage() {
  const list = await getDataSource().getTeams();
  const confirmed = teams.filter((t) => t.verification === "confirmed").length;
  return (
    <>
      <PageHero
        eyebrow="Saison 2026/27"
        title={
          <>
            Toutes les
            <br />
            <span className="text-accent">équipes</span>
          </>
        }
        intro={
          <p>
            Le match center ACVF recense {club.teamCount.value} équipes du Villeneuve-Sports. Voici chacune de celles que les sources publiques
            permettent d&apos;identifier, avec son niveau de vérification.
          </p>
        }
      >
        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-[0.9375rem] text-muted-dark">
          <span className="inline-flex items-center gap-2">
            <VerificationBadge level="confirmed" tone="dark" /> {confirmed} équipes confirmées
          </span>
          <CheckedOn date={LAST_CHECKED} tone="dark" />
        </div>
      </PageHero>
      <section className="py-14 md:py-20">
        <div className="container-site">
          <TeamDirectory teams={list} />
          <div className="mt-14 max-w-3xl">
            <Notice title="Une équipe manque ou n'est plus active ?">
              Les entraîneurs, horaires et contacts par équipe ne sont pas publiés pour 2026/27. Le comité peut compléter chaque fiche dans
              <code className="mx-1 rounded bg-paper-2 px-1.5 py-0.5 text-[0.875em]">src/content/teams.ts</code>, ou écrire à{" "}
              <a href={`mailto:${club.contact.email}`} className="font-semibold text-primary underline underline-offset-4">
                {club.contact.email}
              </a>
              .
            </Notice>
          </div>
        </div>
      </section>
    </>
  );
}
