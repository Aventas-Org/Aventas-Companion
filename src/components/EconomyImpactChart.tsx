import type { BuyType } from '../types/analysis';
import type { EconomyAnalysis } from '../services/analysisStats';

const BAR_COLORS: Record<BuyType, string> = {
  eco: 'bg-slate-500',
  force: 'bg-amber-400',
  half: 'bg-sky-400',
  full: 'bg-purple-400',
};

function winRateColor(winRate: number | null): string {
  if (winRate === null) return 'text-slate-500';
  if (winRate >= 60) return 'text-emerald-300';
  if (winRate >= 45) return 'text-amber-300';
  return 'text-red-300';
}

interface EconomyImpactChartProps {
  economy: EconomyAnalysis;
}

/** Win rate by spending posture, plus the specific rounds that leaked credits. */
export function EconomyImpactChart({ economy }: EconomyImpactChartProps) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-4">
        {economy.breakdown.map((entry) => {
          const winRate = entry.winRate ?? 0;
          const hasRounds = entry.rounds > 0;
          return (
            <div key={entry.buyType} className={hasRounds ? '' : 'opacity-40'}>
              <div className="flex flex-wrap items-baseline justify-between gap-2 text-xs">
                <span className="font-medium text-slate-300">{entry.label}</span>
                <span className="text-slate-500">
                  {entry.rounds} rounds · {entry.averageSpend} avg credits
                </span>
                <span className={`font-semibold ${winRateColor(entry.winRate)}`}>
                  {entry.winRate === null ? 'N/A' : `${Math.round(entry.winRate)}%`}
                </span>
              </div>
              <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-white/5">
                <div
                  className={`h-full rounded-full ${BAR_COLORS[entry.buyType]} transition-[width]`}
                  style={{ width: `${Math.min(100, Math.max(0, winRate))}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/5 pt-3 text-[11px] text-slate-500">
        <span>Bars are round win rate per buy type.</span>
        <span>50% would be an even split.</span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
          <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
            Over-buys on eco
          </p>
          <p className="mt-1 text-xl font-semibold text-amber-300">{economy.overbuyCount}</p>
        </div>
        <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
          <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
            Under-buys on full
          </p>
          <p className="mt-1 text-xl font-semibold text-red-300">{economy.underbuyCount}</p>
        </div>
        <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
          <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
            Credits burned
          </p>
          <p className="mt-1 text-xl font-semibold text-slate-200">
            {economy.wastedCredits.toLocaleString()}
          </p>
        </div>
      </div>

      {economy.flags.length > 0 && (
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
            Flagged rounds
          </p>
          <ul className="mt-2 flex flex-col gap-2">
            {economy.flags.slice(0, 4).map((flag) => (
              <li
                key={`${flag.matchId}-${flag.round}`}
                className="flex items-start gap-2 rounded-md border border-white/5 bg-[#0f0f12] p-2.5"
              >
                <span
                  className={[
                    'mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
                    flag.kind === 'overbuy'
                      ? 'bg-amber-500/15 text-amber-300'
                      : 'bg-red-500/15 text-red-300',
                  ].join(' ')}
                >
                  {flag.kind === 'overbuy' ? 'Over-buy' : 'Under-buy'}
                </span>
                <div>
                  <p className="text-xs text-slate-300">
                    {flag.map} · round {flag.round} · {flag.spend} avg credits
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-500">{flag.note}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
