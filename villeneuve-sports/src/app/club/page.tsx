import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Mail } from "@/components/ui/icons";
import { ButtonLink, Notice, PageHero, SectionHeading } from "@/components/ui/primitives";
import { SourceList, VerificationBadge } from "@/components/ui/verification";
import { club, identityPillars, milestones, people } from "@/content/club";
import { facilityIssues } from "@/content/venue";

export const metadata: Metadata = {
  title: "Le club",
  description: "Histoire, identité et comité du Villeneuve-Sports, club de football de Villeneuve VD fondé le 1er juillet 1921.",
  alternates: { canonical: "/club" },
};

export default function ClubPage() {
  return (
    <>
      <PageHero
        eyebrow="Le club · depuis 1921"
        title={
          <>
            Bleu, jaune
            <br />
            <span className="text-accent">et centenaire</span>
          </>
        }
        intro={
          <p>
            Le Villeneuve-Sports est né le {club.founded.label} à Villeneuve, au bout du Léman. Un siècle plus tard, le club
            vit une deuxième jeunesse : un mouvement junior reconstruit, des équipes filles et une première équipe promue en 3e ligue.
          </p>
        }
      >
        <dl className="mt-12 grid max-w-4xl grid-cols-2 gap-6 border-t border-white/15 pt-6 md:grid-cols-4">
          {[
            ["Fondation", "1.7.1921"],
            ["Couleurs", "Bleu · jaune"],
            ["Association", "ACVF"],
            ["N° de club ASF", club.asfNumber],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="eyebrow text-[0.6875rem] text-muted-dark">{k}</dt>
              <dd className="display mt-1.5 text-[1.75rem]">{v}</dd>
            </div>
          ))}
        </dl>
      </PageHero>

      {/* Timeline */}
      <section aria-labelledby="histoire" className="on-light py-20 md:py-28">
        <div className="container-site grid gap-14 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <SectionHeading
              id="histoire"
              eyebrow="Histoire"
              title="Les grandes dates"
              intro={
                <p>
                  Chaque étape renvoie à sa source. Le club n&apos;a pas publié d&apos;historique complet en ligne : les périodes sans source
                  n&apos;apparaissent pas ici.
                </p>
              }
            />
          </div>
          <ol className="relative border-l-2 border-line pl-8 md:pl-12">
            {milestones.map((m, i) => (
              <li key={m.year} className="relative pb-12 last:pb-0" data-reveal style={{ "--reveal-i": i % 3 } as React.CSSProperties}>
                <span aria-hidden="true" className="absolute -left-[calc(2rem+7px)] top-2 h-3 w-3 rotate-45 bg-primary md:-left-[calc(3rem+7px)]" />
                <p className="display text-[clamp(2.5rem,6vw,4rem)] text-primary">{m.year}</p>
                <h3 className="mt-1 font-display text-[1.5rem] font-bold uppercase">{m.title}</h3>
                <p className="mt-2 max-w-xl text-muted">{m.text}</p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <VerificationBadge level={m.verification} />
                  <SourceList ids={m.sources} />
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Identity */}
      <section aria-labelledby="identite" className="grain relative overflow-hidden bg-night py-20 text-white md:py-28">
        <div aria-hidden="true" className="pitch-lines absolute inset-0 opacity-50" />
        <div className="container-site relative">
          <SectionHeading
            id="identite"
            tone="dark"
            eyebrow="Identité"
            title="Ce qui fait le Villeneuve-Sports"
            intro={
              <p>
                Le comité n&apos;a pas publié de charte de valeurs. Plutôt que d&apos;en inventer une, voici ce que racontent les faits.
              </p>
            }
          />
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {identityPillars.map((p, i) => (
              <article key={p.label} className="flex flex-col rounded-[4px] border border-line-dark bg-navy p-6" data-reveal style={{ "--reveal-i": i } as React.CSSProperties}>
                <span className="display text-[3.25rem] text-accent">{p.figure}</span>
                <h3 className="mt-3 font-display text-[1.25rem] font-bold uppercase">{p.label}</h3>
                <p className="mt-2 text-[0.9375rem] text-muted-dark">{p.text}</p>
                <div className="mt-auto pt-5">
                  <SourceList ids={p.sources} tone="dark" />
                </div>
              </article>
            ))}
          </div>
          {club.mission && (
            <blockquote className="mt-14 max-w-3xl border-l-4 border-accent pl-6 text-2xl text-white">{club.mission}</blockquote>
          )}
        </div>
      </section>

      {/* Committee */}
      <section aria-labelledby="comite" className="on-light py-20 md:py-28">
        <div className="container-site grid gap-12 lg:grid-cols-[1fr_1.2fr]">
          <SectionHeading
            id="comite"
            eyebrow="Organisation"
            title="Comité & direction"
            intro={
              <p>
                Le club est géré par un comité de bénévoles. Seules les fonctions publiées sont listées ; la composition complète figure sur le site
                officiel.
              </p>
            }
          />
          <div className="space-y-4" data-reveal>
            {people.map((p) => (
              <div key={p.name} className="flex flex-col gap-4 rounded-[4px] border border-line bg-card p-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="eyebrow text-primary">{p.role}</p>
                  <p className="display mt-1 text-[2rem]">{p.name}</p>
                  {p.note && <p className="mt-1 text-[0.875rem] text-muted">{p.note}</p>}
                </div>
                <div className="flex flex-col items-start gap-2 sm:items-end">
                  <VerificationBadge level={p.verification} />
                  <SourceList ids={p.sources} />
                </div>
              </div>
            ))}
            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <ButtonLink href={club.contact.committeePage} variant="primary">
                Le comité sur le site officiel
              </ButtonLink>
              <ButtonLink href={`mailto:${club.contact.email}`} variant="ghost-dark" arrow={false}>
                <Mail size={18} /> Écrire au club
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>

      {/* Community & future */}
      <section aria-labelledby="avenir" className="on-light border-t border-line bg-paper-2 py-20 md:py-28">
        <div className="container-site grid gap-12 lg:grid-cols-2">
          <SectionHeading
            id="avenir"
            eyebrow="Communauté & avenir"
            title={facilityIssues.title}
            intro={<p>{facilityIssues.outlook}</p>}
          />
          <div data-reveal>
            <ul className="divide-y divide-line rounded-[4px] border border-line bg-card">
              {facilityIssues.points.map((pt) => (
                <li key={pt} className="flex gap-4 px-6 py-4">
                  <span aria-hidden="true" className="mt-2.5 h-1.5 w-1.5 shrink-0 rotate-45 bg-primary" />
                  <span>{pt}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <VerificationBadge level={facilityIssues.verification} />
              <SourceList ids={facilityIssues.sources} />
            </div>
            <div className="mt-8">
              <Notice title="Ambitions du club">
                Le club n&apos;a pas publié de projet sportif détaillé. Cette rubrique accueillera le texte du comité dès qu&apos;il sera transmis.
              </Notice>
            </div>
            <Link href="/installations" className="group mt-8 inline-flex items-center gap-2 font-display text-[1.05rem] font-bold uppercase tracking-[0.08em] text-primary">
              Les installations de la Tronchenaz <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
