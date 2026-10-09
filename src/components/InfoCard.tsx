import type { ReactNode } from 'react';

interface InfoCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  accent?: 'purple' | 'slate' | 'green' | 'amber';
  footer?: ReactNode;
}

export function InfoCard({ title, description, icon, accent = 'slate', footer }: InfoCardProps) {
  const titleColor =
    accent === 'purple'
      ? 'text-purple-300'
      : accent === 'green'
        ? 'text-emerald-300'
        : accent === 'amber'
          ? 'text-amber-300'
          : 'text-slate-200';

  const iconBg =
    accent === 'purple'
      ? 'bg-purple-500/10 text-purple-300'
      : accent === 'green'
        ? 'bg-emerald-500/10 text-emerald-300'
        : accent === 'amber'
          ? 'bg-amber-500/10 text-amber-300'
          : 'bg-slate-500/10 text-slate-300';

  return (
    <div className="flex flex-col rounded-lg border border-white/5 bg-white/[0.02] p-5">
      <div className="flex items-center gap-3">
        <span className={`flex h-9 w-9 items-center justify-center rounded-md ${iconBg}`}>
          {icon}
        </span>
        <h3 className={`text-base font-semibold ${titleColor}`}>{title}</h3>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-slate-400">{description}</p>
      {footer && <div className="mt-4 pt-3 border-t border-white/5">{footer}</div>}
    </div>
  );
}
