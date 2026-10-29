/**
 * Content model for Villeneuve-Sports.
 *
 * Every published fact carries a `verification` level and references into
 * `sources.ts`. The UI shows both, so a visitor can always see where a fact
 * comes from and how sure we are about it. See docs/club-research.md.
 */

export type Verification = "confirmed" | "reported" | "unconfirmed";

/** ISO date (YYYY-MM-DD). */
export type IsoDate = string;

export interface Source {
  id: string;
  title: string;
  publisher: string;
  url: string;
  /** Date the content was checked for this project. */
  checkedOn: IsoDate;
  /** Publication date when known. */
  publishedOn?: IsoDate;
  kind: "official-club" | "association" | "commune" | "press" | "database";
}

export interface Sourced {
  verification: Verification;
  sources: string[];
  note?: string;
}

export type TeamSection =
  | "actifs"
  | "seniors"
  | "juniors"
  | "juniores"
  | "enfants";

export type TeamAudience = "hommes" | "filles" | "juniors" | "ouvert";

export interface Person {
  name: string;
  role: string;
}

export interface Team extends Sourced {
  slug: string;
  name: string;
  /** Short label used on cards and in the ticker. */
  shortName: string;
  section: TeamSection;
  audience: TeamAudience;
  /** Official ASF/ACVF category label, e.g. "Juniors D-7". */
  category: string;
  /** League / level / group for the current season, if known. */
  competition: string | null;
  competitionType: "championnat" | "tournois" | "inconnu";
  season: string;
  /** Sort key inside a section (lower first). */
  order: number;
  summary: string;
  staff: Person[];
  training: { day: string; time: string; place: string }[];
  /** Recruitment status as published by the club; null = not published. */
  recruitment: string | null;
  photo: Media | null;
}

export interface Media {
  src: string;
  width: number;
  height: number;
  alt: string;
  credit: string;
}

export interface MatchSide {
  name: string;
  /** Slug of the Villeneuve-Sports team when this side is ours. */
  teamSlug?: string;
}

export interface Match extends Sourced {
  id: string;
  date: IsoDate;
  /** Local kick-off time "HH:MM" when known. */
  time?: string;
  competition: string;
  round?: string;
  home: MatchSide;
  away: MatchSide;
  /**
   * Whether Villeneuve-Sports is the home side. null when the source names
   * both teams but does not say where the match was played.
   */
  villeneuveAtHome: boolean | null;
  venue: string | null;
  score?: { home: number; away: number };
  status: "played" | "scheduled";
  /** A tournament day (children's football) rather than a single match. */
  format?: "tournoi";
  /** Short factual summary, written from the sources. */
  summary?: string;
}

export interface StandingRow {
  position: number | null;
  team: string;
  isVilleneuve?: boolean;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  note?: string;
}

export interface Standing extends Sourced {
  id: string;
  competition: string;
  season: string;
  teamSlug: string;
  /** When the table was captured. */
  snapshot: string;
  /** True when the table only shows some rows. */
  partial: boolean;
  rows: StandingRow[];
}

export interface Venue extends Sourced {
  slug: string;
  name: string;
  kind: string;
  facts: { label: string; value: string; verification: Verification; sources: string[] }[];
}

export interface Sponsor extends Sourced {
  name: string;
  location: string | null;
  logo: Media | null;
  url: string | null;
}

export interface NewsArticle extends Sourced {
  slug: string;
  title: string;
  kicker: string;
  category: "Résultats" | "Club" | "Juniors" | "Installations" | "Agenda";
  date: IsoDate;
  excerpt: string;
  body: string[];
  /** Short quotes taken verbatim from a source. */
  quotes?: { text: string; source: string }[];
  teamSlugs?: string[];
}

export interface Milestone extends Sourced {
  year: string;
  title: string;
  text: string;
}
