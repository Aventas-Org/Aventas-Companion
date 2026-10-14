import type { Insight, InsightCategory, InsightSeverity } from '../services/insights';

const SEVERITY_STYLES: Record<
  InsightSeverity,
  { container: string; accent: string; text: string; label: string }
> = {
  positive: {
    container: 'border-emerald-500/25 bg-emerald-500/[0.06]',
    accent: 'text-emerald-300',
    text: 'text-emerald-300',
    label: 'Strength',
  },
  warning: {
    container: 'border-amber-500/25 bg-amber-500/[0.06]',
    accent: 'text-amber-300',
    text: 'text-amber-300',
    label: 'Watch',
  },
  negative: {
    container: 'border-red-500/25 bg-red-500/[0.06]',
    accent: 'text-red-300',
    text: 'text-red-300',
    label: 'Fix this',
  },
};

export const INSIGHT_CATEGORY_LABELS: Record<InsightCategory, string> = {
  map: 'Map',
  economy: 'Economy',
  clutch: 'Clutch',
  utility: 'Utility',
  aim: 'Mechanics',
  role: 'Role',
};

function InsightIcon({ severity }: { severity: InsightSeverity }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.9,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };

  if (severity === 'positive') {
    return (
      <svg {...common}>
        <path d="M22 7l-8.5 8.5-4-4L2 19" />
        <path d="M16 7h6v6" />
      </svg>
    );
  }

  if (severity === 'negative') {
    return (
      <svg {...common}>
        <path d="M22 17l-8.5-8.5-4 4L2 5" />
        <path d="M16 17h6v-6" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

interface InsightCardProps {
  insight: Insight;
}

/** A single automated takeaway with its severity and category. */
export function InsightCard({ insight }: InsightCardProps) {
  const styles = SEVERITY_STYLES[insight.severity];

  return (
    <article className={`rounded-lg border p-4 ${styles.container}`}>
      <div className="flex items-start gap-3">
        <span className={`mt-0.5 shrink-0 ${styles.accent}`}>
          <InsightIcon severity={insight.severity} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-line bg-line px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-ink-muted">
              {INSIGHT_CATEGORY_LABELS[insight.category]}
            </span>
            <span className={`text-[10px] font-semibold uppercase tracking-wider ${styles.text}`}>
              {styles.label}
            </span>
          </div>
          <h4 className="mt-2 text-sm font-semibold leading-snug text-ink">{insight.title}</h4>
          <p className="mt-1 text-xs leading-relaxed text-ink-muted">{insight.detail}</p>
        </div>
      </div>
    </article>
  );
}
