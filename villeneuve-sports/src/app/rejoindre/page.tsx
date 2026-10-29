import type { Metadata } from "next";
import Link from "next/link";
import { JoinForm } from "@/components/forms/forms";
import { ArrowRight, ArrowUpRight } from "@/components/ui/icons";
import { ButtonLink, Notice, PageHero, SectionHeading } from "@/components/ui/primitives";
import { SourceList } from "@/components/ui/verification";
import { club } from "@/content/club";
import { teams } from "@/content/teams";
import type { TeamSection } from "@/content/types";
import { pageUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Rejoindre le club",
  description: "Comment rejoindre le Villeneuve-Sports : catégories, démarches, cotisation et demande d'inscription.",
  alternates: { canonical: pageUrl("/rejoindre") },
};

const paths: { title: string; who: string; sections: TeamSection[]; text: string }[] = [
  {
    title: "Enfants",
    who: "Premiers pas",
    sections: ["enfants"],
    text: "Le football des enfants (Juniors G et F) se joue en tournois : on découvre le ballon, on joue beaucoup, sans classement.",
  },
  {
    title: "Jeunes",
    who: "Juniors & juniores",
    sections: ["juniors", "juniores"],
    text: "Des juniors E aux juniors C, et deux équipes de juniores filles (FF-14, FF-17) : la compétition en championnat ACVF.",
  },
  {
    title: "Adultes",
    who: "Actifs & seniors",
    sections: ["actifs", "seniors"],
    text: "La première équipe en 3e ligue, une deuxième équipe listée en 5e ligue, et des équipes seniors dont l'engagement 2026/27 reste à confirmer.",
  },
];

const faq = [
  {
    q: "À partir de quel âge peut-on jouer ?",
    a: "Le club liste une catégorie Juniors G, la porte d'entrée pour les plus jeunes. Les années de naissance par catégorie sont fixées chaque saison par l'Association suisse de football : indiquez l'année de naissance, le club vous oriente.",
  },
  {
    q: "Combien coûte la cotisation ?",
    a: "Le montant n'est pas publié en ligne. Selon la page d'inscription du club, un rabais familial s'applique lorsqu'un autre enfant de la famille joue déjà au club. Demandez le tarif au club.",
  },
  {
    q: "Les filles peuvent-elles jouer ?",
    a: "Oui. Le club engage des équipes de juniores filles (FF-17 et FF-14 cette saison).",
  },
  {
    q: "Quand ont lieu les entraînements ?",
    a: "Les horaires et lieux d'entraînement 2026/27 ne sont pas publiés en ligne ; le club les communique à l'inscription.",
  },
  {
    q: "Faut-il une licence ?",
    a: "Pour jouer des matchs officiels, chaque joueur doit être qualifié auprès de l'Association suisse de football. Le club s'occupe de cette démarche après l'inscription.",
  },
  {
    q: "Je ne joue pas, puis-je aider ?",
    a: "Le club fonctionne grâce à ses bénévoles (entraîneurs, comité, manifestations). Écrivez au club en choisissant le sujet « Bénévolat » sur la page contact.",
  },
];

