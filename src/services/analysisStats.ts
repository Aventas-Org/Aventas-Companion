import type {
  AgentRole,
  AnalysisMatch,
  BuyType,
  ClutchType,
  MapPoint,
  OpeningDuelOutcome,
  PlaySide,
  RoundEvent,
  RoundOutcome,
  RolePerformanceInput,
  SiteId,
} from '../types/analysis';

/**
 * Pure analytics over round events. Nothing in this module touches React or the
 * demo data source, which keeps every calculation trivially testable and lets
 * the same functions run against real Riot `VAL-MATCH-V1` payloads later.
 *
 * All division is null-safe: an unavailable metric returns `null` rather than
 * `NaN`, matching the convention in `services/matchStats.ts`.
 */

// ---------------------------------------------------------------------------
// Selection helpers
// ---------------------------------------------------------------------------

/** Ids of the `count` most recent matches (matches are ordered newest-first). */
export function lastMatchIds(matches: AnalysisMatch[], count: number): string[] {
  return matches.slice(0, count).map((match) => match.id);
}

/** Keeps only rounds belonging to the supplied match ids. */
export function filterRoundsByMatches(rounds: RoundEvent[], matchIds: string[]): RoundEvent[] {
  const wanted = new Set(matchIds);
  return rounds.filter((round) => wanted.has(round.matchId));
}

// ---------------------------------------------------------------------------
// First-duel heat map
// ---------------------------------------------------------------------------

/** A single opening duel, ready to plot on a top-down map. */
export interface FirstDuelCell {
  matchId: string;
  round: number;
  map: string;
  zone: string;
  kind: OpeningDuelOutcome;
  result: RoundOutcome;
  point: MapPoint;
}

export interface FirstDuelSummary {
  total: number;
  firstBloods: number;
  firstDeaths: number;
  openingDuelWinRate: number | null;
}

/**
 * Collects every opening duel in the round set, optionally limited to one map.
 */
export function collectFirstDuels(rounds: RoundEvent[], map?: string): FirstDuelCell[] {
  const cells: FirstDuelCell[] = [];
  for (const round of rounds) {
    if (map && round.map !== map) continue;
    if (!round.firstDuel) continue;
    cells.push({
      matchId: round.matchId,
      round: round.round,
      map: round.map,
      zone: round.firstDuel.zone,
      kind: round.firstDuel.kind,
      result: round.result,
      point: round.firstDuel.point,
    });
  }
  return cells;
}

/**
 * First blood *rate* — the share of all rounds in which the player drew first
 * blood. This is the metric rank benchmarks are built on, and is distinct from
 * the win rate of the duels themselves (`openingDuelWinRate`).
 */
export function firstBloodRate(roundsPlayed: number, summary: FirstDuelSummary): number | null {
  if (roundsPlayed <= 0) return null;
  return (summary.firstBloods / roundsPlayed) * 100;
}

/** Aggregates opening-duel cells into headline numbers. */
export function summarizeFirstDuels(cells: FirstDuelCell[]): FirstDuelSummary {
  let firstBloods = 0;
  let firstDeaths = 0;
  for (const cell of cells) {
    if (cell.kind === 'first-blood') firstBloods += 1;
    else firstDeaths += 1;
  }
  const total = cells.length;
  return {
    total,
    firstBloods,
    firstDeaths,
    openingDuelWinRate: total > 0 ? (firstBloods / total) * 100 : null,
  };
}

// ---------------------------------------------------------------------------
// Economy vs win rate
// ---------------------------------------------------------------------------

/** Spend a team is "supposed" to commit on an eco round, per player. */
export const ECO_TARGET_SPEND = 1200;
/** Spending above this on an eco round is flagged as an over-buy. */
export const OVERBUY_SPEND_THRESHOLD = 2000;
/** Spending below this on a full-buy round is flagged as an under-buy. */
export const UNDERBUY_SPEND_THRESHOLD = 3200;

export const BUY_TYPE_LABELS: Record<BuyType, string> = {
  eco: 'Eco',
  force: 'Force Buy',
  half: 'Half Buy',
  full: 'Full Buy',
};

