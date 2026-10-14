interface StatCardProps {
  label: string;
  value: string;
  helper: string;
  tone?: 'default' | 'accent' | 'warning';
}

const VALUE_TONES: Record<NonNullable<StatCardProps['tone']>, string> = {
  default: 'text-ink',
  accent: 'text-accent',
  warning: 'text-amber-300',
};

/**
 * Metric card with a tightened three-line hierarchy:
 * 11px uppercase label, 24px metric, 12px muted helper. Vertical rhythm is kept
 * tight on purpose so a row of cards reads as one dense block of data.
 */
export function StatCard({ label, value, helper, tone = 'default' }: StatCardProps) {
  return (
    <div className="rounded-lg border border-line bg-panel px-4 py-3.5">
      <p className="text-[11px] font-medium uppercase leading-none tracking-[0.05em] text-ink-muted">
        {label}
      </p>
      <p className={`mt-2 text-2xl font-semibold leading-none ${VALUE_TONES[tone]}`}>{value}</p>
      <p className="mt-2 text-xs leading-none text-ink-muted">{helper}</p>
    </div>
  );
}
