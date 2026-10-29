import NextLink from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { ArrowRight } from "./icons";

type Variant = "accent" | "primary" | "ghost-light" | "ghost-dark";

const variants: Record<Variant, string> = {
  accent: "bg-accent text-night hover:bg-white",
  primary: "bg-primary text-white hover:bg-night",
  "ghost-light": "border border-white/30 text-white hover:border-accent hover:text-accent",
  "ghost-dark": "border border-ink/20 text-ink hover:border-primary hover:text-primary",
};

const base =
  "group inline-flex min-h-12 items-center justify-center gap-2.5 rounded-[3px] px-6 font-display text-[1.0625rem] font-bold uppercase tracking-[0.06em] transition-[background-color,color,border-color,transform] duration-200 ease-out active:scale-[0.98] cursor-pointer";

export function ButtonLink({
  href,
  children,
  variant = "accent",
  arrow = true,
  className = "",
  ...rest
}: { href: string; children: ReactNode; variant?: Variant; arrow?: boolean; className?: string } & Omit<
  ComponentProps<typeof NextLink>,
  "href" | "className" | "children"
>) {
  const external = /^(https?:|mailto:|tel:)/.test(href);
  const content = (
    <>
      {children}
      {arrow && <ArrowRight size={18} className="transition-transform duration-200 group-hover:translate-x-1" />}
    </>
  );
  if (external) {
    return (
      <a href={href} className={`${base} ${variants[variant]} ${className}`} {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
        {content}
      </a>
    );
  }
  return (
    <NextLink href={href} className={`${base} ${variants[variant]} ${className}`} {...rest}>
      {content}
    </NextLink>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  intro,
  tone = "light",
  align = "left",
  id,
  as: Tag = "h2",
}: {
  eyebrow?: string;
  title: ReactNode;
  intro?: ReactNode;
  tone?: "light" | "dark";
  align?: "left" | "center";
  id?: string;
  as?: "h1" | "h2" | "h3";
}) {
  return (
    <div className={`max-w-3xl ${align === "center" ? "mx-auto text-center" : ""}`} data-reveal>
      {eyebrow && (
        <p className={`eyebrow mb-4 flex items-center gap-3 ${align === "center" ? "justify-center" : ""} ${tone === "dark" ? "text-accent" : "text-primary"}`}>
          <span aria-hidden="true" className={`h-px w-8 ${tone === "dark" ? "bg-accent" : "bg-primary"}`} />
          {eyebrow}
        </p>
      )}
      <Tag id={id} className={`display text-[clamp(2.4rem,5.5vw,4.5rem)] ${tone === "dark" ? "text-white" : "text-ink"}`}>
        {title}
      </Tag>
      {intro && <div className={`mt-5 max-w-2xl text-lg ${align === "center" ? "mx-auto" : ""} ${tone === "dark" ? "text-muted-dark" : "text-muted"}`}>{intro}</div>}
    </div>
  );
}

/** Dark header used by every inner page. */
export function PageHero({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  intro?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="grain relative overflow-hidden bg-night pb-14 pt-[calc(var(--header-h)+3.5rem)] text-white md:pb-20 md:pt-[calc(var(--header-h)+5rem)]">
      <div aria-hidden="true" className="pitch-lines absolute inset-0 opacity-60 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
      <div aria-hidden="true" className="absolute -right-24 top-1/2 h-[34rem] w-[34rem] -translate-y-1/2 rounded-full border border-white/[0.07]" />
      <div aria-hidden="true" className="absolute -right-24 top-1/2 h-2 w-2 -translate-y-1/2 translate-x-[17rem] rounded-full bg-accent/70" />
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1 bg-[linear-gradient(90deg,var(--color-primary-bright)_0_50%,var(--color-accent)_50%_100%)]" />
      <div className="container-site relative">
        <p className="eyebrow mb-5 flex items-center gap-3 text-accent">
          <span aria-hidden="true" className="h-px w-8 bg-accent" />
          {eyebrow}
        </p>
        <h1 className="display max-w-5xl text-[clamp(3rem,9vw,7.5rem)]">{title}</h1>
        {intro && <div className="mt-6 max-w-2xl text-lg text-muted-dark md:text-xl">{intro}</div>}
        {children}
      </div>
    </header>
  );
}

export function Notice({ children, tone = "light", title }: { children: ReactNode; tone?: "light" | "dark"; title?: string }) {
  return (
    <div
      className={`rounded-[4px] border-l-4 px-5 py-4 text-[0.9375rem] ${
        tone === "dark" ? "border-accent bg-white/[0.04] text-muted-dark" : "border-primary bg-card text-muted"
      }`}
    >
      {title && <p className={`mb-1 font-semibold ${tone === "dark" ? "text-white" : "text-ink"}`}>{title}</p>}
      {children}
    </div>
  );
}
