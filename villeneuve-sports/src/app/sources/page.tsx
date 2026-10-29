import type { Metadata } from "next";
import { ArrowUpRight } from "@/components/ui/icons";
import { Notice, PageHero, SectionHeading } from "@/components/ui/primitives";
import { VerificationBadge, verificationHelp } from "@/components/ui/verification";
import { LAST_CHECKED, sources } from "@/content/sources";
import type { Source, Verification } from "@/content/types";
import { formatLongDate } from "@/lib/format";
import { pageUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Sources & vérification",
  description: "D'où viennent les informations publiées sur ce site, et comment elles ont été vérifiées.",
  alternates: { canonical: pageUrl("/sources") },
};

const kinds: Record<Source["kind"], string> = {
  "official-club": "Club",
  association: "ACVF / ASF",
  commune: "Commune de Villeneuve",
  press: "Presse",
  database: "Bases de données sportives",
};

export default function SourcesPage() {
  const groups = (Object.keys(kinds) as Source["kind"][]).map((k) => ({ kind: k, items: sources.filter((s) => s.kind === k) }));
  return (
    <>
      <PageHero
        eyebrow="Transparence"
        title={
          <>
            Sources &<br />
            <span className="text-accent">vérification</span>
          </>
        }
        intro={<p>Aucune information de ce site n&apos;est inventée. Voici d&apos;où elles viennent et comment lire leur niveau de fiabilité.</p>}
      />
      <section className="on-light py-16 md:py-24">
        <div className="container-site grid gap-14 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="space-y-8">
            <SectionHeading eyebrow="Méthode" title="Trois niveaux" />
            <ul className="space-y-4">
              {(["confirmed", "reported", "unconfirmed"] as Verification[]).map((v) => (
                <li key={v} className="rounded-[4px] border border-line bg-card p-5">
                  <VerificationBadge level={v} />
                  <p className="mt-2 text-[0.9375rem] text-muted">{verificationHelp(v)}</p>
                </li>
              ))}
            </ul>
            <Notice title="Dernière vérification">
              Les sources ont été consultées le {formatLongDate(LAST_CHECKED)}. Le logo officiel et les photos du club n&apos;ont pas pu être
              récupérés : ils seront ajoutés avec l&apos;accord du club.
            </Notice>
          </div>
          <div className="space-y-12">
            {groups.map((g) => (
              <div key={g.kind}>
                <h2 className="display text-[2rem]">{kinds[g.kind]}</h2>
                <ul className="mt-4 divide-y divide-line border-y border-line">
                  {g.items.map((s) => (
                    <li key={s.id}>
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex min-h-14 items-center justify-between gap-4 py-3 transition-colors hover:text-primary"
                      >
                        <span>
                          <span className="block font-semibold">{s.title}</span>
                          <span className="block text-[0.875rem] text-muted">
                            {s.publisher}
                            {s.publishedOn ? ` · publié le ${formatLongDate(s.publishedOn)}` : ""} · consulté le {formatLongDate(s.checkedOn)}
                          </span>
                        </span>
                        <ArrowUpRight size={18} className="shrink-0" />
                        <span className="sr-only">(nouvelle fenêtre)</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
