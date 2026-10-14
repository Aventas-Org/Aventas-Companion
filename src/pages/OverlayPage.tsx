import { useAnalysis } from '../hooks/useAnalysis';

/**
 * The in-game overlay HUD.
 *
 * SCOPE NOTE — this HUD is deliberately limited to the player's *own historical*
 * statistics. Riot's third-party application policy prohibits overlays that
 * deliver real-time competitive information or expose information the game
 * intentionally hides, so opponent economy/economy alerts, live ultimate timers
 * and live enemy positions are intentionally not implemented. What is shown here
 * is post-match data the player already owns, surfaced during downtime.
 *
 * The root element is pointer-transparent so the transparent regions never
 * swallow input; the panel itself opts back into pointer events.
 */

function pct(value: number | null): string {
  return value === null ? '—' : `${Math.round(value)}%`;
}

function StatRow({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-[11px] uppercase tracking-wider text-slate-500">{label}</span>
      <span className="text-right">
        <span className="text-sm font-semibold text-slate-100">{value}</span>
        {hint && <span className="ml-1.5 text-[11px] text-slate-500">{hint}</span>}
      </span>
    </div>
  );
}

export function OverlayPage() {
  const { recent } = useAnalysis();
  const { record, openingDuels, clutch, economy, utility, insights } = recent;
  const focus = insights[0];

  return (
    <div className="pointer-events-none fixed inset-0 select-none p-6">
      <div className="pointer-events-auto absolute bottom-6 left-6 w-80 rounded-xl border border-white/10 bg-[#0b0b0e]/90 p-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold tracking-tight text-white">Aventas Overlay</span>
          <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-300">
            Demo data
          </span>
        </div>

        <div className="mt-3 flex flex-col gap-2.5">
          <StatRow
            label="Last 5 games"
            value={`${record.wins}W ${record.losses}L`}
            hint={pct(record.winRate)}
          />
          <StatRow
            label="Opening duels"
            value={pct(openingDuels.openingDuelWinRate)}
            hint={`${openingDuels.firstBloods} FB`}
          />
          <StatRow
            label="Clutches"
            value={pct(clutch.winRate)}
            hint={`${clutch.wins}/${clutch.attempts}`}
          />
          <StatRow
            label="Buy discipline"
            value={`${economy.overbuyCount} over`}
            hint={`${economy.underbuyCount} under`}
          />
          <StatRow label="Utility" value={utility.castsPerRound.toFixed(2)} hint="casts / round" />
        </div>

        {focus && (
          <div className="mt-3 rounded-lg border border-white/10 bg-white/[0.04] p-2.5">
            <p className="text-[10px] uppercase tracking-wider text-slate-500">
              Focus before next queue
            </p>
            <p className="mt-1 text-xs font-medium leading-snug text-amber-200">{focus.title}</p>
          </div>
        )}

        <p className="mt-3 border-t border-white/5 pt-2.5 text-[10px] leading-relaxed text-slate-500">
          Your own post-match stats only. Live opponent intel is intentionally not shown — Riot’s
          third-party policy prohibits overlays that deliver real-time competitive information.
        </p>
      </div>
    </div>
  );
}
