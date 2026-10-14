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

function ResultBadge({ result }: { result: MatchResult }) {
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
        return (
          <button
            key={match.id}
            type="button"
            onClick={() => onSelect(match)}
            aria-pressed={isSelected}
            className={[
              'flex w-full items-center justify-between gap-4 rounded-lg border p-4 text-left transition-colors',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60',
              isSelected
                ? 'border-accent/50 bg-accent/[0.06]'
                : 'border-line bg-panel hover:border-line hover:bg-panel',
            ].join(' ')}
          >
            <div className="flex items-center gap-4">
              <ResultBadge result={match.result} />
              <div>
                <p className="text-sm font-semibold text-ink">{match.map}</p>
                <p className="text-xs text-ink-muted">{formatDate(match.date)}</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-sm font-semibold text-ink">{match.score}</p>
                <p className="text-xs text-ink-muted">{kdRatio(match.kills, match.deaths)} K/D</p>
              </div>
              <div className="hidden text-right sm:block">
                <p className="text-sm text-ink">
                  <span className="text-emerald-400">{match.kills}</span>
                  {' / '}
                  <span className="text-red-400">{match.deaths}</span>
                  {' / '}
                  <span className="text-ink-muted">{match.assists}</span>
                </p>
                <p className="text-xs text-ink-muted">K / D / A</p>
              </div>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`transition-transform ${isSelected ? 'rotate-90 text-accent' : 'text-ink-muted'}`}
                aria-hidden="true"
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            </div>
          </button>
        );
      })}
    </div>
  );
}
