import { matches, standings } from "@/content/matches";
import { teams } from "@/content/teams";
import type { Match, Standing, Team } from "@/content/types";

/**
 * Integration point for official competition data.
 *
 * Today the site reads the checked snapshot in `src/content/*` (static data).
 * The ACVF publishes fixtures, results and tables in its match center
 * (matchcenter-acvf.football.ch, club id v=1142). Clubs can also export their
 * data from Clubcorner / FOOT Gestion, which the club website already uses.
 *
 * To go live:
 * 1. Implement `ClubDataSource` with the feed the club is allowed to use
 *    (an export, an authorised API, or a scheduled import).
 * 2. Map the feed onto the types in `src/content/types.ts`. Keep
 *    `verification: "confirmed"` and a source id for official data.
 * 3. Return it from `getDataSource()`. Pages already call the async methods,
 *    so no page code changes.
 * 4. Set `DATA_SOURCE_LABEL` so the match center shows where the data comes from.
 *
 * Never fill the interface with guessed scores: if the feed fails, return the
 * static snapshot and keep its check date.
 */
export interface ClubDataSource {
  readonly label: string;
  /** ISO date of the last successful update. */
  readonly updatedOn: string;
  getTeams(): Promise<Team[]>;
  getMatches(): Promise<Match[]>;
  getStandings(): Promise<Standing[]>;
}

export const staticSnapshot: ClubDataSource = {
  label: "Relevé manuel des sources publiques",
  updatedOn: "2026-10-29",
  async getTeams() {
    return teams;
  },
  async getMatches() {
    return [...matches].sort((a, b) => a.date.localeCompare(b.date));
  },
  async getStandings() {
    return standings;
  },
};

export function getDataSource(): ClubDataSource {
  return staticSnapshot;
}
