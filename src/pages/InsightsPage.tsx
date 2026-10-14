import { useState } from 'react';
import { DemoDataNotice } from '../components/DemoDataNotice';
import { INSIGHT_CATEGORY_LABELS, InsightCard } from '../components/InsightCard';
import { SectionCard } from '../components/SectionCard';
import { SegmentedControl } from '../components/SegmentedControl';
import { useAnalysis } from '../hooks/useAnalysis';

type WindowId = 'recent' | 'history';

const WINDOW_OPTIONS = [
  { value: 'recent' as const, label: 'Last 5 games' },
  { value: 'history' as const, label: 'Last 20 games' },
];

function pct(value: number | null): string {
  return value === null ? 'N/A' : `${Math.round(value)}%`;
}

export function InsightsPage() {
  const { history, recent } = useAnalysis();
  const [windowId, setWindowId] = useState<WindowId>('recent');
  const view = windowId === 'recent' ? recent : history;

  const headlineIds = new Set(view.insights.map((insight) => insight.id));
  const remaining = view.allInsights.filter((insight) => !headlineIds.has(insight.id));

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-ink">Insights</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Automated takeaways from your match data — no numbers to decode, just what to change
            before your next queue.
          </p>
        </div>
        <SegmentedControl
          ariaLabel="Insights window"
          value={windowId}
          options={WINDOW_OPTIONS}
          onChange={setWindowId}
        />
      </div>

      <DemoDataNotice />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-line bg-panel p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-ink-muted">Record</p>
          <p className="mt-2 text-2xl font-semibold text-ink">
            {view.record.wins}
            <span className="text-ink-muted">W</span> {view.record.losses}
            <span className="text-ink-muted">L</span>
          </p>
          <p className="mt-1 text-[11px] text-ink-muted">
            {pct(view.record.winRate)} win rate over {view.record.matches} matches
          </p>
        </div>
        <div className="rounded-lg border border-line bg-panel p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-ink-muted">
            Rounds analysed
          </p>
          <p className="mt-2 text-2xl font-semibold text-accent">{view.rounds.length}</p>
          <p className="mt-1 text-[11px] text-ink-muted">
            {view.utility.flashAssists} teammate kills created by your flashes
          </p>
        </div>
        <div className="rounded-lg border border-line bg-panel p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-ink-muted">
            Top focus right now
          </p>
          <p className="mt-2 text-sm font-semibold leading-snug text-amber-300">
            {view.insights[0]?.title ?? 'No standout issue — keep grinding.'}
          </p>
        </div>
      </div>

      <SectionCard
        title="This week's takeaways"
        subtitle="The three highest-impact findings, ranked by how much they are costing you."
      >
        {view.insights.length === 0 ? (
          <p className="rounded-lg border border-dashed border-line bg-panel px-4 py-10 text-center text-sm text-ink-muted">
            Not enough data in this window to generate takeaways yet.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {view.insights.map((insight) => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </div>
        )}
      </SectionCard>

      {remaining.length > 0 && (
        <SectionCard
          title={`All signals (${remaining.length})`}
          subtitle="Everything else the analysis noticed, in case you want to dig deeper."
        >
          <div className="flex flex-col gap-3">
            {remaining.map((insight) => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </div>
          <p className="mt-4 text-[11px] text-ink-muted">
            Categories: {Object.values(INSIGHT_CATEGORY_LABELS).join(' · ')}
          </p>
        </SectionCard>
      )}
    </div>
  );
}
