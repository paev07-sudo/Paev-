"use client";

import { useId, useMemo, useState, type ReactNode } from "react";
import type { Match, Team } from "@/content/types";

/**
 * Team filter for the match center. Cards are rendered on the server and
 * passed in as `cards`, keyed by match id, so this component only decides
 * which ones are visible.
 */
export function MatchCenterFilter({
  matches,
  teams,
  cards,
  today,
}: {
  matches: Pick<Match, "id" | "home" | "away" | "status" | "date">[];
  teams: Pick<Team, "slug" | "shortName">[];
  cards: Record<string, ReactNode>;
  today: ReactNode;
}) {
  const [team, setTeam] = useState("all");
  const [tab, setTab] = useState<"results" | "upcoming">("results");
  const selectId = useId();

  const filtered = useMemo(
    () => matches.filter((m) => team === "all" || m.home.teamSlug === team || m.away.teamSlug === team),
    [matches, team],
  );
  const upcoming = filtered.filter((m) => m.status === "scheduled").sort((a, b) => a.date.localeCompare(b.date));
  const results = filtered.filter((m) => m.status === "played").sort((a, b) => b.date.localeCompare(a.date));
  const list = tab === "results" ? results : upcoming;
  const teamsWithMatches = teams.filter((t) => matches.some((m) => m.home.teamSlug === t.slug || m.away.teamSlug === t.slug));

  return (
    <div>
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div role="tablist" aria-label="Type de rencontres" className="inline-flex rounded-[4px] border border-line-dark bg-navy p-1">
          {(
            [
              ["results", `Résultats (${results.length})`],
              ["upcoming", `À venir (${upcoming.length})`],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              id={`tab-${id}`}
              aria-selected={tab === id}
              aria-controls="match-panel"
              onClick={() => setTab(id)}
              className={`min-h-11 rounded-[3px] px-5 font-display text-[1rem] font-bold uppercase tracking-[0.06em] transition-colors ${
                tab === id ? "bg-accent text-night" : "text-white/80 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div>
          <label htmlFor={selectId} className="eyebrow mb-2 block text-muted-dark">
            Filtrer par équipe
          </label>
          <select
            id={selectId}
            value={team}
            onChange={(e) => setTeam(e.target.value)}
            className="h-12 min-w-64 rounded-[3px] border border-line-dark bg-navy px-4 text-base text-white outline-none focus:border-accent"
          >
            <option value="all">Toutes les équipes</option>
            {teamsWithMatches.map((t) => (
              <option key={t.slug} value={t.slug}>
                {t.shortName}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div id="match-panel" role="tabpanel" aria-labelledby={`tab-${tab}`} className="mt-8">
        {list.length === 0 ? (
          <div className="rounded-[4px] border border-dashed border-line-dark px-6 py-12 text-center">
            <p className="display text-[2rem] text-white">{tab === "upcoming" ? "Aucune rencontre à venir vérifiée" : "Aucun résultat vérifié"}</p>
            <p className="mx-auto mt-2 max-w-lg text-muted-dark">
              Le calendrier officiel de chaque équipe est publié chaque semaine sur le match center de l&apos;ACVF.
            </p>
          </div>
        ) : (
          <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {list.map((m) => (
              <li key={m.id}>{cards[m.id]}</li>
            ))}
          </ul>
        )}
        {tab === "upcoming" && <div className="mt-6">{today}</div>}
      </div>
    </div>
  );
}
