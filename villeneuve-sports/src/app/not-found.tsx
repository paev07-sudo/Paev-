import { ButtonLink } from "@/components/ui/primitives";

export default function NotFound() {
  return (
    <section className="grain relative flex min-h-[80svh] items-center overflow-hidden bg-night pt-[var(--header-h)] text-white">
      <div aria-hidden="true" className="pitch-lines absolute inset-0 opacity-50" />
      <div className="container-site relative">
        <p className="eyebrow text-accent">Erreur 404</p>
        <h1 className="display mt-4 text-[clamp(3.5rem,12vw,9rem)]">Hors-jeu</h1>
        <p className="mt-4 max-w-lg text-lg text-muted-dark">Cette page n&apos;existe pas ou a été déplacée.</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/">Retour à l&apos;accueil</ButtonLink>
          <ButtonLink href="/equipes" variant="ghost-light">
            Voir les équipes
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
