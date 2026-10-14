import type {
  AimProfile,
  AnalysisMatch,
  AnalysisSession,
  BuyType,
  ClutchType,
  MapPoint,
  PlaySide,
  RoundEvent,
  RoundOutcome,
  RolePerformanceInput,
  SiteId,
} from '../types/analysis';
import { getMapLayout, getSiteAnchor } from './mapLayouts';

/**
 * Demo dataset for the round-by-round analysis views.
 *
 * IMPORTANT: this is generated placeholder data, not a real match history.
 * It is produced by a *seeded* generator so the numbers are stable between
 * renders (no flicker, no random test failures) while still being rich enough
 * to exercise every analysis. When the Riot `VAL-MATCH-V1` integration lands,
 * `getDemoSession()` is the single function that gets replaced by an API
 * mapper — everything downstream consumes the same `AnalysisSession` shape.
 *
 * The generator is deliberately tuned to surface realistic coaching patterns
 * (a defensive site leak on Bind, an economy that over-buys on ecos, clutch
 * splits by man-advantage, flashes that set up teammate kills) so the insights
 * engine has something meaningful to say.
 */

const SEED = 0x5f37c0de;

/** First-duel involvement rate and outcome weighting. */
const FIRST_DUEL_CHANCE = 0.38;
/** Chance of a clutch situation, split by whether the round was won. */
const CLUTCH_CHANCE_WON = 0.18;
const CLUTCH_CHANCE_LOST = 0.22;
/** Chance the player cast any utility in a round. */
const UTILITY_CHANCE = 0.97;

/** Baseline round win probability per spending posture. */
const BUY_WIN_BASE: Record<BuyType, number> = {
  eco: 0.3,
  force: 0.42,
  half: 0.48,
  full: 0.56,
};

/** Average spend per posture, and the anomaly ranges that flag bad decisions. */
const SPEND_RANGE: Record<BuyType, [number, number]> = {
  eco: [900, 1800],
  force: [2100, 3000],
  half: [3000, 3600],
  full: [3600, 4800],
};

/** Chance an eco round was over-bought, and a full round was under-bought. */
const OVERBUY_CHANCE = 0.12;
const UNDERBUY_CHANCE = 0.1;

interface MatchPlan {
  id: string;
  map: string;
  date: string;
  score: string;
  agent: string;
}

/** Newest-first match list. Score strings define the exact round outcome mix. */
const MATCH_PLANS: MatchPlan[] = [
  { id: 'm20', map: 'Ascent', date: '2026-10-13T21:12:00Z', score: '13 - 9', agent: 'KAY/O' },
  { id: 'm19', map: 'Bind', date: '2026-10-13T20:35:00Z', score: '11 - 13', agent: 'Skye' },
  { id: 'm18', map: 'Icebox', date: '2026-10-12T22:04:00Z', score: '13 - 8', agent: 'Sova' },
  { id: 'm17', map: 'Lotus', date: '2026-10-12T21:20:00Z', score: '10 - 13', agent: 'Fade' },
  { id: 'm16', map: 'Haven', date: '2026-10-12T20:41:00Z', score: '13 - 11', agent: 'KAY/O' },
  { id: 'm15', map: 'Bind', date: '2026-10-11T19:55:00Z', score: '13 - 10', agent: 'Skye' },
  { id: 'm14', map: 'Ascent', date: '2026-10-11T19:10:00Z', score: '9 - 13', agent: 'Sova' },
  { id: 'm13', map: 'Icebox', date: '2026-10-10T21:40:00Z', score: '13 - 7', agent: 'Fade' },
  { id: 'm12', map: 'Lotus', date: '2026-10-10T20:58:00Z', score: '13 - 12', agent: 'KAY/O' },
  { id: 'm11', map: 'Haven', date: '2026-10-09T22:15:00Z', score: '11 - 13', agent: 'Skye' },
  { id: 'm10', map: 'Bind', date: '2026-10-09T21:30:00Z', score: '8 - 13', agent: 'Sova' },
  { id: 'm9', map: 'Ascent', date: '2026-10-08T20:20:00Z', score: '13 - 6', agent: 'Fade' },
  { id: 'm8', map: 'Icebox', date: '2026-10-08T19:35:00Z', score: '12 - 14', agent: 'KAY/O' },
  { id: 'm7', map: 'Lotus', date: '2026-10-07T21:05:00Z', score: '11 - 13', agent: 'Skye' },
  { id: 'm6', map: 'Haven', date: '2026-10-07T20:22:00Z', score: '13 - 9', agent: 'Sova' },
  { id: 'm5', map: 'Bind', date: '2026-10-06T22:30:00Z', score: '13 - 11', agent: 'Fade' },
  { id: 'm4', map: 'Ascent', date: '2026-10-06T21:48:00Z', score: '10 - 13', agent: 'KAY/O' },
  { id: 'm3', map: 'Icebox', date: '2026-10-05T20:10:00Z', score: '13 - 10', agent: 'Skye' },
  { id: 'm2', map: 'Lotus', date: '2026-10-05T19:26:00Z', score: '12 - 14', agent: 'Sova' },
  { id: 'm1', map: 'Haven', date: '2026-10-04T21:00:00Z', score: '13 - 8', agent: 'Fade' },
];

