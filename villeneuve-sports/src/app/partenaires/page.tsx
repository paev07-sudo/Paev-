import type { Metadata } from "next";
import { SponsorForm } from "@/components/forms/forms";
import { Notice, PageHero, SectionHeading } from "@/components/ui/primitives";
import { SourceList, VerificationBadge } from "@/components/ui/verification";
import { sponsors, sponsorsListedOn } from "@/content/sponsors";

export const metadata: Metadata = {
  title: "Partenaires",
  description: "Les partenaires du Villeneuve-Sports et comment soutenir le club de football de Villeneuve VD.",
  alternates: { canonical: "/partenaires" },
};

const ways = [
  {
    title: "Le mouvement junior",
    text: "De 15 enfants en 2015 à près de 160 en 2023 : encadrement, matériel et tournois ont besoin de moyens qui grandissent avec lui.",
    sources: ["radio-chablais-2023"],
  },
  {
    title: "La Tronchenaz",
    text: "Le stade accueille les matchs à domicile des actifs et des juniors : une présence locale, à Villeneuve, tout au long de la saison.",
    sources: ["acvf-matchcenter"],
  },
  {
    title: "Un club en progression",
    text: "Champion de 4e ligue en 2026 et promu en 3e ligue : un projet sportif à accompagner sur la durée.",
    sources: ["footromand-champion", "proxifoot-2026-09"],
  },
];

export default function PartnersPage() {
  return (
    <>
      <PageHero
        eyebrow="Partenaires"
        title={
          <>
            Ils jouent
            <br />
            <span className="text-accent">avec nous</span>
          </>
        }
        intro={<p>Commerces, entreprises et institutions de la région soutiennent le football à Villeneuve. Merci à eux.</p>}
      />

      <section aria-labelledby="liste" className="on-light py-16 md:py-24">
        <div className="container-site">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <SectionHeading id="liste" eyebrow="Ils soutiennent le club" title="Nos partenaires" />
            <div className="flex flex-wrap items-center gap-3" data-reveal>
              <VerificationBadge level="reported" />
              <SourceList ids={["club-sponsors"]} />
            </div>
          </div>
          <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {sponsors.map((s, i) => (
              <li
                key={s.name}
                className="group relative flex min-h-48 flex-col justify-between overflow-hidden rounded-[4px] border border-line bg-card p-7 transition-[border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-primary"
                data-reveal
                style={{ "--reveal-i": i % 3 } as React.CSSProperties}
              >
                <span aria-hidden="true" className="absolute right-0 top-0 h-1 w-16 bg-accent transition-[width] duration-500 group-hover:w-full" />
                {s.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.logo.src} alt={s.logo.alt} width={s.logo.width} height={s.logo.height} className="h-16 w-auto object-contain" loading="lazy" />
                ) : (
                  <span className="display text-[2rem] text-ink">{s.name}</span>
                )}
                <span className="mt-6 text-[0.9375rem] text-muted">{s.location ?? "Adresse non indiquée"}</span>
              </li>
            ))}
          </ul>
          <div className="mt-8 max-w-3xl">
            <Notice title="À propos de cette liste">
              {sponsorsListedOn}. Elle n&apos;est pas exhaustive et peut avoir changé. Les logos ne sont affichés qu&apos;avec l&apos;accord du club et de
              chaque partenaire ; le nom du sponsor principal mentionné par l&apos;ACVF n&apos;a pas pu être lu.
            </Notice>
          </div>
        </div>
      </section>

      <section aria-labelledby="pourquoi" className="grain relative overflow-hidden bg-night py-16 text-white md:py-24">
        <div aria-hidden="true" className="pitch-lines absolute inset-0 opacity-40" />
        <div className="container-site relative">
          <SectionHeading
            id="pourquoi"
            tone="dark"
            eyebrow="Devenir partenaire"
            title="Pourquoi soutenir le Villeneuve-Sports"
            intro={<p>Les formes de partenariat (visibilité, équipement, soutien aux juniors, événements) se définissent avec le comité.</p>}
          />
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {ways.map((w, i) => (
              <article key={w.title} className="flex flex-col rounded-[4px] border border-line-dark bg-navy p-6 md:p-8" data-reveal style={{ "--reveal-i": i } as React.CSSProperties}>
                <span className="display text-[3rem] text-accent">0{i + 1}</span>
                <h3 className="mt-2 font-display text-[1.6rem] font-bold uppercase leading-tight">{w.title}</h3>
                <p className="mt-3 text-muted-dark">{w.text}</p>
                <SourceList ids={w.sources} tone="dark" className="mt-auto pt-5" />
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="proposition" aria-labelledby="form-title" className="on-light scroll-mt-24 py-16 md:py-24">
        <div className="container-site grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <SectionHeading
            id="form-title"
            eyebrow="Prendre contact"
            title="Parlons partenariat"
            intro={<p>Décrivez votre entreprise et le type de soutien envisagé : le comité revient vers vous.</p>}
          />
          <div className="rounded-[4px] border border-line bg-card p-6 md:p-10">
            <SponsorForm />
          </div>
        </div>
      </section>
    </>
  );
}
