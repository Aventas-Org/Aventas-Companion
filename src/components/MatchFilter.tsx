import type { MatchFilter } from '../types/match';

const OPTIONS: { value: MatchFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'wins', label: 'Wins' },
  { value: 'losses', label: 'Losses' },
];

interface MatchFilterProps {
  value: MatchFilter;
  onChange: (filter: MatchFilter) => void;
}

export function MatchFilter({ value, onChange }: MatchFilterProps) {
  return (
    <div className="inline-flex rounded-lg border border-white/10 bg-[#0f0f12] p-1">
      {OPTIONS.map((opt) => {
        const isActive = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            aria-pressed={isActive}
            className={[
              'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/70',
              isActive ? 'bg-purple-500/20 text-purple-200' : 'text-slate-400 hover:text-slate-200',
            ].join(' ')}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