const AIM_PROFILE: AimProfile = {
  headshotPercent: 26.4,
  acs: 258,
  kastPercent: 68.9,
  kdRatio: 1.18,
};

/** Career performance per role, used for role-specific grading. */
const ROLE_PERFORMANCE: RolePerformanceInput[] = [
  {
    role: 'Duelist',
    metrics: { 'opening-duel-win': 58.5, acs: 271, 'kills-per-round': 0.92 },
  },
  {
    role: 'Sentinel',
    metrics: { 'round-survival': 56.4, 'assists-per-round': 0.33, 'clutch-win': 52.0 },
  },
  {
    role: 'Initiator',
    metrics: { 'assists-per-round': 0.58, 'casts-per-round': 1.1, 'flash-assist-rate': 6.2 },
  },
  {
    role: 'Controller',
    metrics: { 'casts-per-round': 1.04, 'round-survival': 47.9, 'assists-per-round': 0.38 },
  },
];

interface StagedRound {
  round: number;
  side: PlaySide;
  buyType: BuyType;
  spend: number;
  site: SiteId;
  pWin: number;
}

/** Deterministic PRNG (mulberry32) so the demo dataset never changes. */
function createRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), 1 | t);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function weightedPick<T>(rng: () => number, entries: ReadonlyArray<readonly [T, number]>): T {
  let total = 0;
  for (const [, weight] of entries) total += weight;
  let roll = rng() * total;
  for (const [value, weight] of entries) {
    roll -= weight;
    if (roll <= 0) return value;
  }
  return entries[entries.length - 1][0];
}

function parseScore(score: string): { wins: number; losses: number } {
  const [wins, losses] = score.split('-').map((part) => Number.parseInt(part.trim(), 10));
  return { wins, losses };
}

function availableSites(map: string): SiteId[] {
  return map === 'Lotus' || map === 'Haven' ? ['A', 'B', 'C', 'Mid'] : ['A', 'B', 'Mid'];
}

/** Site the team was likely playing around, with a defensive Bind leak baked in. */
function chooseSite(rng: () => number, map: string, side: PlaySide): SiteId {
  let weights: Record<SiteId, number> = { A: 0.34, B: 0.32, C: 0.16, Mid: 0.18 };
  if (map === 'Bind' && side === 'defense') {
    weights = { A: 0.4, B: 0.36, C: 0, Mid: 0.24 };
  }
  const entries = availableSites(map).map((site) => [site, weights[site]] as const);
  return weightedPick(rng, entries);
}