const BUY_TYPE_ORDER: BuyType[] = ['eco', 'force', 'half', 'full'];

export interface BuyTypeBreakdown {
  buyType: BuyType;
  label: string;
  rounds: number;
  wins: number;
  winRate: number | null;
  averageSpend: number;
}

export interface EconomyFlag {
  matchId: string;
  round: number;
  map: string;
  kind: 'overbuy' | 'underbuy';
  spend: number;
  result: RoundOutcome;
  note: string;
}

export interface EconomyAnalysis {
  breakdown: BuyTypeBreakdown[];
  flags: EconomyFlag[];
  overbuyCount: number;
  underbuyCount: number;
  /** Credits burned by buying up on eco rounds, across the whole team. */
  wastedCredits: number;
  best: BuyTypeBreakdown | null;
  worst: BuyTypeBreakdown | null;
}

/** Breaks rounds down by spending posture and flags the bad economy decisions. */
export function analyzeEconomy(rounds: RoundEvent[]): EconomyAnalysis {
  const breakdown: BuyTypeBreakdown[] = BUY_TYPE_ORDER.map((buyType) => ({
    buyType,
    label: BUY_TYPE_LABELS[buyType],
    rounds: 0,
    wins: 0,
    winRate: null,
    averageSpend: 0,
  }));
  const byType = new Map(breakdown.map((entry) => [entry.buyType, entry]));
  const spendTotals = new Map<BuyType, number>();
  const flags: EconomyFlag[] = [];
  let wastedCredits = 0;

  for (const round of rounds) {
    const entry = byType.get(round.buyType);
    if (!entry) continue;
    entry.rounds += 1;
    if (round.result === 'win') entry.wins += 1;
    spendTotals.set(round.buyType, (spendTotals.get(round.buyType) ?? 0) + round.spend);

    if (round.buyType === 'eco' && round.spend > OVERBUY_SPEND_THRESHOLD) {
      wastedCredits += Math.round((round.spend - ECO_TARGET_SPEND) * 5);
      flags.push({
        matchId: round.matchId,
        round: round.round,
        map: round.map,
        kind: 'overbuy',
        spend: round.spend,
        result: round.result,
        note: `Over-bought on an eco round (${round.spend} avg credits). Save it for the next full buy.`,
      });
    } else if (round.buyType === 'full' && round.spend < UNDERBUY_SPEND_THRESHOLD) {
      flags.push({
        matchId: round.matchId,
        round: round.round,
        map: round.map,
        kind: 'underbuy',
        spend: round.spend,
        result: round.result,
        note: `Under-bought on a full-buy round (${round.spend} avg credits). You were outgunned by default.`,
      });
    }
  }

  for (const entry of breakdown) {
    entry.winRate = entry.rounds > 0 ? (entry.wins / entry.rounds) * 100 : null;
    const total = spendTotals.get(entry.buyType) ?? 0;
    entry.averageSpend = entry.rounds > 0 ? Math.round(total / entry.rounds) : 0;
  }

  const withRounds = breakdown.filter((entry) => entry.rounds > 0);
  const ranked = [...withRounds].sort((a, b) => (b.winRate ?? 0) - (a.winRate ?? 0));

  return {
    breakdown,
    flags: flags.sort((a, b) => a.round - b.round),
    overbuyCount: flags.filter((flag) => flag.kind === 'overbuy').length,
    underbuyCount: flags.filter((flag) => flag.kind === 'underbuy').length,
    wastedCredits,
    best: ranked.length > 0 ? ranked[0] : null,
    worst: ranked.length > 0 ? ranked[ranked.length - 1] : null,
  };
}

// ---------------------------------------------------------------------------
// Clutch scenarios
// ---------------------------------------------------------------------------

export const CLUTCH_ORDER: ClutchType[] = ['1v1', '1v2', '1v3', '2v1', '2v2'];

/** Expected win rate for each clutch scenario, across ranked play. */
export const CLUTCH_BENCHMARK: Record<ClutchType, number> = {
  '1v1': 50,
  '1v2': 26,
  '1v3': 13,
  '2v1': 62,
  '2v2': 50,
};

