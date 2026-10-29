import { HeroStage } from "@/components/three/hero-stage";
import { ButtonLink } from "@/components/ui/primitives";
import { club } from "@/content/club";

export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-night text-white">
      <HeroStage />
      {/* Legibility veil: stronger on the text side. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(5,11,31,0.95)_0%,rgba(5,11,31,0.55)_32%,transparent_62%)] md:bg-[linear-gradient(100deg,rgba(5,11,31,0.92)_0%,rgba(5,11,31,0.55)_38%,transparent_62%)]" />

      <div className="container-site relative mt-auto pb-10 pt-[calc(var(--header-h)+2rem)] md:my-auto md:pb-16">
        <p className="eyebrow flex items-center gap-3 text-accent">
          <span aria-hidden="true" className="h-px w-8 bg-accent" />
          Villeneuve VD · Depuis 1921
        </p>
        <h1 id="hero-title" className="display mt-5 text-[clamp(3.6rem,13vw,10.5rem)] leading-[0.82]">
          <span className="block">Villeneuve</span>
          <span className="block">
            <span className="text-accent">-</span>Sports
          </span>
        </h1>
        <p className="mt-6 max-w-xl text-lg text-white/85 md:text-xl">
          Bleu et jaune depuis plus d&apos;un siècle. Champion de 4e ligue au printemps, la première équipe joue en 3e ligue en 2026/27.{" "}
          {club.teamCount.value} équipes, des juniors aux actifs, à la Tronchenaz.
        </p>
        <div className="mt-9 flex flex-col gap-3 xs:flex-row">
          <ButtonLink href="/club" variant="accent">
            Découvrir le club
          </ButtonLink>
          <ButtonLink href="/rejoindre" variant="ghost-light">
            Rejoindre une équipe
          </ButtonLink>
        </div>

        <dl className="mt-12 hidden max-w-3xl grid-cols-2 gap-x-6 gap-y-5 border-t border-white/15 pt-6 sm:grid sm:grid-cols-4">
          {[
            { k: "Fondation", v: "1921" },
            { k: "Équipes", v: String(club.teamCount.value) },
            { k: "1re équipe", v: "3e ligue" },
            { k: "Terrain", v: "Tronchenaz" },
          ].map((s) => (
            <div key={s.k}>
              <dt className="eyebrow text-[0.6875rem] text-muted-dark">{s.k}</dt>
              <dd className="display mt-1.5 text-[1.9rem] text-white">{s.v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
