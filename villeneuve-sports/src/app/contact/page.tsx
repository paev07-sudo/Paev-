import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "@/components/forms/forms";
import { ArrowUpRight, Facebook, Globe, Mail, MapPin } from "@/components/ui/icons";
import { PageHero, SectionHeading } from "@/components/ui/primitives";
import { SourceList, VerificationBadge } from "@/components/ui/verification";
import { club, people } from "@/content/club";
import { address, mapLinks } from "@/content/venue";
import { pageUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contacter le Villeneuve-Sports : e-mail, adresse postale, stade de la Tronchenaz et réseaux sociaux.",
  alternates: { canonical: pageUrl("/contact") },
};

export default function ContactPage() {
  const president = people.find((p) => p.role === "Président");
  const cards = [
    {
      icon: <Mail size={22} />,
      title: "E-mail du club",
      body: (
        <a href={`mailto:${club.contact.email}`} className="break-all font-semibold text-primary underline underline-offset-4">
          {club.contact.email}
        </a>
      ),
      note: "Pour toute demande : inscriptions, équipes, partenariats.",
    },
    {
      icon: <MapPin size={22} />,
      title: "Adresse postale",
      body: (
        <address className="not-italic">
          {club.contact.postal.map((l) => (
            <span key={l} className="block">
              {l}
            </span>
          ))}
        </address>
      ),
      note: "Courrier uniquement : ce n'est pas l'adresse du stade.",
    },
    {
      icon: <MapPin size={22} />,
      title: "Stade de la Tronchenaz",
      body: (
        <a href={mapLinks.directions} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary underline underline-offset-4">
          {address.street}, {address.postcode} {address.city}
          <span className="sr-only"> (itinéraire, nouvelle fenêtre)</span>
        </a>
      ),
      note: "Le terrain des matchs à domicile.",
    },
  ];
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title={
          <>
            Parlons
            <br />
            <span className="text-accent">football</span>
          </>
        }
        intro={<p>Une question sur une équipe, une inscription ou un partenariat ? Le club répond à son adresse e-mail.</p>}
      />

      <section className="on-light py-16 md:py-24">
        <div className="container-site">
          <div className="grid gap-5 md:grid-cols-3">
            {cards.map((c, i) => (
              <div key={c.title} className="flex flex-col rounded-[4px] border border-line bg-card p-6" data-reveal style={{ "--reveal-i": i } as React.CSSProperties}>
                <span className="text-primary">{c.icon}</span>
                <h2 className="eyebrow mt-4 text-muted">{c.title}</h2>
                <div className="mt-2 text-lg">{c.body}</div>
                <p className="mt-auto pt-4 text-[0.875rem] text-muted">{c.note}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <VerificationBadge level={club.contact.verification as "confirmed"} />
            <SourceList ids={[...club.contact.sources]} />
          </div>

          <div className="mt-16 grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="space-y-10">
              <SectionHeading id="ecrire" eyebrow="Formulaire" title="Écrire au club" />
              {president && (
                <div>
                  <p className="eyebrow text-primary">Présidence</p>
                  <p className="display mt-1 text-[1.75rem]">{president.name}</p>
                  <p className="mt-1 text-[0.9375rem] text-muted">
                    Coordonnées directes sur la{" "}
                    <a href={club.contact.committeePage} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary underline underline-offset-4">
                      page du comité
                    </a>{" "}
                    du site officiel.
                  </p>
                </div>
              )}
              <div>
                <p className="eyebrow text-primary">En ligne</p>
                <ul className="mt-3 space-y-2">
                  <li>
                    <a href={club.contact.facebook} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-3 font-semibold hover:text-primary">
                      <Facebook size={20} /> FC Villeneuve Sports Officiel <ArrowUpRight size={14} />
                      <span className="sr-only">(Facebook, nouvelle fenêtre)</span>
                    </a>
                  </li>
                  <li>
                    <a href={club.contact.website} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-3 font-semibold hover:text-primary">
                      <Globe size={20} /> villeneuvesports.ch <ArrowUpRight size={14} />
                      <span className="sr-only">(nouvelle fenêtre)</span>
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <p className="eyebrow text-primary">Par sujet</p>
                <ul className="mt-3 space-y-2 text-[0.9375rem]">
                  <li>
                    Inscription d&apos;un joueur :{" "}
                    <Link href="/rejoindre" className="font-semibold text-primary underline underline-offset-4">
                      page Rejoindre
                    </Link>
                  </li>
                  <li>
                    Partenariat :{" "}
                    <Link href="/partenaires#proposition" className="font-semibold text-primary underline underline-offset-4">
                      page Partenaires
                    </Link>
                  </li>
                  <li>Contacts par équipe : non publiés, passer par l&apos;adresse du club.</li>
                </ul>
              </div>
            </div>
            <div className="rounded-[4px] border border-line bg-card p-6 md:p-10">
              <ContactForm />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
