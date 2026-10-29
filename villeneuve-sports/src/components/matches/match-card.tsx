import Link from "next/link";
import type { Match } from "@/content/types";
import { outcome } from "@/content/matches";
import { dayParts, formatLongDate } from "@/lib/format";
import { Clock, MapPin } from "@/components/ui/icons";
import { VerificationBadge } from "@/components/ui/verification";

const outcomeStyle = {
  V: { text: "Victoire", cls: "bg-success text-white" },
  N: { text: "Nul", cls: "bg-muted text-white" },
  D: { text: "Défaite", cls: "bg-danger text-white" },
};

function venueLabel(match: Match) {
  if (match.format === "tournoi") return "Tournoi";
  if (match.villeneuveAtHome === true) return "Domicile";
  if (match.villeneuveAtHome === false) return "Extérieur";
  return "Lieu non précisé";
}

function Row({ name, ours, goals, winner }: { name: string; ours: boolean; goals?: number; winner: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className={`min-w-0 font-display text-[1.3rem] font-bold uppercase leading-tight ${ours ? "text-white" : "text-white/70"}`}>
        {ours && <span aria-hidden="true" className="mr-2 inline-block h-2 w-2 -translate-y-0.5 rotate-45 bg-accent" />}
        {name}
      </span>
      {goals !== undefined && (
        <span className={`display shrink-0 text-[2rem] tabular-nums ${winner ? "text-white" : "text-white/55"}`}>{goals}</span>
      )}
    </div>
  );
}

/** Dark scoreboard-style match card (match center, home, team pages). */
export function MatchCard({ match, linked = true, passed = false }: { match: Match; linked?: boolean; passed?: boolean }) {
  const d = dayParts(match.date);
  const res = outcome(match);
  const s = match.score;
  const body = (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-[4px] border border-line-dark bg-navy transition-[border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-primary-bright">
      <div className="flex items-center gap-4 border-b border-line-dark px-5 py-4">
        <time dateTime={match.date} className="flex shrink-0 flex-col items-center leading-none">
          <span className="display text-[2.25rem] text-accent">{d.day}</span>
          <span className="eyebrow mt-1 text-[0.625rem] text-muted-dark">
            {d.weekday} {d.month}
          </span>
        </time>
        <div className="min-w-0">
          <p className="text-[0.9375rem] font-semibold leading-snug text-white">{match.competition}</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-[0.8125rem] text-muted-dark">
            {venueLabel(match)}
            {match.time && (
              <>
                <span aria-hidden="true">·</span>
                <Clock size={13} /> {match.time}
              </>
            )}
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 px-5 py-5">
        {match.format === "tournoi" ? (
          <>
            <p className="font-display text-[1.6rem] font-bold uppercase leading-tight text-white">{match.home.name}</p>
            <p className="text-[0.9375rem] text-muted-dark">{match.summary}</p>
          </>
        ) : (
          <>
            <Row name={match.home.name} ours={Boolean(match.home.teamSlug)} goals={s?.home} winner={!!s && s.home >= s.away} />
            <Row name={match.away.name} ours={Boolean(match.away.teamSlug)} goals={s?.away} winner={!!s && s.away >= s.home} />
            {!s && (
              <p className="mt-1 text-[0.875rem] text-muted-dark">
                {match.status === "scheduled" && !passed ? "À venir" : "Score non vérifié"}
              </p>
            )}
          </>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-line-dark px-5 py-3.5 text-[0.8125rem] text-muted-dark">
        {res && <span className={`rounded-[2px] px-2 py-0.5 text-[0.75rem] font-semibold ${outcomeStyle[res].cls}`}>{outcomeStyle[res].text}</span>}
        {match.status === "scheduled" && passed && <span className="rounded-[2px] bg-white/10 px-2 py-0.5 text-[0.75rem] font-semibold text-white">Passé</span>}
        {match.venue && (
          <span className="inline-flex items-center gap-1.5">
            <MapPin size={14} /> {match.venue}
          </span>
        )}
        <span className="ml-auto">
          <VerificationBadge level={match.verification} tone="dark" />
        </span>
      </div>
    </article>
  );
  if (!linked) return body;
  const label =
    match.format === "tournoi"
      ? `${match.home.name}, ${formatLongDate(match.date)}`
      : `${match.home.name} contre ${match.away.name}${s ? `, ${s.home} à ${s.away}` : ""}, ${formatLongDate(match.date)}`;
  return (
    <Link href={`/matchs/${match.id}`} className="block h-full rounded-[4px]" aria-label={label}>
      {body}
    </Link>
  );
}
