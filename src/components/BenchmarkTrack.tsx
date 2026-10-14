import type { MetricComparison } from '../services/analysisStats';
import { formatMetricValue } from '../services/analysisStats';

interface BenchmarkTrackProps {
  comparison: MetricComparison;
}

/** Clamps a value into a 0-100 percentage across the metric's rank ladder. */
function positionOf(value: number, lo: number, hi: number): number {
  const span = hi - lo || 1;
  return Math.min(100, Math.max(0, ((value - lo) / span) * 100));
}

/**
 * A single metric rendered as a track from Iron to Radiant, with markers for the
 * player, their current rank's average, and their target rank's average.
 */
export function BenchmarkTrack({ comparison }: BenchmarkTrackProps) {
  const bands = comparison.metric.bands;
  const lo = bands[0].min;
  const hi = bands[bands.length - 1].min;

  const playerPos = positionOf(comparison.playerValue, lo, hi);
  const currentPos = positionOf(comparison.currentRankValue, lo, hi);
  const targetPos = positionOf(comparison.targetRankValue, lo, hi);

  const status = comparison.meetsTarget
    ? { label: 'Above target', className: 'bg-emerald-500/15 text-emerald-300' }
    : comparison.meetsCurrent
      ? { label: 'On pace', className: 'bg-amber-500/15 text-amber-300' }
      : { label: 'Behind rank', className: 'bg-red-500/15 text-red-300' };

  return (
    <div className="rounded-lg border border-line bg-panel p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-ink">{comparison.metric.label}</p>
          <p className="mt-0.5 text-[11px] text-ink-muted">{comparison.metric.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-semibold text-ink">
            {comparison.playerTier}
          </span>
          <span
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${status.className}`}
          >
            {status.label}
          </span>
        </div>
      </div>

      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-lg font-semibold text-ink">
          {formatMetricValue(comparison.playerValue, comparison.metric.unit)}
        </span>
        <span className="text-[11px] text-ink-muted">
          {comparison.meetsTarget ? 'meets' : 'vs'} {comparison.targetRank} target{' '}
          {formatMetricValue(comparison.targetRankValue, comparison.metric.unit)}
        </span>
      </div>

      <div className="mt-3">
        <div className="relative h-2 rounded-full bg-line">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-accent/25 to-accent/70"
            style={{ width: `${playerPos}%` }}
          />
          {/* Current rank average */}
          <span
            className="absolute -top-1 h-4 w-0.5 rounded bg-ink-muted"
            style={{ left: `${currentPos}%` }}
            title={`${comparison.currentRank} average`}
          />
          {/* Target rank average */}
          <span
            className="absolute -top-1 h-4 w-0.5 rounded bg-amber-400"
            style={{ left: `${targetPos}%` }}
            title={`${comparison.targetRank} average`}
          />
          {/* Player marker */}
          <span
            className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-app bg-accent"
            style={{ left: `${playerPos}%` }}
            title={`You: ${formatMetricValue(comparison.playerValue, comparison.metric.unit)}`}
          />
        </div>
        <div className="mt-2 flex justify-between text-[10px] text-ink-muted">
          <span>{bands[0].rank}</span>
          <span>{bands[bands.length - 1].rank}</span>
        </div>
      </div>
    </div>
  );
}

/** Explains the three markers used across the benchmark tracks. */
export function BenchmarkLegend() {
  return (
    <div className="flex flex-wrap items-center gap-4 text-[11px] text-ink-muted">
      <span className="flex items-center gap-2">
        <span className="h-3 w-3 rounded-full bg-accent" aria-hidden="true" />
        You
      </span>
      <span className="flex items-center gap-2">
        <span className="h-3 w-0.5 rounded bg-ink-muted" aria-hidden="true" />
        Current rank average
      </span>
      <span className="flex items-center gap-2">
        <span className="h-3 w-0.5 rounded bg-amber-400" aria-hidden="true" />
        Target rank average
      </span>
    </div>
  );
}
