import type { ReactNode } from 'react';

export type InfoTone = 'neutral' | 'accent' | 'success' | 'warning';

const TITLE_TONES: Record<InfoTone, string> = {
  neutral: 'text-ink',
  accent: 'text-accent',
  success: 'text-emerald-300',
  warning: 'text-amber-300',
};

const ICON_TONES: Record<InfoTone, string> = {
  neutral: 'bg-line text-ink',
  accent: 'bg-accent/10 text-accent',
  success: 'bg-emerald-500/10 text-emerald-300',
  warning: 'bg-amber-500/10 text-amber-300',
};

interface InfoCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  tone?: InfoTone;
  footer?: ReactNode;
}

export function InfoCard({ title, description, icon, tone = 'neutral', footer }: InfoCardProps) {
  return (
    <div className="flex flex-col rounded-lg border border-line bg-panel p-5">
      <div className="flex items-center gap-3">
        <span className={`flex h-9 w-9 items-center justify-center rounded-md ${ICON_TONES[tone]}`}>
          {icon}
        </span>
        <h3 className={`text-sm font-semibold tracking-tight ${TITLE_TONES[tone]}`}>{title}</h3>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-ink-muted">{description}</p>
      {footer && <div className="mt-4 border-t border-line pt-3">{footer}</div>}
    </div>
  );
}