export interface ClutchBreakdown {
  type: ClutchType;
  attempts: number;
  wins: number;
  winRate: number | null;
  benchmark: number;
  delta: number;
}

export interface ClutchAnalysis {
  breakdown: ClutchBreakdown[];
  attempts: number;
  wins: number;
  winRate: number | null;
  expectedRate: number | null;
  verdict: 'clutch' | 'steady' | 'choking';
}

/** Measures performance specifically in outnumbered situations. */
export function analyzeClutch(rounds: RoundEvent[]): ClutchAnalysis {
  const buckets = new Map<ClutchType, { attempts: number; wins: number }>();
  for (const type of CLUTCH_ORDER) buckets.set(type, { attempts: 0, wins: 0 });

  let attempts = 0;
  let wins = 0;
  let expectedWins = 0;

  for (const round of rounds) {
    if (!round.clutch) continue;
    const bucket = buckets.get(round.clutch.type);
    if (!bucket) continue;
    bucket.attempts += 1;
    attempts += 1;
    expectedWins += CLUTCH_BENCHMARK[round.clutch.type] / 100;
    if (round.clutch.won) {
      bucket.wins += 1;
      wins += 1;
    }
  }

  const breakdown: ClutchBreakdown[] = CLUTCH_ORDER.map((type) => {
    const bucket = buckets.get(type) ?? { attempts: 0, wins: 0 };
    const winRate = bucket.attempts > 0 ? (bucket.wins / bucket.attempts) * 100 : null;
    return {
      type,
      attempts: bucket.attempts,
      wins: bucket.wins,
      winRate,
      benchmark: CLUTCH_BENCHMARK[type],
      delta: winRate === null ? 0 : winRate - CLUTCH_BENCHMARK[type],
    };
  }).filter((entry) => entry.attempts > 0);

  const winRate = attempts > 0 ? (wins / attempts) * 100 : null;
  const expectedRate = attempts > 0 ? (expectedWins / attempts) * 100 : null;

  let verdict: ClutchAnalysis['verdict'] = 'steady';
  if (winRate !== null && expectedRate !== null) {
    const diff = winRate - expectedRate;
    if (diff >= 6) verdict = 'clutch';
    else if (diff <= -6) verdict = 'choking';
  }

  return { breakdown, attempts, wins, winRate, expectedRate, verdict };
}

// ---------------------------------------------------------------------------
// Site / side performance
// ---------------------------------------------------------------------------

export interface SitePerformance {
  map: string;
  site: SiteId;
  side: PlaySide;
  rounds: number;
  wins: number;
  winRate: number | null;
}

/** Groups rounds by map + site + side so leaks and strong holds are visible. */
export function analyzeSitePerformance(rounds: RoundEvent[]): SitePerformance[] {
  const buckets = new Map<string, SitePerformance>();
  for (const round of rounds) {
    const key = `${round.map}|${round.site}|${round.side}`;
    const existing = buckets.get(key);
    if (existing) {
      existing.rounds += 1;
      if (round.result === 'win') existing.wins += 1;
    } else {
      buckets.set(key, {
        map: round.map,
        site: round.site,
        side: round.side,
        rounds: 1,
        wins: round.result === 'win' ? 1 : 0,
        winRate: null,
      });
    }
  }

  const results = [...buckets.values()];
  for (const entry of results) {
    entry.winRate = entry.rounds > 0 ? (entry.wins / entry.rounds) * 100 : null;
  }
  return results;
}

// ---------------------------------------------------------------------------
// Utility usage
// ---------------------------------------------------------------------------

export interface UtilitySummary {
  rounds: number;
  roundsWithUtility: number;
  casts: number;
  castsPerRound: number;
  flashesThrown: number;
  flashAssists: number;
  flashKillConversion: number | null;
}

