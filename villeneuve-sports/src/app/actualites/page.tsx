import type { Metadata } from "next";
import Link from "next/link";
import { NewsCard, NewsCover } from "@/components/news/news-card";
import { ArrowRight } from "@/components/ui/icons";
import { Notice, PageHero } from "@/components/ui/primitives";
import { sortedNews } from "@/content/news";
import { formatLongDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Actualités",
  description: "Résultats, vie du club, juniors et installations : l'actualité du Villeneuve-Sports, rédigée à partir de sources publiques.",
  alternates: { canonical: "/actualites" },
};

export default function NewsPage() {
  const [lead, ...rest] = sortedNews();
  return (
    <>
      <PageHero
        eyebrow="Actualités"
        title={
          <>
            La vie
            <br />
            <span className="text-accent">du club</span>
          </>
        }
        intro={<p>Récits de matchs, vie du club, juniors et installations. Chaque article cite les sources dont il est tiré.</p>}
      />
      <section className="on-light py-14 md:py-20">
        <div className="container-site">
          <Link
            href={`/actualites/${lead.slug}`}
            className="group grid overflow-hidden rounded-[4px] border border-line bg-card transition-[border-color,box-shadow] duration-300 hover:border-primary hover:shadow-[0_24px_60px_-30px_rgba(11,16,32,0.5)] lg:grid-cols-[1.3fr_1fr]"
          >
            <NewsCover article={lead} size="lg" />
            <div className="flex flex-col p-6 md:p-10">
              <p className="eyebrow text-primary">À la une</p>
              <time dateTime={lead.date} className="mt-3 text-[0.875rem] text-muted">
                {formatLongDate(lead.date)}
              </time>
              <h2 className="display mt-2 text-[clamp(2.25rem,4vw,3.5rem)]">{lead.title}</h2>
              <p className="mt-4 text-lg text-muted">{lead.excerpt}</p>
              <span className="mt-auto inline-flex items-center gap-2 pt-8 font-display text-[1.05rem] font-bold uppercase tracking-[0.08em] text-primary">
                Lire l&apos;article <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          </Link>
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {rest.map((a, i) => (
              <div key={a.slug} data-reveal style={{ "--reveal-i": i } as React.CSSProperties}>
                <NewsCard article={a} />
              </div>
            ))}
          </div>
          <div className="mt-14 max-w-3xl">
            <Notice title="Interviews et reportages photo">
              Aucune interview ni photo de match n&apos;a pu être reprise avec autorisation. Le club peut transmettre ses contenus pour publication.
            </Notice>
          </div>
        </div>
      </section>
    </>
  );
}
