import { useMemo, useState } from 'react';
import { ClutchBreakdown } from '../components/ClutchBreakdown';
import { DemoDataNotice } from '../components/DemoDataNotice';
import { EconomyImpactChart } from '../components/EconomyImpactChart';
import { MapHeatmap, type HeatMode } from '../components/MapHeatmap';
import { SectionCard } from '../components/SectionCard';
import { SegmentedControl } from '../components/SegmentedControl';
import { StatCard } from '../components/StatCard';
import { useAnalysis } from '../hooks/useAnalysis';
import { collectFirstDuels, summarizeFirstDuels } from '../services/analysisStats';

type WindowId = 'history' | 'recent';

const WINDOW_OPTIONS = [
  { value: 'history' as const, label: 'Last 20 games' },
  { value: 'recent' as const, label: 'Last 5 games' },
];

const HEAT_OPTIONS = [
  { value: 'both' as const, label: 'Both' },
  { value: 'bloods' as const, label: 'First bloods' },
  { value: 'deaths' as const, label: 'First deaths' },
];

function pct(value: number | null): string {
  return value === null ? 'N/A' : `${Math.round(value)}%`;
}

export function PerformancePage() {
  const { history, recent } = useAnalysis();
  const [windowId, setWindowId] = useState<WindowId>('history');
  const view = windowId === 'history' ? history : recent;

  const [heatMode, setHeatMode] = useState<HeatMode>('both');
  const [pinnedMap, setPinnedMap] = useState<string | null>(null);

  const allCells = useMemo(() => collectFirstDuels(view.rounds), [view.rounds]);

  // Maps ordered by how many opening duels were recorded on them.
  const mapCells = useMemo(() => {
    const byMap = new Map<string, typeof allCells>();
    for (const cell of allCells) {
      const list = byMap.get(cell.map);
      if (list) list.push(cell);
      else byMap.set(cell.map, [cell]);
    }
    return [...byMap.entries()]
      .map(([map, cells]) => ({ map, cells, summary: summarizeFirstDuels(cells) }))
      .sort((a, b) => b.cells.length - a.cells.length);
  }, [allCells]);

  const activeMap =
    pinnedMap && mapCells.some((entry) => entry.map === pinnedMap)
      ? pinnedMap
      : (mapCells[0]?.map ?? 'Ascent');

  const activeCells = useMemo(
    () => allCells.filter((cell) => cell.map === activeMap),
    [allCells, activeMap],
  );

  const openingDuels = useMemo(() => summarizeFirstDuels(allCells), [allCells]);
  const eco = view.economy.breakdown.find((entry) => entry.buyType === 'eco') ?? null;

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-white">Round Analysis</h2>
          <p className="mt-1 text-sm text-slate-400">
            Round-by-round context: where your opening duels happen, how your economy converts, and
            how you hold up when you are outnumbered.
          </p>
        </div>
        <SegmentedControl
          ariaLabel="Analysis window"
          value={windowId}
          options={WINDOW_OPTIONS}
          onChange={setWindowId}
        />
      </div>

      <DemoDataNotice />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Rounds Analysed"
          value={String(view.rounds.length)}
          helper={`${view.matches.length} matches · ${pct(view.record.winRate)} win rate`}
          accent="slate"
        />
        <StatCard
          label="Opening Duel Win Rate"
          value={pct(openingDuels.openingDuelWinRate)}
          helper={`${openingDuels.firstBloods} first bloods · ${openingDuels.firstDeaths} first deaths`}
          accent="purple"
        />
        <StatCard
          label="Clutch Win Rate"
          value={pct(view.clutch.winRate)}
          helper={`${view.clutch.wins}/${view.clutch.attempts} outnumbered rounds won`}
          accent={view.clutch.verdict === 'choking' ? 'amber' : 'purple'}
        />
        <StatCard
          label="Eco Round Win Rate"
          value={pct(eco?.winRate ?? null)}
          helper={
            eco ? `${eco.rounds} eco rounds · ${eco.averageSpend} avg credits` : 'No eco rounds'
          }
          accent="slate"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <SectionCard
          title="First blood / first death heatmap"
          subtitle={`${activeCells.length} opening duels plotted on ${activeMap}.`}
          className="xl:col-span-2"
          action={
            <SegmentedControl
              ariaLabel="Heatmap layer"
              value={heatMode}
              options={HEAT_OPTIONS}
              onChange={setHeatMode}
            />
          }
        >
          <div className="mb-4 flex flex-wrap gap-2">
            {mapCells.map((entry) => {
              const isActive = entry.map === activeMap;
              return (
                <button
                  key={entry.map}
                  type="button"
                  onClick={() => setPinnedMap(entry.map)}
                  aria-pressed={isActive}
                  className={[
                    'rounded-md border px-3 py-1.5 text-xs font-medium transition-colors',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/70',
                    isActive
                      ? 'border-purple-500/40 bg-purple-500/10 text-purple-200'
                      : 'border-white/10 bg-white/[0.02] text-slate-400 hover:text-slate-200',
                  ].join(' ')}
                >
                  {entry.map}
                  <span className="ml-2 text-slate-500">{entry.cells.length}</span>
                </button>
              );
            })}
          </div>
          <MapHeatmap map={activeMap} cells={activeCells} mode={heatMode} />
        </SectionCard>

        <SectionCard
          title="Opening duels by map"
          subtitle="Where your first contacts are being won and lost."
        >
          <div className="flex flex-col gap-2">
            {mapCells.map((entry) => {
              const rate = entry.summary.openingDuelWinRate ?? 0;
              return (
                <div
                  key={entry.map}
                  className="flex items-center justify-between gap-3 rounded-md border border-white/5 bg-white/[0.02] px-3 py-2.5"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-200">{entry.map}</p>
                    <p className="text-[11px] text-slate-500">
                      {entry.summary.firstBloods} bloods · {entry.summary.firstDeaths} deaths
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-sm font-semibold ${
                        rate >= 55
                          ? 'text-emerald-300'
                          : rate >= 45
                            ? 'text-amber-300'
                            : 'text-red-300'
                      }`}
                    >
                      {Math.round(rate)}%
                    </p>
                    <p className="text-[11px] text-slate-500">{entry.cells.length} duels</p>
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Economy vs win rate"
        subtitle="Whether your buy decisions are converting rounds or burning credits."
      >
        <EconomyImpactChart economy={view.economy} />
      </SectionCard>

      <SectionCard
        title="Clutch breakdown"
        subtitle="Performance in outnumbered situations, split by man advantage."
      >
        <ClutchBreakdown clutch={view.clutch} />
      </SectionCard>
    </div>
  );
}