/** Summarises ability usage, including kills created directly by your flashes. */
export function summarizeUtility(rounds: RoundEvent[]): UtilitySummary {
  let roundsWithUtility = 0;
  let casts = 0;
  let flashesThrown = 0;
  let flashAssists = 0;

  for (const round of rounds) {
    if (!round.utility) continue;
    roundsWithUtility += 1;
    casts += round.utility.casts;
    flashesThrown += round.utility.flashesThrown;
    flashAssists += round.utility.flashAssists;
  }

  return {
    rounds: rounds.length,
    roundsWithUtility,
    casts,
    castsPerRound: rounds.length > 0 ? casts / rounds.length : 0,
    flashesThrown,
    flashAssists,
    flashKillConversion: flashesThrown > 0 ? (flashAssists / flashesThrown) * 100 : null,
  };
}

// ---------------------------------------------------------------------------
// Rank benchmarking
// ---------------------------------------------------------------------------

export const RANK_ORDER = [
  'Iron',
  'Bronze',
  'Silver',
  'Gold',
  'Platinum',
  'Diamond',
  'Ascendant',
  'Immortal',
  'Radiant',
] as const;

export type RankName = (typeof RANK_ORDER)[number];

export interface RankBand {
  rank: RankName;
  /** Typical value for a player at this rank. */
  min: number;
}

export interface BenchmarkMetric {
  id: string;
  label: string;
  /** Compact label used in dense comparisons, e.g. "Aim". */
  shortLabel: string;
  unit: string;
  description: string;
  higherIsBetter: boolean;
  bands: RankBand[];
}

function buildBands(mins: number[]): RankBand[] {
  return RANK_ORDER.map((rank, index) => ({ rank, min: mins[index] }));
}

/** Per-metric rank ladders. Thresholds are typical values, not hard cutoffs. */
export const BENCHMARK_METRICS: BenchmarkMetric[] = [
  {
    id: 'headshot',
    label: 'Headshot %',
    shortLabel: 'Aim',
    unit: '%',
    description: 'Share of your kills that landed as headshots.',
    higherIsBetter: true,
    bands: buildBands([11, 14, 17, 20, 23, 26, 29, 32, 35]),
  },
  {
    id: 'acs',
    label: 'Combat Score (ACS)',
    shortLabel: 'Damage',
    unit: '',
    description: 'Average combat score per round — raw impact.',
    higherIsBetter: true,
    bands: buildBands([130, 155, 180, 205, 230, 255, 275, 295, 320]),
  },
  {
    id: 'casts',
    label: 'Utility Casts / Round',
    shortLabel: 'Utility',
    unit: '',
    description: 'How often you actually use your agent’s kit each round.',
    higherIsBetter: true,
    bands: buildBands([0.5, 0.7, 0.9, 1.1, 1.3, 1.5, 1.7, 1.9, 2.1]),
  },
  {
    id: 'firstBlood',
    label: 'First Blood Rate',
    shortLabel: 'Openings',
    unit: '%',
    description: 'Share of rounds where you drew first blood.',
    higherIsBetter: true,
    bands: buildBands([7, 10, 13, 16, 19, 22, 25, 28, 31]),
  },
  {
    id: 'clutch',
    label: 'Clutch Win Rate',
    shortLabel: 'Clutch play',
    unit: '%',
    description: 'Rounds won while the numbers were against you.',
    higherIsBetter: true,
    bands: buildBands([20, 24, 28, 32, 36, 40, 44, 48, 52]),
  },
  {
    id: 'kast',
    label: 'KAST %',
    shortLabel: 'Consistency',
    unit: '%',
    description: 'Rounds with a kill, assist, survival, or trade.',
    higherIsBetter: true,
    bands: buildBands([55, 58, 61, 64, 67, 70, 72, 74, 76]),
  },
];

/** The rank a metric value corresponds to. */
export function rankForValue(metric: BenchmarkMetric, value: number): RankName {
  let result: RankName = RANK_ORDER[0];
  for (const band of metric.bands) {
    if (metric.higherIsBetter ? value >= band.min : value <= band.min) result = band.rank;
  }
  return result;
}

/** The typical value for a rank, used as the benchmark line. */
export function valueForRank(metric: BenchmarkMetric, rank: RankName): number {
  const band = metric.bands.find((entry) => entry.rank === rank);
  return band ? band.min : metric.bands[0].min;
}

