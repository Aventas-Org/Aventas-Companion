import type { AgentRole, AnalysisMatch, RoundEvent } from '../types/analysis';
import type {
  ClutchAnalysis,
  EconomyAnalysis,
  FirstDuelSummary,
  MetricComparison,
  RoleGrade,
  SitePerformance,
  UtilitySummary,
} from './analysisStats';
import { OVERBUY_SPEND_THRESHOLD, UNDERBUY_SPEND_THRESHOLD, rankIndex } from './analysisStats';

/**
 * The "Actionable Insights" engine.
 *
 * Takes every analysis the app already computed and reduces it to a handful of
 * prioritised, plain-language takeaways — the thing a player can actually act
 * on before their next queue. Rules are intentionally simple and deterministic
 * so the output is explainable: every insight can be traced back to a number.
 */

export type InsightSeverity = 'positive' | 'warning' | 'negative';

export type InsightCategory = 'map' | 'economy' | 'clutch' | 'utility' | 'aim' | 'role';

export interface Insight {
  id: string;
  category: InsightCategory;
  severity: InsightSeverity;
  title: string;
  detail: string;
  /** Higher wins. Used to pick the headline takeaways. */
  priority: number;
}

export interface InsightInput {
  rounds: RoundEvent[];
  sitePerformance: SitePerformance[];
  economy: EconomyAnalysis;
  clutch: ClutchAnalysis;
  utility: UtilitySummary;
  openingDuels: FirstDuelSummary;
  comparisons: MetricComparison[];
  roleGrades: RoleGrade[];
  mainRole: AgentRole;
}

/** Simple win/loss record for a set of matches. */
export interface SessionRecord {
  matches: number;
  wins: number;
  losses: number;
  winRate: number | null;
}

/** Summarises a win/loss record from a match list. */
export function summarizeRecord(matches: AnalysisMatch[]): SessionRecord {
  const wins = matches.filter((match) => match.result === 'win').length;
  const losses = matches.length - wins;
  return {
    matches: matches.length,
    wins,
    losses,
    winRate: matches.length > 0 ? (wins / matches.length) * 100 : null,
  };
}

function round(value: number): number {
  return Math.round(value);
}

/** Renders a site id for prose: "A" -> "A-Site", "Mid" -> "Mid". */
function formatSite(site: string): string {
  return site === 'Mid' ? 'Mid' : `${site}-Site`;
}

function siteLeakInsights(sitePerformance: SitePerformance[]): Insight[] {
  const insights: Insight[] = [];
  // Five rounds is the floor: anything smaller is noise, not a pattern.
  const eligible = sitePerformance.filter((entry) => entry.rounds >= 5 && entry.winRate !== null);

  const leaking = eligible
    .filter((entry) => (entry.winRate ?? 100) <= 40)
    .sort((a, b) => (a.winRate ?? 0) - (b.winRate ?? 0))[0];

  if (leaking) {
    const losses = leaking.rounds - leaking.wins;
    insights.push({
      id: `site-leak-${leaking.map}-${leaking.site}-${leaking.side}`,
      category: 'map',
      severity: 'negative',
      title: `You're losing rounds on ${formatSite(leaking.site)} while ${leaking.side === 'defense' ? 'defending' : 'attacking'} ${leaking.map}`,
      detail: `Only ${round(leaking.winRate ?? 0)}% win rate across ${leaking.rounds} rounds there (${leaking.wins}W-${losses}L). Change your default setup or rotate a player earlier.`,
      priority: 92,
    });
  }

  const stronghold = eligible
    .filter((entry) => entry.rounds >= 6 && (entry.winRate ?? 0) >= 65)
    .sort((a, b) => (b.winRate ?? 0) - (a.winRate ?? 0))[0];

  if (stronghold) {
    insights.push({
      id: `site-hold-${stronghold.map}-${stronghold.site}-${stronghold.side}`,
      category: 'map',
      severity: 'positive',
      title: `${formatSite(stronghold.site)} on ${stronghold.map} is your stronghold`,
      detail: `${round(stronghold.winRate ?? 0)}% win rate across ${stronghold.rounds} rounds. Push this advantage harder and bait rotations toward it.`,
      priority: 58,
    });
  }

  return insights;
}

