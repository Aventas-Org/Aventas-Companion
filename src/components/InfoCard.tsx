import type { ReactNode } from 'react';

interface InfoCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  accent?: 'purple' | 'slate';
  footer?: ReactNode;
}

export function InfoCard({ title, description, icon, accent = 'slate', footer }: InfoCardProps) {
  const titleColor = accent === 'purple' ? 'text-purple-300' : 'text-slate-200';
  return (
    <div className="flex flex-col rounded-lg border border-white/5 bg-white/[0.02] p-5">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-purple-500/10 text-purple-300">
          {icon}
        </span>
        <h3 className={`text-base font-semibold ${titleColor}`}>{title}</h3>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-slate-400">{description}</p>
      {footer && <div className="mt-4 pt-3 border-t border-white/5">{footer}</div>}
    </div>
  );
}
