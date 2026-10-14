import type { ClutchAnalysis } from '../services/analysisStats';

const VERDICT_STYLES: Record<
  ClutchAnalysis['verdict'],
  { label: string; className: string; blurb: string }
> = {
  clutch: {
    label: 'Clutch player',
    className: 'bg-emerald-500/15 text-emerald-300',
    blurb: 'You win more than your share of outnumbered rounds.',
  },
  steady: {
    label: 'Steady under pressure',
    className: 'bg-slate-500/15 text-slate-300',
    blurb: 'You convert clutches at roughly the rank average.',
  },
  choking: {
    label: 'Losing the clutch',
    className: 'bg-red-500/15 text-red-300',
    blurb: 'You convert fewer clutches than the rank average.',
  },
};

interface ClutchBreakdownProps {
  clutch: ClutchAnalysis;
}

/** Performance specifically in outnumbered situations, versus rank benchmarks. */
export function ClutchBreakdown({ clutch }: ClutchBreakdownProps) {
  const verdict = VERDICT_STYLES[clutch.verdict];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${verdict.className}`}>
            {verdict.label}
          </span>
          <span className="text-xs text-slate-500">{verdict.blurb}</span>
        </div>
        <span className="text-xs text-slate-400">
          {clutch.wins}/{clutch.attempts} situations won
          {clutch.winRate !== null && clutch.expectedRate !== null && (
            <>
              {' · '}
              <span className="text-slate-300">{Math.round(clutch.winRate)}%</span>
              {' vs '}
              {Math.round(clutch.expectedRate)}% rank average
            </>
          )}
        </span>
      </div>

      {clutch.breakdown.length === 0 ? (
        <p className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] px-4 py-8 text-center text-xs text-slate-500">
          No clutch situations recorded in this window.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {clutch.breakdown.map((entry) => {
            const winRate = entry.winRate ?? 0;
            const ahead = entry.delta >= 0;
            return (
              <div
                key={entry.type}
                className="rounded-lg border border-white/5 bg-white/[0.02] p-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-200">{entry.type}</span>
                  <span className="text-[11px] text-slate-500">
                    {entry.wins}/{entry.attempts}
                  </span>
                </div>
                <p
                  className={`mt-1 text-lg font-semibold ${ahead ? 'text-emerald-300' : 'text-red-300'}`}
                >
                  {Math.round(winRate)}%
                </p>
                <div className="relative mt-2 h-1.5 w-full rounded-full bg-white/5">
                  <div
                    className={`h-full rounded-full ${ahead ? 'bg-emerald-400' : 'bg-red-400'}`}
                    style={{ width: `${Math.min(100, Math.max(0, winRate))}%` }}
                  />
                  {/* Rank-average benchmark tick */}
                  <span
                    className="absolute -top-1 h-3.5 w-0.5 bg-slate-400"
                    style={{ left: `${Math.min(100, Math.max(0, entry.benchmark))}%` }}
                    title={`Rank average ${entry.benchmark}%`}
                  />
                </div>
                <p className="mt-1.5 text-[10px] text-slate-500">
                  Avg {entry.benchmark}% ·{' '}
                  <span className={ahead ? 'text-emerald-400' : 'text-red-400'}>
                    {entry.delta >= 0 ? '+' : ''}
                    {Math.round(entry.delta)} pts
                  </span>
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