function economyInsights(economy: EconomyAnalysis): Insight[] {
  const insights: Insight[] = [];

  if (economy.overbuyCount >= 2) {
    insights.push({
      id: 'economy-overbuy',
      category: 'economy',
      severity: 'warning',
      title: 'You are over-buying on eco rounds',
      detail: `${economy.overbuyCount} eco rounds were bought up past ${OVERBUY_SPEND_THRESHOLD} credits per player, burning roughly ${economy.wastedCredits.toLocaleString()} team credits. Save those and the next round becomes a real full buy.`,
      priority: 78,
    });
  }

  if (economy.underbuyCount >= 2) {
    insights.push({
      id: 'economy-underbuy',
      category: 'economy',
      severity: 'negative',
      title: 'You are under-buying when the team needs a full buy',
      detail: `${economy.underbuyCount} full-buy rounds came in under ${UNDERBUY_SPEND_THRESHOLD} credits per player, so you were out-gunned before the first shot. Commit the credits or call the save early.`,
      priority: 80,
    });
  }

  const eco = economy.breakdown.find((entry) => entry.buyType === 'eco');
  if (eco && eco.rounds >= 4 && (eco.winRate ?? 100) <= 25) {
    insights.push({
      id: 'economy-eco-winrate',
      category: 'economy',
      severity: 'warning',
      title: `Your eco rounds almost never convert (${round(eco.winRate ?? 0)}%)`,
      detail: `Across ${eco.rounds} eco rounds you averaged ${eco.averageSpend} credits per player. Play for the stack-and-flank instead of the open duel.`,
      priority: 70,
    });
  }

  return insights;
}

function clutchInsights(clutch: ClutchAnalysis): Insight[] {
  if (clutch.attempts === 0 || clutch.winRate === null || clutch.expectedRate === null) return [];
  const diff = clutch.winRate - clutch.expectedRate;

  if (clutch.verdict === 'choking') {
    return [
      {
        id: 'clutch-choking',
        category: 'clutch',
        severity: 'negative',
        title: 'You are losing the rounds that decide games',
        detail: `You won ${round(clutch.winRate)}% of ${clutch.attempts} outnumbered situations versus a ${round(clutch.expectedRate)}% rank average (${round(Math.abs(diff))} points below). Play the clock and isolate duels instead of taking the open peek.`,
        priority: 86,
      },
    ];
  }

  if (clutch.verdict === 'clutch') {
    return [
      {
        id: 'clutch-strong',
        category: 'clutch',
        severity: 'positive',
        title: 'You are a genuine clutch player',
        detail: `You won ${round(clutch.winRate)}% of ${clutch.attempts} outnumbered situations, ${round(diff)} points above the rank average. Your composure under pressure is a real asset.`,
        priority: 84,
      },
    ];
  }

  return [];
}

function utilityInsights(utility: UtilitySummary): Insight[] {
  const insights: Insight[] = [];

  if (utility.flashAssists >= 4 && utility.flashKillConversion !== null) {
    insights.push({
      id: 'utility-flash-kills',
      category: 'utility',
      severity: 'positive',
      title: 'Your flashes are creating kills',
      detail: `${utility.flashAssists} teammate kills came directly off your flashes (${utility.flashesThrown} thrown, ${round(utility.flashKillConversion)}% conversion). Keep leading with them.`,
      priority: 76,
    });
  }

  if (utility.castsPerRound < 1.3 && utility.rounds > 0) {
    insights.push({
      id: 'utility-low-usage',
      category: 'utility',
      severity: 'warning',
      title: 'You are leaving utility on the table',
      detail: `You average ${utility.castsPerRound.toFixed(2)} ability casts per round. Ascendant-level agents sit around 1.7 — the cheapest win-rate you can buy is using your kit every round.`,
      priority: 74,
    });
  }

  return insights;
}

function benchmarkInsights(comparisons: MetricComparison[]): Insight[] {
  if (comparisons.length === 0) return [];
  const insights: Insight[] = [];

  const ranked = [...comparisons].sort((a, b) => b.playerTierIndex - a.playerTierIndex);
  const best = ranked[0];
  const worst = ranked[ranked.length - 1];

  if (best.playerTierIndex - worst.playerTierIndex >= 2) {
    insights.push({
      id: 'benchmark-split',
      category: 'aim',
      severity: 'warning',
      title: `Your ${best.metric.shortLabel} grades ${best.playerTier}, but your ${worst.metric.shortLabel} grades ${worst.playerTier}`,
      detail: `${best.metric.label} is ${best.playerTier}-level while ${worst.metric.label} is holding you at ${worst.playerTier}. ${worst.metric.description}`,
      priority: 95,
    });
  }

  const belowCurrent = comparisons.filter((entry) => !entry.meetsCurrent);
  if (belowCurrent.length > 0) {
    const names = belowCurrent.map((entry) => entry.metric.shortLabel).join(', ');
    insights.push({
      id: 'benchmark-below-current',
      category: 'aim',
      severity: 'warning',
      title: `${belowCurrent.length} of your metrics are below your current rank`,
      detail: `${names} are below the ${belowCurrent[0].currentRank} average. Close these before pushing for ${belowCurrent[0].targetRank}.`,
      priority: 66,
    });
  } else {
    insights.push({
      id: 'benchmark-ready',
      category: 'aim',
      severity: 'positive',
      title: `Every metric already meets your ${comparisons[0].currentRank} rank`,
      detail: `Your aim profile is ahead of your current rank. Climbing is now about consistency, not raw mechanics.`,
      priority: 60,
    });
  }

  return insights;
}

