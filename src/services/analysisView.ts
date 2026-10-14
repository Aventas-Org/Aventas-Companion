import type { AnalysisMatch, AnalysisSession, RoundEvent } from '../types/analysis';
import {
  analyzeClutch,
  analyzeEconomy,
  analyzeSitePerformance,
  buildBenchmarkComparisons,
  collectFirstDuels,
  filterRoundsByMatches,
  firstBloodRate,
  gradeAllRoles,
  lastMatchIds,
  summarizeFirstDuels,
  summarizeUtility,
  type ClutchAnalysis,
  type EconomyAnalysis,
  type FirstDuelSummary,
  type MetricComparison,
  type PlayerMetricInput,
  type RoleGrade,
  type SitePerformance,
  type UtilitySummary,
} from './analysisStats';
import { getDemoSession, SESSION_MATCH_COUNT } from './analysisData';
import {
  buildCandidateInsights,
  selectTopInsights,
  summarizeRecord,
  type Insight,
  type SessionRecord,
} from './insights';

/**
 * Composition layer: runs every analysis for a window of matches and returns a
 * single view model. Pages render this directly so they never recompute stats.
 */
export interface WindowAnalysis {
  matches: AnalysisMatch[];
  rounds: RoundEvent[];
  record: SessionRecord;
  utility: UtilitySummary;
  openingDuels: FirstDuelSummary;
  firstBloodRate: number | null;
  clutch: ClutchAnalysis;
  economy: EconomyAnalysis;
  sitePerformance: SitePerformance[];
  comparisons: MetricComparison[];
  roleGrades: RoleGrade[];
  /** The headline takeaways shown first (max 3). */
  insights: Insight[];
  /** Every candidate insight, highest priority first. */
  allInsights: Insight[];
}

/** Runs the full analysis pipeline over one slice of matches. */
export function analyzeWindow(
  session: AnalysisSession,
  matches: AnalysisMatch[],
  rounds: RoundEvent[],
): WindowAnalysis {
  const utility = summarizeUtility(rounds);
  const openingDuels = summarizeFirstDuels(collectFirstDuels(rounds));
  const clutch = analyzeClutch(rounds);
  const economy = analyzeEconomy(rounds);
  const sitePerformance = analyzeSitePerformance(rounds);
  const bloodRate = firstBloodRate(rounds.length, openingDuels);

  const player: PlayerMetricInput = {
    headshotPercent: session.aimProfile.headshotPercent,
    acs: session.aimProfile.acs,
    kastPercent: session.aimProfile.kastPercent,
    castsPerRound: utility.castsPerRound,
    firstBloodRate: bloodRate ?? 0,
    clutchWinRate: clutch.winRate ?? 0,
  };

  const comparisons = buildBenchmarkComparisons(
    player,
    session.player.currentRank,
    session.player.targetRank,
  );
  const roleGrades = gradeAllRoles(session.rolePerformance);
  const allInsights = buildCandidateInsights({
    rounds,
    sitePerformance,
    economy,
    clutch,
    utility,
    openingDuels,
    comparisons,
    roleGrades,
    mainRole: session.player.mainRole,
  }).sort((a, b) => b.priority - a.priority);
  const insights = selectTopInsights(allInsights, 3);

  return {
    matches,
    rounds,
    record: summarizeRecord(matches),
    utility,
    openingDuels,
    firstBloodRate: bloodRate,
    clutch,
    economy,
    sitePerformance,
    comparisons,
    roleGrades,
    insights,
    allInsights,
  };
}

export interface AnalysisBundle {
  session: AnalysisSession;
  /** The full history window (all demo matches). */
  history: WindowAnalysis;
  /** The current session window (the most recent matches). */
  recent: WindowAnalysis;
}

/** Builds every window the UI needs from the (single) demo session. */
export function buildAnalysis(): AnalysisBundle {
  const session = getDemoSession();
  const recentMatches = session.matches.slice(0, SESSION_MATCH_COUNT);
  const recentRounds = filterRoundsByMatches(
    session.rounds,
    lastMatchIds(session.matches, SESSION_MATCH_COUNT),
  );

  return {
    session,
    history: analyzeWindow(session, session.matches, session.rounds),
    recent: analyzeWindow(session, recentMatches, recentRounds),
  };
}
