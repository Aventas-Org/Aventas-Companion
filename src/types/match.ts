/**
 * Match result types.
 */
export type MatchResult = 'victory' | 'defeat';

/**
 * Filter options for match history.
 */
export type MatchFilter = 'all' | 'wins' | 'losses';

/**
 * Represents a single VALORANT match.
 * This is a pure data model — no live data fetching is included.
 */
export interface Match {
  /** Unique match identifier. */
  id: string;
  /** Victory or defeat. */
  result: MatchResult;
  /** Match score, e.g. "13 - 9". */
  score: string;
  /** Map name, e.g. "Ascent". */
  map: string;
  /** Match date/time as an ISO string. */
  date: string;
  /** Number of kills. */
  kills: number;
  /** Number of deaths. */
  deaths: number;
  /** Number of assists. */
  assists: number;
  /** Optional combat score (ACS). */
  acs?: number;
  /** Optional agent name played. */
  agent?: string;
  /** Optional game mode, e.g. "Competitive", "Unrated". */
  mode?: string;
  /** Optional match duration in minutes. */
  durationMinutes?: number;
}