/** Normalises a rank string such as "Platinum 1" or "Ascendant 2" to its tier. */
export function baseRank(rank: string): RankName {
  const name = rank.trim().split(/\s+/)[0]?.toLowerCase() ?? '';
  return RANK_ORDER.find((tier) => tier.toLowerCase() === name) ?? RANK_ORDER[0];
}

/** Index of a rank tier within `RANK_ORDER` (0 = Iron). */
export function rankIndex(rank: RankName): number {
  return RANK_ORDER.indexOf(rank);
}

/** Values the player actually produced, keyed by benchmark metric id. */
export interface PlayerMetricInput {
  headshotPercent: number;
  acs: number;
  kastPercent: number;
  castsPerRound: number;
  firstBloodRate: number;
  clutchWinRate: number;
}

const METRIC_VALUE_KEYS: Record<string, keyof PlayerMetricInput> = {
  headshot: 'headshotPercent',
  acs: 'acs',
  casts: 'castsPerRound',
  firstBlood: 'firstBloodRate',
  clutch: 'clutchWinRate',
  kast: 'kastPercent',
};

export interface MetricComparison {
  metric: BenchmarkMetric;
  playerValue: number;
  playerTier: RankName;
  playerTierIndex: number;
  currentRank: RankName;
  currentRankValue: number;
  targetRank: RankName;
  targetRankValue: number;
  /** Positive means the player is already ahead of the target rank's average. */
  targetGap: number;
  meetsCurrent: boolean;
  meetsTarget: boolean;
}

/** Compares each metric against the player's current rank and the rank they want. */
export function buildBenchmarkComparisons(
  input: PlayerMetricInput,
  currentRank: string,
  targetRank: string,
): MetricComparison[] {
  const current = baseRank(currentRank);
  const target = baseRank(targetRank);
  const targetIndex = rankIndex(target);

  return BENCHMARK_METRICS.map((metric) => {
    const value = input[METRIC_VALUE_KEYS[metric.id]];
    const playerTier = rankForValue(metric, value);
    const playerTierIndex = rankIndex(playerTier);
    const currentRankValue = valueForRank(metric, current);
    const targetRankValue = valueForRank(metric, target);
    return {
      metric,
      playerValue: value,
      playerTier,
      playerTierIndex,
      currentRank: current,
      currentRankValue,
      targetRank: target,
      targetRankValue,
      targetGap: metric.higherIsBetter ? value - targetRankValue : targetRankValue - value,
      meetsCurrent: metric.higherIsBetter ? value >= currentRankValue : value <= currentRankValue,
      meetsTarget: playerTierIndex >= targetIndex,
    };
  });
}

// ---------------------------------------------------------------------------
// Role-specific grading
// ---------------------------------------------------------------------------

export interface RoleMetricSpec {
  id: string;
  label: string;
  benchmark: number;
  unit: string;
  higherIsBetter: boolean;
}

export interface RoleSpec {
  role: AgentRole;
  tagline: string;
  metrics: RoleMetricSpec[];
}

/** What "good" looks like for each role, in that role's own currency. */
export const ROLE_SPECS: RoleSpec[] = [
  {
    role: 'Duelist',
    tagline: 'Win the opening duel and create space for the team.',
    metrics: [
      {
        id: 'opening-duel-win',
        label: 'Opening Duel Win %',
        benchmark: 55,
        unit: '%',
        higherIsBetter: true,
      },
      { id: 'acs', label: 'ACS', benchmark: 240, unit: '', higherIsBetter: true },
      {
        id: 'kills-per-round',
        label: 'Kills / Round',
        benchmark: 0.85,
        unit: '',
        higherIsBetter: true,
      },
    ],
  },
  {
    role: 'Sentinel',
    tagline: 'Anchor sites, survive the round, and hold the retake.',
    metrics: [
      {
        id: 'round-survival',
        label: 'Round Survival %',
        benchmark: 52,
        unit: '%',
        higherIsBetter: true,
      },
      {
        id: 'assists-per-round',
        label: 'Assists / Round',
        benchmark: 0.35,
        unit: '',
        higherIsBetter: true,
      },
      { id: 'clutch-win', label: 'Clutch Win %', benchmark: 35, unit: '%', higherIsBetter: true },
    ],
  },
  {
    role: 'Initiator',
    tagline: 'Set the team up — your utility should be creating kills.',
    metrics: [
      {
        id: 'assists-per-round',
        label: 'Assists / Round',
        benchmark: 0.45,
        unit: '',
        higherIsBetter: true,
      },
      {
        id: 'casts-per-round',
        label: 'Utility Casts / Round',
        benchmark: 1.6,
        unit: '',
        higherIsBetter: true,
      },
      {
        id: 'flash-assist-rate',
        label: 'Flash Assist Rate %',
        benchmark: 8,
        unit: '%',
        higherIsBetter: true,
      },
    ],
  },
  {
    role: 'Controller',
    tagline: 'Control space and enable the team through smokes.',
    metrics: [
      {
        id: 'casts-per-round',
        label: 'Utility Casts / Round',
        benchmark: 1.5,
        unit: '',
        higherIsBetter: true,
      },
      {
        id: 'round-survival',
        label: 'Round Survival %',
        benchmark: 50,
        unit: '%',
        higherIsBetter: true,
      },
      {
        id: 'assists-per-round',
        label: 'Assists / Round',
        benchmark: 0.4,
        unit: '',
        higherIsBetter: true,
      },
    ],
  },
];