function openingDuelInsights(openingDuels: FirstDuelSummary): Insight[] {
  if (openingDuels.total < 6 || openingDuels.openingDuelWinRate === null) return [];
  const rate = openingDuels.openingDuelWinRate;

  if (rate >= 58) {
    return [
      {
        id: 'opening-duel-strong',
        category: 'aim',
        severity: 'positive',
        title: `You win the opening duel ${round(rate)}% of the time`,
        detail: `${openingDuels.firstBloods} first bloods against ${openingDuels.firstDeaths} opening deaths. Taking the first contact that often is how you snowball rounds.`,
        priority: 68,
      },
    ];
  }

  if (rate <= 42) {
    return [
      {
        id: 'opening-duel-weak',
        category: 'aim',
        severity: 'warning',
        title: `You are losing your opening duels (${round(rate)}% won)`,
        detail: `${openingDuels.firstDeaths} opening deaths versus ${openingDuels.firstBloods} first bloods. Take the first contact with a teammate's utility rather than dry-peeking.`,
        priority: 72,
      },
    ];
  }

  return [];
}

function roleInsights(roleGrades: RoleGrade[], mainRole: AgentRole): Insight[] {
  const main = roleGrades.find((grade) => grade.role === mainRole);
  if (!main || roleGrades.length < 2) return [];

  const ranked = [...roleGrades].sort((a, b) => b.score - a.score);
  const best = ranked[0];

  if (best.role !== mainRole && best.score - main.score >= 4) {
    return [
      {
        id: 'role-best-elsewhere',
        category: 'role',
        severity: 'warning',
        title: `You grade ${best.grade} on ${best.role} but only ${main.grade} on ${mainRole}`,
        detail: `Your ${mainRole} grade is held back by ${main.focus.toLowerCase()}. ${best.tagline} You may be playing the wrong role.`,
        priority: 82,
      },
    ];
  }

  if (main.score >= 80) {
    return [
      {
        id: 'role-strong',
        category: 'role',
        severity: 'positive',
        title: `You are a strong ${mainRole} (grade ${main.grade})`,
        detail:
          main.strengths.length > 0
            ? `Carrying on ${main.strengths.join(' and ')}. Your weakest link is still ${main.focus.toLowerCase()}.`
            : `Solid across the board. Keep building on it.`,
        priority: 64,
      },
    ];
  }

  return [];
}

/** Collects every candidate insight. Exported for testing individual rules. */
export function buildCandidateInsights(input: InsightInput): Insight[] {
  return [
    ...benchmarkInsights(input.comparisons),
    ...siteLeakInsights(input.sitePerformance),
    ...clutchInsights(input.clutch),
    ...roleInsights(input.roleGrades, input.mainRole),
    ...economyInsights(input.economy),
    ...utilityInsights(input.utility),
    ...openingDuelInsights(input.openingDuels),
  ];
}

/**
 * Picks the headline takeaways: highest priority first, preferring distinct
 * categories so the player never gets three variations of the same complaint.
 */
export function selectTopInsights(candidates: Insight[], limit = 3): Insight[] {
  const sorted = [...candidates].sort((a, b) => b.priority - a.priority);
  const chosen: Insight[] = [];
  const usedCategories = new Set<InsightCategory>();

  for (const insight of sorted) {
    if (chosen.length >= limit) break;
    if (usedCategories.has(insight.category)) continue;
    chosen.push(insight);
    usedCategories.add(insight.category);
  }

  if (chosen.length < limit) {
    for (const insight of sorted) {
      if (chosen.length >= limit) break;
      if (chosen.includes(insight)) continue;
      chosen.push(insight);
    }
  }

  return chosen;
}

/** Full pipeline: analyses in, top actionable takeaways out. */
export function generateInsights(input: InsightInput, limit = 3): Insight[] {
  return selectTopInsights(buildCandidateInsights(input), limit);
}

/** Orders a metric comparison list from the player's strongest to weakest tier. */
export function sortComparisonsByTier(comparisons: MetricComparison[]): MetricComparison[] {
  return [...comparisons].sort((a, b) => rankIndex(b.playerTier) - rankIndex(a.playerTier));
}
