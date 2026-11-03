import type { ReactNode } from 'react';

/** The same visual vocabulary across Tracker, Events, Directory and Device. */
export function PageHeader({ eyebrow, title, description, action }: {
  eyebrow: string; title: string; description: string; action?: ReactNode;
}) {
  return <header className="flex flex-wrap items-end justify-between gap-4">
    <div className="min-w-0">
      <p className="page-kicker">{eyebrow}</p>
      <h1 className="page-heading mt-2">{title}</h1>
      <p className="page-description mt-3">{description}</p>
    </div>
    {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
  </header>;
}

export function SectionHeading({ title, detail, trailing }: { title: string; detail?: string; trailing?: ReactNode }) {
  return <div className="flex flex-wrap items-center justify-between gap-3">
    <div>
      <h2 className="font-display text-[18px] font-semibold tracking-[-.025em] text-ink">{title}</h2>
      {detail && <p className="mt-1 text-[12px] leading-5 text-ink-muted">{detail}</p>}
    </div>
    {trailing}
  </div>;
}

export function Signal({ tone = 'neutral', children }: {
  tone?: 'neutral' | 'live' | 'warning' | 'accent'; children: ReactNode;
}) {
  return <span className="a-chip" data-tone={tone}>
    <span className="a-status-dot" aria-hidden="true"/>
    {children}
  </span>;
}

export function EmptyWorkspace({ kicker, title, detail, action }: {
  kicker?: string; title: string; detail: string; action?: ReactNode;
}) {
  return <div className="a-empty relative overflow-hidden !p-7 md:!p-10">
    <div className="pointer-events-none absolute -right-10 -top-16 size-52 rounded-full border border-line/50" aria-hidden="true"/>
    <div className="pointer-events-none absolute right-4 top-0 size-28 rounded-full border border-line/40" aria-hidden="true"/>
    {kicker && <p className="a-eyebrow relative mb-3 uppercase tracking-[.13em]">{kicker}</p>}
    <p className="relative font-display text-[19px] font-semibold tracking-[-.02em] text-ink">{title}</p>
    <p className="relative mt-2 max-w-[480px] text-[12px] leading-6 text-ink-muted">{detail}</p>
    {action && <div className="relative mt-5">{action}</div>}
  </div>;
}

export function LoadingWorkspace({ label = 'Checking website records…' }: { label?: string }) {
  return <div className="a-panel space-y-5 p-6" role="status" aria-live="polite">
    <div className="flex items-center gap-3 text-[12px] text-ink-muted">
      <span className="size-[7px] animate-pulse rounded-full bg-accent" aria-hidden="true"/>
      {label}
    </div>
    <div className="grid gap-3 sm:grid-cols-3">
      {Array.from({length:3},(_,i)=><div key={i} className="h-20 animate-pulse rounded-[8px] bg-line/35"/>)}
    </div>
  </div>;
}

export function ErrorWorkspace({ detail, onRetry }: { detail: string; onRetry?: () => void }) {
  return <div className="a-panel flex flex-wrap items-center justify-between gap-4 border-amber-500/25 p-5" role="alert">
    <div>
      <p className="font-display text-[15px] font-semibold text-ink">Unable to sync this view</p>
      <p className="mt-1 max-w-[540px] text-[12px] leading-6 text-ink-muted">{detail}</p>
    </div>
    {onRetry && <button type="button" onClick={onRetry} className="a-button">Try again</button>}
  </div>;
}

export function MetricGrid({ values }: {
  values: Array<{ label: string; value: string; hint?: string; tone?: 'default' | 'accent' | 'positive' }>;
}) {
  return <div className="workspace-metrics">
    {values.map(item=><div key={item.label} className="workspace-metric">
      <p className="a-eyebrow">{item.label}</p>
      <p className={'a-number mt-2 text-[28px] leading-none sm:text-[34px] ' +
        (item.tone === 'positive' ? 'text-emerald-400' : item.tone === 'accent' ? 'text-accent' : 'text-ink')}>
        {item.value}
      </p>
      <p className="mt-2 min-h-[16px] text-[11px] text-ink-muted">{item.hint ?? '\u00a0'}</p>
    </div>)}
  </div>;
}

export function WorkspaceTabs<T extends string>({ items, value, onChange, label }: {
  items: ReadonlyArray<{ id: T; name: string }>; value: T;
  onChange: (id: T) => void; label: string;
}) {
  return <div className="workspace-tabs" role="group" aria-label={label}>
    {items.map(item=><button key={item.id} type="button" aria-pressed={value === item.id}
      className="workspace-tab" onClick={() => onChange(item.id)}>
      {item.name}
    </button>)}
  </div>;
}

export function formatMetric(value: unknown, decimals = 0, suffix = ''): string {
  return typeof value === 'number' && Number.isFinite(value) ? value.toFixed(decimals) + suffix : '—';
}
export function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
export function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? value as T[] : [];
}
export function formatStamp(value: unknown): string {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return 'Date unavailable';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : date.toLocaleDateString(undefined, { day:'2-digit',month:'short',year:'numeric' });
}
