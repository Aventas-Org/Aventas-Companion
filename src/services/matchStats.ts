import type { Match, MatchResult } from '../types/match';

/**
 * Aggregated statistics derived from a set of matches.
 */
export interface MatchStats {
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: number | null;
  totalKills: number;
  totalDeaths: number;
  totalAssists: number;
  overallKd: number | null;
  averageAcs: number | null;
}

/**
 * A single data point for a performance trend chart.
 */
export interface TrendPoint {
  /** Short label for the x-axis, e.g. "Match 1". */
  label: string;
  /** The numeric value to plot. */
  value: number;
  /** Optional result for color-coding. */
  result?: MatchResult;
}

/**
 * Computes aggregate statistics from an array of matches.
 * Returns null-safe values: division by zero yields `null` rather than NaN.
 *
 * @param matches The matches to aggregate.
 * @returns A `MatchStats` object with safe numeric values.
 */
export function computeMatchStats(matches: Match[]): MatchStats {
  const totalMatches = matches.length;

  if (totalMatches === 0) {
    return {
      totalMatches: 0,
      wins: 0,
      losses: 0,
      winRate: null,
      totalKills: 0,
      totalDeaths: 0,
      totalAssists: 0,
      overallKd: null,
      averageAcs: null,
    };
  }

  let wins = 0;
  let losses = 0;
  let totalKills = 0;
  let totalDeaths = 0;
  let totalAssists = 0;
  let acsSum = 0;
  let acsCount = 0;

  for (const m of matches) {
    if (m.result === 'victory') {
      wins += 1;
    } else {
      losses += 1;
    }
    totalKills += m.kills;
    totalDeaths += m.deaths;
    totalAssists += m.assists;
    if (typeof m.acs === 'number') {
      acsSum += m.acs;
      acsCount += 1;
    }
  }

  const winRate = totalMatches > 0 ? (wins / totalMatches) * 100 : null;
  const overallKd = totalDeaths > 0 ? totalKills / totalDeaths : null;
  const averageAcs = acsCount > 0 ? acsSum / acsCount : null;

  return {
    totalMatches,
    wins,
    losses,
    winRate,
    totalKills,
    totalDeaths,
    totalAssists,
    overallKd,
    averageAcs,
  };
}

/**
 * Builds a performance trend series from recent matches.
 * The most recent match is plotted last (rightmost).
 *
 * @param matches The matches to plot, ordered oldest-first.
 * @param maxPoints Maximum number of points to include.
 * @returns An array of trend points.
 */
export function buildTrendSeries(matches: Match[], maxPoints = 10): TrendPoint[] {
  // Sort oldest-first so the most recent is last.
  const sorted = [...matches].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  const recent = sorted.slice(-maxPoints);

  return recent.map((m, index) => {
    const label = `Match ${sorted.length - recent.length + index + 1}`;
    return {
      label,
      value: typeof m.acs === 'number' ? m.acs : m.kills,
      result: m.result,
    };
  });
}

/**
 * Formats a ratio/percentage value for display.
 * Returns "N/A" when the value is null (unavailable).
 *
 * @param value The numeric value or null.
 * @param decimals Number of decimal places.
 * @param suffix Optional suffix, e.g. "%".
 * @returns A formatted string.
 */
export function formatMetric(value: number | null, decimals = 1, suffix = ''): string {
  if (value === null) return 'N/A';
  return `${value.toFixed(decimals)}${suffix}`;
}
