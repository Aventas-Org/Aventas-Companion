/**
 * Domain types for round-by-round performance analysis.
 *
 * These shapes mirror what the Riot `VAL-MATCH-V1` payload exposes for a
 * completed match (per-round kill coordinates, economy data and round events).
 * The demo layer in `services/analysisData.ts` produces instances of these
 * types today; a real Riot API mapper can produce the exact same shapes later
 * without the UI or analytics layer changing.
 */

/** Normalized top-down map coordinate. Both axes are 0..1. */
export interface MapPoint {
  x: number;
  y: number;
}

/** Which side the player's team played in a round. */
export type PlaySide = 'attack' | 'defense';

/** Outcome of a single round. */
export type RoundOutcome = 'win' | 'loss';

/** Spending posture the team committed to for a round. */
export type BuyType = 'eco' | 'force' | 'half' | 'full';

/** Site / area a round was played around. */
export type SiteId = 'A' | 'B' | 'C' | 'Mid';

/** Man-advantage situation the player was left in. */
export type ClutchType = '1v1' | '1v2' | '1v3' | '2v1' | '2v2';

/** Whether the player won or lost the opening duel of a round. */
export type OpeningDuelOutcome = 'first-blood' | 'first-death';

/** Agent role classification used for role-specific grading. */
export type AgentRole = 'Duelist' | 'Sentinel' | 'Initiator' | 'Controller';

/** A single opening (first) duel the player took part in. */
export interface FirstDuelEvent {
  kind: OpeningDuelOutcome;
  /** Callout the duel took place in, e.g. "A Site". */
  zone: string;
  point: MapPoint;
}

/** A clutch situation the player was left in as the last alive. */
export interface ClutchEvent {
  type: ClutchType;
  won: boolean;
}

/** Utility usage for a round. */
export interface UtilityEvent {
  /** Total ability casts (all slots). */
  casts: number;
  /** Flash-type abilities thrown. */
  flashesThrown: number;
  /** Rounds where a thrown flash directly set up a teammate kill. */
  flashAssists: number;
}

/**
 * A single round of a match. This is the atomic unit every analysis below is
 * derived from, which keeps the analytics pure and easy to test.
 */
export interface RoundEvent {
  matchId: string;
  /** 1-based round number within the match. */
  round: number;
  map: string;
  side: PlaySide;
  site: SiteId;
  buyType: BuyType;
  /** Team average spend per player, in credits. */
  spend: number;
  result: RoundOutcome;
  firstDuel?: FirstDuelEvent;
  clutch?: ClutchEvent;
  utility?: UtilityEvent;
}

/** Lightweight metadata for a match the player finished. */
export interface AnalysisMatch {
  id: string;
  map: string;
  date: string;
  result: RoundOutcome;
  /** Final score, e.g. "13 - 9". */
  score: string;
  rounds: number;
  agent?: string;
}

/** A zone on the top-down schematic of a map. */
export interface MapZone {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  kind: 'spawn' | 'site' | 'lane';
}

/** A schematic layout used to plot coordinates on a map. */
export interface MapLayout {
  map: string;
  zones: MapZone[];
  /** Zone an opening duel on a given site is most likely to resolve in. */
  siteAnchor: Partial<Record<SiteId, string>>;
}

/** Static aim profile for the player, sourced from career aggregates. */
export interface AimProfile {
  headshotPercent: number;
  acs: number;
  kastPercent: number;
  kdRatio: number;
}

/** Per-role metric values used for role-specific grading. */
export interface RolePerformanceInput {
  role: AgentRole;
  metrics: Record<string, number>;
}

/** The full demo dataset backing the analysis views. */
export interface AnalysisSession {
  player: {
    riotId: string;
    currentRank: string;
    targetRank: string;
    mainRole: AgentRole;
    mainAgent: string;
  };
  /** Matches ordered newest-first. */
  matches: AnalysisMatch[];
  /** Rounds for every match in the session, in match order. */
  rounds: RoundEvent[];
  aimProfile: AimProfile;
  rolePerformance: RolePerformanceInput[];
}