export default function JoinPage() {
  return (
    <>
      <PageHero
        eyebrow="Inscriptions"
        title={
          <>
            Rejoins le
            <br />
            <span className="text-accent">bleu et jaune</span>
          </>
        }
        intro={<p>Que tu aies 5 ans ou 40, que tu débutes ou que tu joues depuis toujours : voici comment rejoindre une équipe du Villeneuve-Sports.</p>}
      >
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="#demande" variant="accent">
            Faire une demande
          </ButtonLink>
          <ButtonLink href={club.contact.registrationPage} variant="ghost-light">
            Page d&apos;inscription officielle
          </ButtonLink>
        </div>
      </PageHero>

      <section aria-labelledby="parcours" className="on-light py-16 md:py-24">
        <div className="container-site">
          <SectionHeading id="parcours" eyebrow="Pour qui ?" title="Trouve ta catégorie" />
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {paths.map((p, i) => {
              const list = teams.filter((t) => p.sections.includes(t.section));
              return (
                <article key={p.title} className="flex flex-col rounded-[4px] border border-line bg-card p-6 md:p-8" data-reveal style={{ "--reveal-i": i } as React.CSSProperties}>
                  <p className="eyebrow text-primary">{p.who}</p>
                  <h3 className="display mt-2 text-[2.75rem]">{p.title}</h3>
                  <p className="mt-3 text-muted">{p.text}</p>
                  <ul className="mt-6 flex flex-wrap gap-2">
                    {list.map((t) => (
                      <li key={t.slug}>
                        <Link
                          href={`/equipes/${t.slug}`}
                          className="inline-flex min-h-10 items-center rounded-full border border-line px-3.5 text-[0.875rem] font-semibold transition-colors hover:border-primary hover:text-primary"
                        >
                          {t.shortName}
                          {t.verification === "unconfirmed" && <span className="ml-1.5 text-[0.75rem] font-normal text-danger">à confirmer</span>}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section aria-labelledby="etapes" className="grain relative overflow-hidden bg-night py-16 text-white md:py-24">
        <div aria-hidden="true" className="pitch-lines absolute inset-0 opacity-40" />
        <div className="container-site relative">
          <SectionHeading id="etapes" tone="dark" eyebrow="Démarche" title="En trois étapes" />
          <ol className="mt-12 grid gap-5 md:grid-cols-3">
            {[
              ["Choisir", "Repère la catégorie qui correspond à ton âge, ou indique simplement ton année de naissance."],
              ["Contacter", "Envoie ta demande avec le formulaire ci-dessous, par e-mail, ou via la page d'inscription du site officiel."],
              ["Jouer", "Le club t'oriente vers l'équipe et l'entraîneur, puis s'occupe de la qualification auprès de l'ASF."],
            ].map(([t, d], i) => (
              <li key={t} className="rounded-[4px] border border-line-dark bg-navy p-6" data-reveal style={{ "--reveal-i": i } as React.CSSProperties}>
                <span className="display text-[4rem] text-accent">0{i + 1}</span>
                <h3 className="mt-2 font-display text-[1.5rem] font-bold uppercase">{t}</h3>
                <p className="mt-2 text-muted-dark">{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="faq" className="on-light py-16 md:py-24">
        <div className="container-site grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <SectionHeading id="faq" eyebrow="Questions fréquentes" title="Bon à savoir" />
            <SourceList ids={["club-inscription", "club-juniors", "acvf-matchcenter"]} className="mt-6" />
          </div>
          <div className="divide-y divide-line border-y border-line" data-reveal>
            {faq.map((f) => (
              <details key={f.q} className="group py-2">
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-2 font-display text-[1.3rem] font-bold uppercase leading-tight [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <span aria-hidden="true" className="relative h-4 w-4 shrink-0">
                    <span className="absolute left-0 top-1/2 h-0.5 w-4 -translate-y-1/2 bg-primary" />
                    <span className="absolute left-1/2 top-0 h-4 w-0.5 -translate-x-1/2 bg-primary transition-transform duration-300 group-open:scale-y-0" />
                  </span>
                </summary>
                <p className="pb-4 pr-8 text-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section id="demande" aria-labelledby="demande-title" className="on-light scroll-mt-24 border-t border-line bg-paper-2 py-16 md:py-24">
        <div className="container-site grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <SectionHeading
              id="demande-title"
              eyebrow="Demande d'inscription"
              title="On t'attend"
              intro={<p>Remplis ce formulaire : le club reçoit ta demande et revient vers toi pour la suite.</p>}
            />
            <div className="mt-8 space-y-4">
              <Notice title="Inscription officielle">
                Le club dispose aussi d&apos;une page d&apos;inscription sur son site.{" "}
                <a href={club.contact.registrationPage} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-primary underline underline-offset-4">
                  villeneuvesports.ch <ArrowUpRight size={14} />
                </a>
              </Notice>
              <Link href="/contact" className="group inline-flex items-center gap-2 font-display text-[1.05rem] font-bold uppercase tracking-[0.08em] text-primary">
                Autres contacts <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
          <div className="rounded-[4px] border border-line bg-card p-6 md:p-10">
            <JoinForm />
          </div>
        </div>
      </section>
    </>
  );
}
