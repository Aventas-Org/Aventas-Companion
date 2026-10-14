export interface Segment<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  value: T;
  options: ReadonlyArray<Segment<T>>;
  onChange: (value: T) => void;
  ariaLabel: string;
}

/** Small segmented toggle, sharing the look of the match-history filter. */
export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="inline-flex rounded-lg border border-white/10 bg-[#0f0f12] p-1"
    >
      {options.map((option) => {
        const isActive = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={isActive}
            className={[
              'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/70',
              isActive ? 'bg-purple-500/20 text-purple-200' : 'text-slate-400 hover:text-slate-200',
            ].join(' ')}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