export interface RoleMetricGrade {
  label: string;
  value: number;
  benchmark: number;
  unit: string;
  score: number;
  delta: number;
}

export interface RoleGrade {
  role: AgentRole;
  tagline: string;
  score: number;
  grade: string;
  metrics: RoleMetricGrade[];
  strengths: string[];
  /** The metric holding this role's grade back the most. */
  focus: string;
}

/** Maps a ratio-to-benchmark onto a 0-100 score, where 1.0 is a solid "B". */
function scoreFromRatio(ratio: number): number {
  const clamped = Math.min(1.45, Math.max(0.2, ratio));
  return Math.min(100, Math.max(20, 65 + (clamped - 1) * 100));
}

function gradeForScore(score: number): string {
  if (score >= 95) return 'S';
  if (score >= 88) return 'A';
  if (score >= 80) return 'A-';
  if (score >= 72) return 'B+';
  if (score >= 65) return 'B';
  if (score >= 56) return 'B-';
  if (score >= 48) return 'C+';
  if (score >= 40) return 'C';
  return 'D';
}

/** Grades a single role from the player's historical performance in it. */
export function gradeRole(spec: RoleSpec, input: RolePerformanceInput): RoleGrade {
  const metrics: RoleMetricGrade[] = spec.metrics.map((metric) => {
    const value = input.metrics[metric.id] ?? 0;
    const ratio = metric.higherIsBetter ? value / metric.benchmark : metric.benchmark / value;
    return {
      label: metric.label,
      value,
      benchmark: metric.benchmark,
      unit: metric.unit,
      score: scoreFromRatio(ratio),
      delta: value - metric.benchmark,
    };
  });

  const score =
    metrics.length > 0
      ? metrics.reduce((sum, metric) => sum + metric.score, 0) / metrics.length
      : 0;
  const ranked = [...metrics].sort((a, b) => b.score - a.score);
  const weakest = ranked[ranked.length - 1];

  return {
    role: spec.role,
    tagline: spec.tagline,
    score,
    grade: gradeForScore(score),
    metrics,
    strengths: ranked.filter((metric) => metric.score >= 72).map((metric) => metric.label),
    focus: weakest ? weakest.label : '',
  };
}

/** Grades every role the player has history in, best grade first. */
export function gradeAllRoles(inputs: RolePerformanceInput[]): RoleGrade[] {
  const grades: RoleGrade[] = [];
  for (const spec of ROLE_SPECS) {
    const input = inputs.find((entry) => entry.role === spec.role);
    if (!input) continue;
    grades.push(gradeRole(spec, input));
  }
  return grades;
}

/** Formats a metric value for display, e.g. 26.4 -> "26.4%" or 258 -> "258". */
export function formatMetricValue(value: number, unit: string): string {
  const decimals = Math.abs(value) >= 100 ? 0 : 1;
  return `${value.toFixed(decimals)}${unit}`;
}
