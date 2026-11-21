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

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="hidden xl:block">
      <p className="figure text-base text-ink">{value}</p>
      <p className="text-xs text-ink-muted">{label}</p>
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
    <div className="flex flex-col gap-1.5">
      {matches.map((match) => {
        const isSelected = match.id === selectedId;
        const win = match.result === 'victory';
        const [won, lost] = match.score.split(/\s*[-–:]\s*/);
        return (
          <button
            key={match.id}
            type="button"
            onClick={() => onSelect(match)}
            aria-pressed={isSelected}
            className={[
              'relative grid w-full grid-cols-[1fr_auto] items-center gap-x-6 rounded-md py-3 pl-5 pr-4 text-left transition-colors duration-150',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/50 xl:grid-cols-[minmax(9rem,1.4fr)_4rem_repeat(3,minmax(3.5rem,1fr))]',
              isSelected ? 'bg-[#262A33]' : 'bg-panel hover:bg-[#262A33]',
            ].join(' ')}
          >
            <span aria-hidden="true" className={'absolute inset-y-2 left-0 w-[3px] rounded-r ' + (win ? 'bg-[#3FB68B]' : 'bg-[#E5646E]')}/>
            <div className="min-w-0">
              <p className="truncate font-medium text-ink">{match.map}</p>
              <p className="truncate text-sm text-ink-muted">{[match.agent, match.mode].filter(Boolean).join(', ')}</p>
            </div>
            <p className={'figure text-xl font-semibold ' + (win ? 'text-[#3FB68B]' : 'text-[#E5646E]')}>
              {won}–{lost}<span className="sr-only">{win ? ' win' : ' loss'}</span>
            </p>
            <StatCell label="K / D / A" value={`${match.kills} / ${match.deaths} / ${match.assists}`}/>
            <StatCell label="K/D" value={kdRatio(match.kills, match.deaths)}/>
            <StatCell label="ACS" value={match.acs != null ? String(match.acs) : '–'}/>
          </button>
        );
      })}
    </div>
  );
}
