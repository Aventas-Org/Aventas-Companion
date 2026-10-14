import { useMemo } from 'react';
import { BenchmarkLegend, BenchmarkTrack } from '../components/BenchmarkTrack';
import { DemoDataNotice } from '../components/DemoDataNotice';
import { RoleGradeCard } from '../components/RoleGradeCard';
import { SectionCard } from '../components/SectionCard';
import { useAnalysis } from '../hooks/useAnalysis';

export function BenchmarkPage() {
  const { session, history } = useAnalysis();
  const { comparisons, roleGrades } = history;

  const ranked = useMemo(
    () => [...comparisons].sort((a, b) => b.playerTierIndex - a.playerTierIndex),
    [comparisons],
  );
  const best = ranked[0] ?? null;
  const worst = ranked[ranked.length - 1] ?? null;

  // The player's own role first, then the rest by grade.
  const orderedRoles = useMemo(
    () =>
      [...roleGrades].sort((a, b) => {
        const aMain = a.role === session.player.mainRole ? 1 : 0;
        const bMain = b.role === session.player.mainRole ? 1 : 0;
        if (aMain !== bMain) return bMain - aMain;
        return b.score - a.score;
      }),
    [roleGrades, session.player.mainRole],
  );

  const gapCount = comparisons.filter((entry) => !entry.meetsCurrent).length;

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-ink">Rank Benchmark</h2>
        <p className="mt-1 text-sm text-ink-muted">
          See exactly how your numbers stack up against the rank you are chasing — and which part of
          your game is holding you back.
        </p>
      </div>

      <DemoDataNotice />

      <SectionCard
        title="Am I the problem?"
        subtitle={`Compared against ${session.player.targetRank} averages across your last ${history.matches.length} games.`}
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-lg border border-line bg-panel px-3 py-2">
              <span className="block text-[10px] uppercase tracking-wider text-ink-muted">
                Current rank
              </span>
              <span className="text-sm font-semibold text-ink">{session.player.currentRank}</span>
            </span>
            <span className="text-ink-muted" aria-hidden="true">
              →
            </span>
            <span className="rounded-lg border border-accent/40 bg-accent/[0.06] px-3 py-2">
              <span className="block text-[10px] uppercase tracking-wider text-ink-muted">
                Target rank
              </span>
              <span className="text-sm font-semibold text-ink">{session.player.targetRank}</span>
            </span>
            <span className="text-xs text-ink-muted">
              Main: {session.player.mainAgent} · {session.player.mainRole}
            </span>
          </div>

          {best && worst && (
            <p className="rounded-lg border border-line bg-panel p-4 text-sm leading-relaxed text-ink">
              Your <span className="font-semibold text-ink">{best.metric.shortLabel}</span> grades{' '}
              <span className="font-semibold text-ink">{best.playerTier}</span>, but your{' '}
              <span className="font-semibold text-amber-300">{worst.metric.shortLabel}</span> is{' '}
              <span className="font-semibold text-amber-300">{worst.playerTier}</span>.
              {gapCount > 0
                ? ` ${gapCount} of your ${comparisons.length} metrics are still below ${session.player.currentRank} — that is the climb.`
                : ` Every metric already meets your current rank, so ${session.player.targetRank} is a realistic next step.`}
            </p>
          )}

          <BenchmarkLegend />
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {comparisons.map((comparison) => (
          <BenchmarkTrack key={comparison.metric.id} comparison={comparison} />
        ))}
      </div>

      <SectionCard
        title="Role-specific grading"
        subtitle="Each role is graded on what that role is actually supposed to do."
      >
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-4">
          {orderedRoles.map((grade) => (
            <RoleGradeCard
              key={grade.role}
              grade={grade}
              primary={grade.role === session.player.mainRole}
            />
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
