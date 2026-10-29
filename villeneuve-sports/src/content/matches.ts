import type { Match, Standing } from "./types";

/**
 * Matches that could be checked in public sources. This is not a live feed:
 * fixtures for 2026/27 change every week and are published on the ACVF match
 * center, which this build environment could not read in full. Connect the
 * official data in `src/lib/data-source.ts` to replace this file.
 */
export const matches: Match[] = [
  {
    id: "2026-05-24-aigle-ii",
    date: "2026-05-24",
    competition: "4e ligue — Groupe 6",
    home: { name: "Villeneuve-Sports I", teamSlug: "premiere-equipe" },
    away: { name: "FC Aigle II" },
    villeneuveAtHome: null,
    venue: null,
    score: { home: 2, away: 0 },
    status: "played",
    summary:
      "La victoire du titre, à deux journées de la fin. Sur une touche jouée rapidement, Kenan Duric déborde et centre au second poteau : Ukaash Mohamed ouvre le score à la 16e minute. Villeneuve scelle la rencontre à la 80e.",
    verification: "confirmed",
    sources: ["footromand-champion"],
    note: "La source cite les deux équipes sans préciser le lieu du match : l'ordre affiché ne signifie pas domicile/extérieur.",
  },
  {
    id: "2026-06-17-lausanne-nord-ii",
    date: "2026-06-17",
    competition: "4e ligue — Barrages de promotion",
    home: { name: "Lausanne Nord Academy II" },
    away: { name: "Villeneuve-Sports I", teamSlug: "premiere-equipe" },
    villeneuveAtHome: false,
    venue: null,
    score: { home: 2, away: 1 },
    status: "played",
    verification: "reported",
    sources: ["acvf-club"],
  },
  {
    id: "2026-06-21-bursins-rolle-perroy-ii",
    date: "2026-06-21",
    time: "15:30",
    competition: "4e ligue — Barrages de promotion",
    home: { name: "Villeneuve-Sports I", teamSlug: "premiere-equipe" },
    away: { name: "FC Bursins-Rolle-Perroy II" },
    villeneuveAtHome: true,
    venue: "Stade de la Tronchenaz",
    status: "played",
    verification: "reported",
    sources: ["acvf-matchcenter", "acvf-club"],
    note: "Rencontre au programme du match center. Le score n'a pas pu être lu de façon fiable : il n'est pas affiché.",
  },
  {
    id: "2026-09-06-pully-ii",
    date: "2026-09-06",
    competition: "3e ligue — Groupe 2",
    home: { name: "Pully Football II" },
    away: { name: "Villeneuve-Sports I", teamSlug: "premiere-equipe" },
    villeneuveAtHome: false,
    venue: null,
    score: { home: 5, away: 1 },
    status: "played",
    verification: "reported",
    sources: ["footstats-3e"],
  },
  {
    id: "2026-10-31-tournoi-pmf-f",
    date: "2026-10-31",
    time: "10:00",
    competition: "Tournoi BRACK.CH PmF — Juniors F",
    round: "ACVF, saison 2026/27",
    home: { name: "Tournoi Juniors F", teamSlug: "juniors-f" },
    away: { name: "Équipes de la catégorie F" },
    format: "tournoi",
    villeneuveAtHome: true,
    venue: "Stade de la Tronchenaz",
    status: "scheduled",
    summary: "Tournoi de football des enfants (10:00–12:00) inscrit au calendrier des tournois ACVF, au stade de la Tronchenaz.",
    verification: "reported",
    sources: ["acvf-tournois"],
    note: "La participation exacte des équipes de Villeneuve-Sports n'est pas détaillée dans la source.",
  },
];

export const standings: Standing[] = [
  {
    id: "4e-ligue-g6-2025-26",
    competition: "4e ligue — Groupe 6",
    season: "2025/26",
    teamSlug: "premiere-equipe",
    snapshot: "Juin 2026 (22 matchs joués)",
    partial: true,
    rows: [
      { position: 1, team: "Villeneuve-Sports I", isVilleneuve: true, played: 22, won: 18, drawn: 3, lost: 1, goalsFor: 85, goalsAgainst: 13, points: 57 },
      { position: 2, team: "FC Aigle II", played: 22, won: 18, drawn: 2, lost: 2, goalsFor: 69, goalsAgainst: 28, points: 50, note: "Points de pénalité déduits" },
    ],
    verification: "confirmed",
    sources: ["acvf-club", "footromand-champion"],
    note: "Extrait : seules les deux premières lignes ont pu être vérifiées.",
  },
  {
    id: "3e-ligue-g2-2026-27",
    competition: "3e ligue — Groupe 2",
    season: "2026/27",
    teamSlug: "premiere-equipe",
    snapshot: "Début septembre 2026 (3 matchs joués)",
    partial: true,
    rows: [
      { position: 10, team: "Villeneuve-Sports", isVilleneuve: true, played: 3, won: 1, drawn: 0, lost: 2, goalsFor: 8, goalsAgainst: 9, points: 3 },
    ],
    verification: "reported",
    sources: ["footstats-3e"],
    note: "Instantané ancien : le classement à jour est publié sur le match center ACVF.",
  },
];

export function getMatch(id: string): Match | undefined {
  return matches.find((m) => m.id === id);
}

export function matchesForTeam(slug: string): Match[] {
  return matches.filter((m) => m.home.teamSlug === slug || m.away.teamSlug === slug);
}

/** Result from Villeneuve-Sports' point of view, when it can be computed. */
export function outcome(match: Match): "V" | "N" | "D" | null {
  if (!match.score) return null;
  const oursHome = match.home.teamSlug !== undefined;
  const oursAway = match.away.teamSlug !== undefined;
  if (oursHome === oursAway) return null;
  const us = oursHome ? match.score.home : match.score.away;
  const them = oursHome ? match.score.away : match.score.home;
  return us > them ? "V" : us < them ? "D" : "N";
}
