import type { ReactNode } from 'react';

interface SectionCardProps {
  title: string;
  subtitle?: string;
  /** Rendered on the right of the header, e.g. a toggle or a badge. */
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

/** Panel wrapper shared by the analysis views. Matches the app's card styling. */
export function SectionCard({ title, subtitle, action, children, className }: SectionCardProps) {
  return (
    <section className={['rounded-lg border border-line bg-panel p-5', className ?? ''].join(' ')}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-ink-muted">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-ink-muted">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}
