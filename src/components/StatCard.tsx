interface StatCardProps {
  label: string;
  value: string;
  helper: string;
  accent?: 'purple' | 'amber' | 'slate';
}

const ACCENT_CLASSES: Record<NonNullable<StatCardProps['accent']>, string> = {
  purple: 'text-purple-300',
  amber: 'text-amber-300',
  slate: 'text-slate-300',
};

export function StatCard({ label, value, helper, accent = 'slate' }: StatCardProps) {
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4">
      <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${ACCENT_CLASSES[accent]}`}>{value}</p>
      <p className="mt-1 text-[11px] text-slate-500">{helper}</p>
    </div>
  );
}
