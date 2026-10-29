import type { Metadata } from "next";
import { PitchExplorer } from "@/components/venue/pitch-explorer";
import { ArrowUpRight, MapPin } from "@/components/ui/icons";
import { ButtonLink, Notice, PageHero, SectionHeading } from "@/components/ui/primitives";
import { SourceList, VerificationBadge } from "@/components/ui/verification";
import { address, facilityIssues, mapLinks, sportsZone, venues } from "@/content/venue";
import { pageUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Stade de la Tronchenaz",
  description: "Le stade de la Tronchenaz et son terrain annexe, à Villeneuve VD : adresse, accès, terrains et zone sportive.",
  alternates: { canonical: pageUrl("/installations") },
};

export default function FacilitiesPage() {
  return (
    <>
      <PageHero
        eyebrow="Installations"
        title={
          <>
            Stade de la
            <br />
            <span className="text-accent">Tronchenaz</span>
          </>
        }
        intro={
          <p>
            La maison du Villeneuve-Sports : un terrain principal et un terrain annexe, au sein de la zone sportive communale de la Tronchenaz, à
            Villeneuve.
          </p>
        }
      >
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <ButtonLink href={mapLinks.directions} variant="accent">
            Itinéraire
          </ButtonLink>
          <ButtonLink href="#acces" variant="ghost-light" arrow={false}>
            <MapPin size={18} /> {address.street}
          </ButtonLink>
        </div>
      </PageHero>

      <section aria-labelledby="terrains" className="relative overflow-hidden bg-night py-16 text-white md:py-24">
        <div aria-hidden="true" className="pitch-lines absolute inset-0 opacity-40" />
        <div className="container-site relative">
          <SectionHeading id="terrains" tone="dark" eyebrow="Les terrains" title="Deux terrains, en gazon naturel" />
          <div className="mt-12">
            <PitchExplorer venues={venues} />
          </div>
        </div>
      </section>

      <section aria-labelledby="zone" className="on-light py-16 md:py-24">
        <div className="container-site grid gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading
              id="zone"
              eyebrow="Zone sportive"
              title={sportsZone.name}
              intro={<p>La commune présente la Tronchenaz comme un ensemble sportif complet, autour des terrains de football.</p>}
            />
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <VerificationBadge level={sportsZone.verification} />
              <SourceList ids={sportsZone.sources} />
            </div>
          </div>
          <div data-reveal>
            <ul className="grid gap-px overflow-hidden rounded-[4px] border border-line bg-line sm:grid-cols-2">
              {sportsZone.amenities.map((a) => (
                <li key={a} className="flex items-start gap-3 bg-card px-5 py-5">
                  <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rotate-45 bg-primary" />
                  {a}
                </li>
              ))}
            </ul>
            <div className="mt-6 rounded-[4px] border border-line bg-card p-6">
              <p className="eyebrow text-primary">À côté des terrains</p>
              <p className="display mt-1 text-[1.75rem]">{sportsZone.hall.name}</p>
              <p className="mt-1 text-muted">
                {sportsZone.hall.street}, 1844 Villeneuve · {sportsZone.hall.note}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="acces" aria-labelledby="acces-title" className="on-light scroll-mt-24 border-t border-line bg-paper-2 py-16 md:py-24">
        <div className="container-site grid gap-12 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <SectionHeading id="acces-title" eyebrow="Venir au stade" title="Accès & visiteurs" />
            <address className="mt-8 not-italic">
              <p className="display text-[2rem]">Stade de la Tronchenaz</p>
              <p className="mt-1 text-lg">
                {address.street}
                <br />
                {address.postcode} {address.city}
              </p>
            </address>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <VerificationBadge level={address.verification} />
              <SourceList ids={address.sources} />
            </div>
          </div>
          <div className="space-y-4" data-reveal>
            <ul className="grid gap-3 sm:grid-cols-2">
              {[
                { href: mapLinks.directions, label: "Itinéraire Google Maps" },
                { href: mapLinks.apple, label: "Plans (Apple)" },
                { href: mapLinks.osm, label: "OpenStreetMap" },
                { href: mapLinks.google, label: "Voir sur la carte" },
              ].map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-h-14 items-center justify-between gap-3 rounded-[4px] border border-line bg-card px-5 font-semibold transition-colors hover:border-primary hover:text-primary"
                  >
                    {l.label} <ArrowUpRight size={18} />
                    <span className="sr-only">(nouvelle fenêtre)</span>
                  </a>
                </li>
              ))}
            </ul>
            <Notice title="Informations visiteurs">
              Stationnement, transports publics, accessibilité en fauteuil roulant et buvette : ces informations n&apos;ont pas été publiées par le club
              ou la commune. Renseignez-vous auprès du club avant votre venue.
            </Notice>
          </div>
        </div>
      </section>

      <section aria-labelledby="debat" className="grain relative overflow-hidden bg-primary py-16 text-white md:py-24">
        <div className="container-site relative grid gap-12 lg:grid-cols-2">
          <SectionHeading id="debat" tone="dark" eyebrow="Le futur de la Tronchenaz" title={facilityIssues.title} intro={<p className="text-white/85">{facilityIssues.outlook}</p>} />
          <div data-reveal>
            <ul className="space-y-3">
              {facilityIssues.points.map((p) => (
                <li key={p} className="flex gap-4 rounded-[4px] bg-night/35 px-5 py-4 ring-1 ring-white/15">
                  <span aria-hidden="true" className="mt-2.5 h-1.5 w-1.5 shrink-0 rotate-45 bg-accent" />
                  {p}
                </li>
              ))}
            </ul>
            <SourceList ids={facilityIssues.sources} tone="dark" className="mt-5" />
          </div>
        </div>
      </section>
    </>
  );
}