/** Economy progression: the round after a win escalates, after a loss it resets. */
function chooseBuyType(rng: () => number, round: number, prev: RoundOutcome | undefined): BuyType {
  if (round === 1 || round === 13) return 'half';
  if (prev === undefined) return 'half';
  if (prev === 'win') {
    return weightedPick(rng, [
      ['full', 0.62],
      ['half', 0.16],
      ['force', 0.12],
      ['eco', 0.1],
    ] as const);
  }
  return weightedPick(rng, [
    ['eco', 0.45],
    ['force', 0.3],
    ['full', 0.15],
    ['half', 0.1],
  ] as const);
}

function sampleSpend(rng: () => number, buyType: BuyType): number {
  // Occasionally a team mis-buys: overspending on an eco, or saving on a full buy.
  if (buyType === 'eco' && rng() < OVERBUY_CHANCE) return 2000 + rng() * 700;
  if (buyType === 'full' && rng() < UNDERBUY_CHANCE) return 2400 + rng() * 800;
  const [min, max] = SPEND_RANGE[buyType];
  return min + rng() * (max - min);
}

/** Round win probability, including the tactical leaks baked into the demo data. */
function winProbability(
  rng: () => number,
  buyType: BuyType,
  side: PlaySide,
  map: string,
  site: SiteId,
): number {
  let p = BUY_WIN_BASE[buyType];
  if (side === 'defense') p += 0.02;
  if (map === 'Bind' && side === 'defense' && site === 'A') p -= 0.15;
  if (map === 'Haven' && side === 'attack' && site === 'C') p -= 0.13;
  p += (rng() - 0.5) * 0.12;
  return clamp(p, 0.05, 0.95);
}

/** Nudges the simulated outcomes so the round count matches the final score. */
function reconcileOutcomes(
  outcomes: RoundOutcome[],
  staged: StagedRound[],
  targetWins: number,
): void {
  const winIndexes = outcomes
    .map((outcome, index) => ({ outcome, index }))
    .filter((entry) => entry.outcome === 'win')
    .map((entry) => entry.index);

  const delta = winIndexes.length - targetWins;
  if (delta === 0) return;

  const pool = winIndexes.slice().sort((a, b) => staged[a].pWin - staged[b].pWin);
  if (delta > 0) {
    // Too many wins: convert the least likely ones into losses.
    for (let i = 0; i < delta; i += 1) outcomes[pool[i]] = 'loss';
    return;
  }

  // Too few wins: convert the most likely losses into wins.
  const lossIndexes = outcomes
    .map((outcome, index) => ({ outcome, index }))
    .filter((entry) => entry.outcome === 'loss')
    .map((entry) => entry.index)
    .sort((a, b) => staged[b].pWin - staged[a].pWin);
  for (let i = 0; i < -delta; i += 1) outcomes[lossIndexes[i]] = 'win';
}

/** Places a point inside the middle of a zone so markers never touch the edges. */
function pointInZone(
  zone: { x: number; y: number; w: number; h: number },
  rng: () => number,
): MapPoint {
  return {
    x: clamp(zone.x + zone.w * (0.22 + rng() * 0.56), 0.02, 0.98),
    y: clamp(zone.y + zone.h * (0.22 + rng() * 0.56), 0.02, 0.98),
  };
}

function buildFirstDuel(
  rng: () => number,
  map: string,
  site: SiteId,
  result: RoundOutcome,
): RoundEvent['firstDuel'] {
  if (rng() >= FIRST_DUEL_CHANCE) return undefined;

  const layout = getMapLayout(map);
  const anchor = getSiteAnchor(layout, site) ?? layout.zones[0];
  const bloodChance = result === 'win' ? 0.6 : 0.44;
  const kind = rng() < bloodChance ? 'first-blood' : 'first-death';
  return { kind, zone: anchor.label, point: pointInZone(anchor, rng) };
}

