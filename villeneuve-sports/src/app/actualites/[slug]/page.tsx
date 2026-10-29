import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { NewsCard, NewsCover } from "@/components/news/news-card";
import { ShareButtons } from "@/components/news/share";
import { ArrowRight } from "@/components/ui/icons";
import { CheckedOn, VerificationBadge } from "@/components/ui/verification";
import { getArticle, news, sortedNews } from "@/content/news";
import { getSource, LAST_CHECKED } from "@/content/sources";
import { getTeam } from "@/content/teams";
import { formatLongDate } from "@/lib/format";
import { siteUrl } from "@/lib/site";

export function generateStaticParams() {
  return news.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: PageProps<"/actualites/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const a = getArticle(slug);
  if (!a) return {};
  return {
    title: a.title,
    description: a.excerpt,
    alternates: { canonical: `/actualites/${a.slug}` },
    openGraph: { type: "article", title: a.title, description: a.excerpt, publishedTime: a.date },
  };
}

export default async function ArticlePage({ params }: PageProps<"/actualites/[slug]">) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();
  const related = sortedNews()
    .filter((a) => a.slug !== article.slug)
    .slice(0, 3);
  const linkedTeams = (article.teamSlugs ?? []).map((s) => getTeam(s)).filter((t) => t !== undefined);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.excerpt,
    datePublished: article.date,
    inLanguage: "fr-CH",
    mainEntityOfPage: `${siteUrl}/actualites/${article.slug}`,
    publisher: { "@type": "SportsOrganization", name: "Villeneuve-Sports" },
    isBasedOn: article.sources.map((id) => getSource(id).url),
  };

  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <header className="bg-night pt-[var(--header-h)] text-white">
        <NewsCover article={article} size="lg" />
      </header>
      <div className="on-light">
        <div className="container-site max-w-3xl py-12 md:py-16">
          <nav aria-label="Fil d'Ariane" className="text-[0.875rem] text-muted">
            <Link href="/actualites" className="hover:text-primary">
              Actualités
            </Link>{" "}
            / {article.category}
          </nav>
          <h1 className="display mt-5 text-[clamp(2.6rem,6vw,4.75rem)]">{article.title}</h1>
          <div className="mt-5 flex flex-wrap items-center gap-3 text-[0.9375rem] text-muted">
            <time dateTime={article.date}>{formatLongDate(article.date)}</time>
            <span aria-hidden="true">·</span>
            <VerificationBadge level={article.verification} />
          </div>
          <p className="mt-8 text-xl leading-relaxed text-ink">{article.excerpt}</p>
          <div className="prose-club mt-8 text-[1.0625rem] leading-[1.75]">
            {article.body.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          {article.quotes?.map((q) => (
            <figure key={q.text} className="mt-10 border-l-4 border-accent bg-card px-6 py-5">
              <blockquote className="font-display text-[1.6rem] font-semibold leading-tight">« {q.text} »</blockquote>
              <figcaption className="mt-3 text-[0.875rem] text-muted">
                — {getSource(q.source).publisher}, « {getSource(q.source).title} »
              </figcaption>
            </figure>
          ))}

          <div className="mt-12 rounded-[4px] border border-line bg-card p-6">
            <p className="eyebrow text-primary">Sources de cet article</p>
            <ul className="mt-3 space-y-2">
              {article.sources.map((id) => {
                const s = getSource(id);
                return (
                  <li key={id}>
                    <a href={s.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-ink underline underline-offset-4 hover:text-primary">
                      {s.publisher} — {s.title}
                    </a>
                    {s.publishedOn && <span className="text-[0.875rem] text-muted"> · {formatLongDate(s.publishedOn)}</span>}
                  </li>
                );
              })}
            </ul>
            <p className="mt-3 text-[0.875rem] text-muted">Article rédigé pour ce site à partir de ces sources ; les citations sont reproduites mot pour mot.</p>
            <div className="mt-2">
              <CheckedOn date={LAST_CHECKED} />
            </div>
          </div>

          {linkedTeams.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-3">
              {linkedTeams.map((t) => (
                <Link key={t.slug} href={`/equipes/${t.slug}`} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 font-semibold text-white transition-colors hover:bg-night">
                  {t.shortName} <ArrowRight size={16} />
                </Link>
              ))}
            </div>
          )}

          <div className="mt-10 border-t border-line pt-8">
            <ShareButtons title={article.title} path={`/actualites/${article.slug}`} />
          </div>
        </div>
      </div>

      <aside aria-labelledby="a-lire" className="on-light border-t border-line bg-paper-2 py-14">
        <div className="container-site">
          <h2 id="a-lire" className="display text-[2.25rem]">
            À lire aussi
          </h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {related.map((a) => (
              <NewsCard key={a.slug} article={a} />
            ))}
          </div>
        </div>
      </aside>
    </article>
  );
}
