import type { RoleGrade } from '../services/analysisStats';
import { formatMetricValue } from '../services/analysisStats';

function gradeColor(score: number): string {
  if (score >= 80) return 'text-emerald-300';
  if (score >= 65) return 'text-accent';
  if (score >= 50) return 'text-amber-300';
  return 'text-red-300';
}

interface RoleGradeCardProps {
  grade: RoleGrade;
  /** Marks the role the player actually mains. */
  primary?: boolean;
}

/** Role-specific grade: judges each role by what that role is supposed to do. */
export function RoleGradeCard({ grade, primary = false }: RoleGradeCardProps) {
  return (
    <div
      className={[
        'flex flex-col rounded-lg border p-5',
        primary ? 'border-accent/40 bg-accent/[0.06]' : 'border-line bg-panel',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-base font-semibold text-ink">{grade.role}</h4>
            {primary && (
              <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-ink">
                Your role
              </span>
            )}
          </div>
          <p className="mt-1 max-w-xs text-[11px] leading-relaxed text-ink-muted">
            {grade.tagline}
          </p>
        </div>
        <div className="text-right">
          <p className={`text-3xl font-bold leading-none ${gradeColor(grade.score)}`}>
            {grade.grade}
          </p>
          <p className="mt-1 text-[10px] uppercase tracking-wider text-ink-muted">
            {Math.round(grade.score)}/100
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {grade.metrics.map((metric) => {
          const ratio = metric.benchmark > 0 ? metric.value / metric.benchmark : 0;
          const pct = Math.min(100, Math.max(0, ratio * 100));
          const ahead = metric.delta >= 0;
          return (
            <div key={metric.label}>
              <div className="flex items-baseline justify-between text-[11px]">
                <span className="text-ink-muted">{metric.label}</span>
                <span className="text-ink">
                  {formatMetricValue(metric.value, metric.unit)}
                  <span className="text-ink-muted">
                    {' / '}
                    {formatMetricValue(metric.benchmark, metric.unit)}
                  </span>
                </span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-line">
                <div
                  className={`h-full rounded-full ${ahead ? 'bg-accent' : 'bg-amber-400'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-3 text-[10px]">
        <span className="rounded bg-line px-2 py-1 text-ink-muted">
          Focus: <span className="text-ink">{grade.focus}</span>
        </span>
        {grade.strengths.length > 0 && (
          <span className="rounded bg-emerald-500/10 px-2 py-1 text-emerald-300">
            Strengths: {grade.strengths.join(', ')}
          </span>
        )}
      </div>
    </div>
  );
}
