import { DemoDataNotice } from '../components/DemoDataNotice';
import { StatCard } from '../components/StatCard';
import { TrendChart } from '../components/TrendChart';
import { getDemoMatches } from '../services/matchData';
import { computeMatchStats, buildTrendSeries, formatMetric } from '../services/matchStats';

export function StatisticsPage() {
  const matches = getDemoMatches('all');
  const stats = computeMatchStats(matches);
  const trend = buildTrendSeries(matches);

  const hasData = matches.length > 0;

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-white">Statistics</h2>
        <p className="mt-1 text-sm text-slate-400">
          Aggregated performance metrics derived from your match history.
        </p>
      </div>

      {/* Demo data notice */}
      <DemoDataNotice />

      {!hasData ? (
        <EmptyState />
      ) : (
        <>
          {/* Summary stat cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Total Matches"
              value={String(stats.totalMatches)}
              helper="Matches in dataset"
              accent="slate"
            />
            <StatCard
              label="Win Rate"
              value={formatMetric(stats.winRate, 1, '%')}
              helper={`${stats.wins}W / ${stats.losses}L`}
              accent="purple"
            />
            <StatCard
              label="K/D Ratio"
              value={formatMetric(stats.overallKd)}
              helper="Total kills ÷ total deaths"
              accent="slate"
            />
            <StatCard
              label="Average ACS"
              value={formatMetric(stats.averageAcs)}
              helper="Combat score average"
              accent="purple"
            />
          </div>

          {/* KDA + ACS grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="rounded-lg border border-white/5 bg-white/[0.02] p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                Kill / Death / Assist Totals
              </h3>
              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="text-center">
                  <p className="text-2xl font-semibold text-emerald-400">{stats.totalKills}</p>
                  <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-500">
                    Kills
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-semibold text-red-400">{stats.totalDeaths}</p>
                  <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-500">
                    Deaths
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-semibold text-slate-300">{stats.totalAssists}</p>
                  <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-500">
                    Assists
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-white/5 bg-white/[0.02] p-5 lg:col-span-2">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                Performance Trend
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                ACS per match over the most recent {trend.length} games.
              </p>
              <TrendChart points={trend} />
            </div>
          </div>

          {/* Wins / Losses breakdown */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-lg border border-white/5 bg-white/[0.02] p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                Victories
              </h3>
              <p className="mt-1 text-3xl font-semibold text-emerald-300">{stats.wins}</p>
              <p className="mt-0.5 text-xs text-slate-500">
                {formatMetric(stats.winRate, 1, '%')} win rate across all matches
              </p>
            </div>
            <div className="rounded-lg border border-white/5 bg-white/[0.02] p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                Defeats
              </h3>
              <p className="mt-1 text-3xl font-semibold text-red-300">{stats.losses}</p>
              <p className="mt-0.5 text-xs text-slate-500">
                {formatMetric(100 - (stats.winRate ?? 0), 1, '%')} loss rate across all matches
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-white/10 bg-white/[0.02] px-6 py-16 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-300">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M4 20V10" />
          <path d="M10 20V4" />
          <path d="M16 20v-6" />
          <path d="M22 20H2" />
        </svg>
      </div>
      <p className="text-sm text-slate-400">
        No match data available. Statistics will populate once matches are recorded.
      </p>
    </div>
  );
}
