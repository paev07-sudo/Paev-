import Link from "next/link";
import { ViewTransition } from "react";
import type { Team } from "@/content/types";
import { audienceLabels, sections } from "@/content/teams";
import { ArrowRight } from "@/components/ui/icons";
import { VerificationBadge } from "@/components/ui/verification";

/** Large typographic monogram used instead of team photos until the club supplies them. */
export function teamMark(team: Team): string {
  if (team.section === "actifs") return team.slug === "premiere-equipe" ? "I" : "II";
  for (const pattern of [/FF-\d+/, /D-\d+/, /\d+\+/, /Juniors ([A-G])/]) {
    const m = team.category.match(pattern);
    if (m) return m[1] ?? m[0];
  }
  return team.shortName.slice(0, 2);
}

export function TeamCard({ team, tone = "light" }: { team: Team; tone?: "light" | "dark" }) {
  const section = sections.find((s) => s.id === team.section);
  const dark = tone === "dark";
  return (
    <Link
      href={`/equipes/${team.slug}`}
      className={`group relative flex h-full flex-col overflow-hidden rounded-[4px] border transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-1 ${
        dark
          ? "border-line-dark bg-navy text-white hover:border-accent"
          : "on-light border-line bg-card text-ink hover:border-primary hover:shadow-[0_18px_40px_-24px_rgba(11,16,32,0.45)]"
      }`}
    >
      <div className={`relative h-36 overflow-hidden ${team.audience === "filles" ? "bg-primary" : dark ? "bg-night" : "bg-night"}`}>
        <div aria-hidden="true" className="pitch-lines absolute inset-0 opacity-70" />
        <div aria-hidden="true" className="absolute -right-6 -top-10 h-40 w-40 rounded-full border border-white/10" />
        <ViewTransition name={`team-mark-${team.slug}`}>
          <span
            aria-hidden="true"
            className="display absolute bottom-[-0.12em] left-4 text-[6.5rem] leading-none text-white/95 transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:-translate-y-1"
          >
            {teamMark(team)}
          </span>
        </ViewTransition>
        <span className="eyebrow absolute right-4 top-4 rounded-[2px] bg-accent px-2 py-1 text-[0.6875rem] text-night">{section?.label}</span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-2">
          <VerificationBadge level={team.verification} tone={tone} />
          <span className={`text-[0.8125rem] ${dark ? "text-muted-dark" : "text-muted"}`}>{audienceLabels[team.audience]}</span>
        </div>
        <h3 className="display mt-4 text-[1.85rem]">{team.shortName}</h3>
        <p className={`mt-1 text-[0.9375rem] font-medium ${dark ? "text-accent" : "text-primary"}`}>{team.competition ?? "Compétition à confirmer"}</p>
        <p className={`mt-3 line-clamp-3 text-[0.9375rem] ${dark ? "text-muted-dark" : "text-muted"}`}>{team.summary}</p>
        <span className={`mt-auto inline-flex items-center gap-2 pt-5 font-display text-[0.95rem] font-bold uppercase tracking-[0.08em] ${dark ? "text-white" : "text-ink"}`}>
          Fiche équipe <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}
