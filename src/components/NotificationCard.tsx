import type { ReactNode } from 'react';

export type NotificationTone = 'neutral' | 'success' | 'warning' | 'danger';

const LEFT_BORDERS: Record<NotificationTone, string> = {
  neutral: 'border-l-line',
  success: 'border-l-emerald-500',
  warning: 'border-l-amber-500',
  danger: 'border-l-accent',
};

const ICON_TONES: Record<NotificationTone, string> = {
  neutral: 'text-ink-muted',
  success: 'text-emerald-400',
  warning: 'text-amber-400',
  danger: 'text-accent',
};

const PILL_TONES: Record<NotificationTone, string> = {
  neutral: 'bg-line text-ink-muted',
  success: 'bg-emerald-500/10 text-emerald-300',
  warning: 'bg-amber-500/10 text-amber-300',
  danger: 'bg-accent/10 text-accent',
};

interface NotificationCardProps {
  title: string;
  description: string;
  tone?: NotificationTone;
  icon?: ReactNode;
  /** Short right-aligned state pill, e.g. "Active". */
  statusLabel?: string;
  /** Renders a skeleton bar instead of the description while data loads. */
  loading?: boolean;
}

/**
 * Inline status/notification card.
 *
 * Deliberately lightweight: one hairline border plus a single thicker accent
 * rule on the left edge, so it sits inside a content column without breaking the
 * surrounding layout the way a full-width coloured block does.
 */
export function NotificationCard({
  title,
  description,
  tone = 'neutral',
  icon,
  statusLabel,
  loading = false,
}: NotificationCardProps) {
  return (
    <div
      className={`rounded-lg border border-line border-l-2 bg-panel px-4 py-3.5 ${LEFT_BORDERS[tone]}`}
    >
      <div className="flex items-start gap-3">
        {icon && <span className={`mt-0.5 shrink-0 ${ICON_TONES[tone]}`}>{icon}</span>}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] font-semibold uppercase leading-none tracking-[0.05em] text-ink">
              {title}
            </p>
            {statusLabel && (
              <span
                className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.05em] ${PILL_TONES[tone]}`}
              >
                {statusLabel}
              </span>
            )}
          </div>

          {loading ? (
            <div className="mt-2.5 flex flex-col gap-1.5">
              <div className="h-2 w-2/3 animate-pulse rounded bg-line" />
              <div className="h-2 w-1/3 animate-pulse rounded bg-line" />
            </div>
          ) : (
            <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
}
