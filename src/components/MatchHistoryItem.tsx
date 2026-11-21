import type { Match, MatchResult } from '../types/match';

interface MatchHistoryItemProps {
  matches: Match[];
  selectedId: string | null;
  onSelect: (match: Match) => void;
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return 'Unknown date';
  }
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function kdRatio(kills: number, deaths: number): string {
  if (deaths === 0) return kills.toFixed(1);
  return (kills / deaths).toFixed(2);
}

function ResultLabel({ result }: { result: MatchResult }) {
  return <>{result === 'victory' ? 'Victory' : 'Defeat'}</>;
}

function StatCell({ label, value, tone, wide }: { label: string; value: string; tone?: string; wide?: boolean }) {
  return (
    <div className={'text-center ' + (wide ? 'w-28' : 'w-12')}>
      <dt className="text-[10px] uppercase tracking-[0.14em] text-white/35">{label}</dt>
      <dd className={'mt-0.5 whitespace-nowrap font-mono text-sm font-medium ' + (tone ?? 'text-white/85')}>{value}</dd>
    </div>
  );
}

export function ResultBadge({ result }: { result: MatchResult }) {
  const isVictory = result === 'victory';
  return (
    <span
      className={[
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        isVictory ? 'bg-emerald-500/15 text-emerald-300' : 'bg-red-500/15 text-red-300',
      ].join(' ')}
    >
      {isVictory ? 'Victory' : 'Defeat'}
    </span>
  );
}

export function MatchHistoryItem({ matches, selectedId, onSelect }: MatchHistoryItemProps) {
  if (matches.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      {matches.map((match) => {
        const isSelected = match.id === selectedId;
        const win = match.result === 'victory';
        const [won, lost] = match.score.split(/\s*[-–:]\s*/);
        const kd = match.kills / Math.max(match.deaths, 1);
        return (
          <button
            key={match.id}
            type="button"
            onClick={() => onSelect(match)}
            aria-pressed={isSelected}
            className={[
              'group relative flex w-full items-center gap-4 overflow-hidden rounded-lg border py-3 pl-5 pr-4 text-left transition-colors',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40',
              win
                ? 'border-emerald-400/[0.12] bg-gradient-to-r from-emerald-400/[0.07] via-white/[0.02] to-white/[0.02] hover:border-emerald-400/30'
                : 'border-rose-400/[0.12] bg-gradient-to-r from-rose-400/[0.07] via-white/[0.02] to-white/[0.02] hover:border-rose-400/30',
              isSelected ? 'ring-1 ring-accent/50' : '',
            ].join(' ')}
          >
            <span aria-hidden="true" className={'absolute inset-y-0 left-0 w-1 ' + (win ? 'bg-emerald-400' : 'bg-rose-400')}/>
            <span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-white/10 bg-black/30 font-mono text-xs font-semibold text-white/80">
              {(match.agent ?? match.map).slice(0, 2).toUpperCase()}
            </span>
            <div className="w-40 min-w-0 shrink-0">
              <p className="truncate text-sm font-semibold text-ink">{match.map}</p>
              <p className="truncate text-xs text-ink-muted">
                {match.agent ? match.agent + ' · ' : ''}<span className="uppercase tracking-[0.14em] text-[10px]">{match.mode ?? 'Match'}</span>
              </p>
            </div>
            <div className="w-16 shrink-0 whitespace-nowrap text-center">
              <p className={'font-mono text-base font-semibold ' + (win ? 'text-emerald-300' : 'text-rose-300')}>
                {won}<span className="text-white/30">:</span>{lost}
              </p>
              <p className="text-[10px] uppercase tracking-[0.14em] text-white/35"><ResultLabel result={match.result}/></p>
            </div>
            <dl className="ml-auto hidden items-center gap-5 xl:flex">
              <StatCell label="K / D / A" value={`${match.kills} / ${match.deaths} / ${match.assists}`} wide/>
              <StatCell label="K/D" value={kdRatio(match.kills, match.deaths)} tone={kd >= 1 ? 'text-emerald-300' : 'text-rose-300'}/>
              <StatCell label="ACS" value={match.acs != null ? String(match.acs) : '—'}/>
            </dl>
            <div className="ml-auto hidden w-24 shrink-0 text-right 2xl:block xl:ml-4">
              <p className="text-xs text-ink-muted">{formatDate(match.date)}</p>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className={`shrink-0 transition-transform ${isSelected ? 'rotate-90 text-accent' : 'text-white/25 group-hover:text-white/60'}`} aria-hidden="true">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        );
      })}
    </div>
  );
}
