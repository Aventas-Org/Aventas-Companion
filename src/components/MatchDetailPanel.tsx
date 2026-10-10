import type { Match, MatchResult } from '../types/match';

interface MatchDetailPanelProps {
  match: Match;
  onClose: () => void;
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

function kdRatio(kills: number, deaths: number): number {
  if (deaths === 0) return kills;
  return kills / deaths;
}

function ResultBadge({ result }: { result: MatchResult }) {
  const isVictory = result === 'victory';
  return (
    <span
      className={[
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold',
        isVictory ? 'bg-emerald-500/15 text-emerald-300' : 'bg-red-500/15 text-red-300',
      ].join(' ')}
    >
      {isVictory ? 'Victory' : 'Defeat'}
    </span>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-white/5 py-2 last:border-b-0 last:py-0">
      <span className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</span>
      <span className="text-sm text-slate-200">{value}</span>
    </div>
  );
}

export function MatchDetailPanel({ match, onClose }: MatchDetailPanelProps) {
  const ratio = kdRatio(match.kills, match.deaths);

  return (
    <div className="sticky top-6 rounded-lg border border-white/5 bg-white/[0.02] p-5">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-2">
          <ResultBadge result={match.result} />
          <h3 className="text-lg font-semibold text-white">{match.map}</h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close match details"
          className="rounded-md p-1 text-slate-500 transition-colors hover:bg-white/5 hover:text-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/70"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M18 6L6 18" />
            <path d="M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="mt-4">
        <p className="text-sm text-slate-400">Score</p>
        <p className="text-xl font-semibold text-slate-100">{match.score}</p>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 rounded-lg bg-[#0f0f12] p-3">
        <div className="text-center">
          <p className="text-lg font-semibold text-emerald-400">{match.kills}</p>
          <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Kills</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-red-400">{match.deaths}</p>
          <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Deaths</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-slate-300">{match.assists}</p>
          <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Assists</p>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-sm text-slate-400">K/D Ratio</p>
        <p className="text-xl font-semibold text-purple-300">{ratio.toFixed(2)}</p>
      </div>

      <div className="mt-4">
        <StatRow label="Date / Time" value={formatDate(match.date)} />
        {match.mode && <StatRow label="Mode" value={match.mode} />}
        {match.agent && <StatRow label="Agent" value={match.agent} />}
        {match.acs !== undefined && <StatRow label="ACS" value={match.acs.toString()} />}
        {match.durationMinutes !== undefined && (
          <StatRow label="Duration" value={`${match.durationMinutes} min`} />
        )}
      </div>
    </div>
  );
}
