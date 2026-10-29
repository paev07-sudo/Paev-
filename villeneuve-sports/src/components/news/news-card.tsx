import Link from "next/link";
import type { NewsArticle } from "@/content/types";
import { formatLongDate } from "@/lib/format";
import { ArrowRight } from "@/components/ui/icons";

const coverTone: Record<NewsArticle["category"], string> = {
  Résultats: "bg-primary",
  Club: "bg-night",
  Juniors: "bg-[#12204a]",
  Installations: "bg-night",
  Agenda: "bg-[#0e2a6e]",
};

/** Typographic cover: no photo is available, so the kicker is the image. */
export function NewsCover({ article, size = "md" }: { article: NewsArticle; size?: "md" | "lg" }) {
  return (
    <div className={`relative overflow-hidden ${coverTone[article.category]} ${size === "lg" ? "aspect-[16/9] md:aspect-[21/9]" : "aspect-[16/10]"}`}>
      <div aria-hidden="true" className="pitch-lines absolute inset-0 opacity-80" />
      <div aria-hidden="true" className="absolute -bottom-1/3 -right-[12%] aspect-square w-[70%] rounded-full border border-white/10" />
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1 bg-[linear-gradient(90deg,var(--color-primary-bright)_0_50%,var(--color-accent)_50%_100%)]" />
      <span
        aria-hidden="true"
        className={`display absolute bottom-3 left-5 right-5 leading-[0.85] text-white/95 ${size === "lg" ? "text-[clamp(3rem,9vw,8rem)]" : "text-[clamp(2.5rem,5vw,3.6rem)]"}`}
      >
        {article.kicker}
      </span>
      <span className="eyebrow absolute left-5 top-5 rounded-[2px] bg-accent px-2 py-1 text-[0.6875rem] text-night">{article.category}</span>
    </div>
  );
}

export function NewsCard({ article, featured = false }: { article: NewsArticle; featured?: boolean }) {
  return (
    <Link
      href={`/actualites/${article.slug}`}
      className="on-light group flex h-full flex-col overflow-hidden rounded-[4px] border border-line bg-card transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-1 hover:border-primary hover:shadow-[0_18px_40px_-24px_rgba(11,16,32,0.45)]"
    >
      <NewsCover article={article} />
      <div className="flex flex-1 flex-col p-6">
        <time dateTime={article.date} className="text-[0.8125rem] font-medium text-muted">
          {formatLongDate(article.date)}
        </time>
        <h3 className={`mt-2 font-display font-bold uppercase leading-[1.02] text-ink ${featured ? "text-[1.9rem]" : "text-[1.6rem]"}`}>{article.title}</h3>
        <p className="mt-3 line-clamp-3 text-[0.9375rem] text-muted">{article.excerpt}</p>
        <span className="mt-auto inline-flex items-center gap-2 pt-5 font-display text-[0.95rem] font-bold uppercase tracking-[0.08em] text-primary">
          Lire <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}