function buildClutch(rng: () => number, result: RoundOutcome): RoundEvent['clutch'] {
  const chance = result === 'win' ? CLUTCH_CHANCE_WON : CLUTCH_CHANCE_LOST;
  if (rng() >= chance) return undefined;

  const type: ClutchType =
    result === 'win'
      ? weightedPick(rng, [
          ['1v1', 0.34],
          ['2v1', 0.2],
          ['2v2', 0.3],
          ['1v2', 0.13],
          ['1v3', 0.03],
        ] as const)
      : weightedPick(rng, [
          ['1v1', 0.2],
          ['1v2', 0.3],
          ['1v3', 0.2],
          ['2v1', 0.08],
          ['2v2', 0.22],
        ] as const);

  // Losing the clutch loses the round; winning it wins the round.
  return { type, won: result === 'win' };
}

function buildUtility(rng: () => number): RoundEvent['utility'] {
  if (rng() >= UTILITY_CHANCE) return undefined;
  return {
    casts: weightedPick(rng, [
      [0, 0.24],
      [1, 0.44],
      [2, 0.22],
      [3, 0.08],
      [4, 0.02],
    ] as const),
    flashesThrown: weightedPick(rng, [
      [0, 0.35],
      [1, 0.35],
      [2, 0.22],
      [3, 0.08],
    ] as const),
    // Rounds where a flash directly set up a teammate kill.
    flashAssists: rng() < 0.055 ? 1 : 0,
  };
}

function buildSession(): AnalysisSession {
  const rng = createRng(SEED);
  const matches: AnalysisMatch[] = [];
  const rounds: RoundEvent[] = [];

  for (const plan of MATCH_PLANS) {
    const { wins: targetWins, losses: targetLosses } = parseScore(plan.score);
    const total = targetWins + targetLosses;

    const staged: StagedRound[] = [];
    let prev: RoundOutcome | undefined;
    for (let round = 1; round <= total; round += 1) {
      const side: PlaySide = round <= 12 ? 'attack' : round <= 24 ? 'defense' : 'attack';
      const buyType = chooseBuyType(rng, round, prev);
      const site = chooseSite(rng, plan.map, side);
      staged.push({
        round,
        side,
        buyType,
        spend: sampleSpend(rng, buyType),
        site,
        pWin: winProbability(rng, buyType, side, plan.map, site),
      });
      // Economy progression keys off a provisional outcome; reconciliation below
      // only flips a handful of rounds, so the sequence stays realistic.
      prev = rng() < staged[staged.length - 1].pWin ? 'win' : 'loss';
    }

    const outcomes: RoundOutcome[] = staged.map((s) => (rng() < s.pWin ? 'win' : 'loss'));
    reconcileOutcomes(outcomes, staged, targetWins);

    for (let i = 0; i < staged.length; i += 1) {
      const s = staged[i];
      const result = outcomes[i];
      const event: RoundEvent = {
        matchId: plan.id,
        round: s.round,
        map: plan.map,
        side: s.side,
        site: s.site,
        buyType: s.buyType,
        spend: Math.round(s.spend),
        result,
      };

      const firstDuel = buildFirstDuel(rng, plan.map, s.site, result);
      if (firstDuel) event.firstDuel = firstDuel;

      const clutch = buildClutch(rng, result);
      if (clutch) event.clutch = clutch;

      const utility = buildUtility(rng);
      if (utility) event.utility = utility;

      rounds.push(event);
    }

    matches.push({
      id: plan.id,
      map: plan.map,
      date: plan.date,
      result: targetWins > targetLosses ? 'win' : 'loss',
      score: plan.score,
      rounds: total,
      agent: plan.agent,
    });
  }

  return {
    player: {
      riotId: 'Aventas#NA1',
      currentRank: 'Platinum 1',
      targetRank: 'Ascendant 1',
      mainRole: 'Initiator',
      mainAgent: 'KAY/O',
    },
    matches,
    rounds,
    aimProfile: AIM_PROFILE,
    rolePerformance: ROLE_PERFORMANCE,
  };
}

const SESSION = buildSession();

/** Returns the full deterministic demo session. */
export function getDemoSession(): AnalysisSession {
  return SESSION;
}

/** Number of most-recent matches treated as the "current session". */
export const SESSION_MATCH_COUNT = 5;
