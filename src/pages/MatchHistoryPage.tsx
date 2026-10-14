import { useState } from 'react';
import type { MatchFilter } from '../types/match';
import { MatchFilter as MatchFilterTabs } from '../components/MatchFilter';
import { MatchHistoryItem } from '../components/MatchHistoryItem';
import { MatchDetailPanel } from '../components/MatchDetailPanel';
import { DemoDataNotice } from '../components/DemoDataNotice';
import { getDemoMatches, getDemoMatchById } from '../services/matchData';
import type { Match } from '../types/match';

export function MatchHistoryPage() {
  const [filter, setFilter] = useState<MatchFilter>('all');
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);

  const matches = getDemoMatches(filter);
  const selectedMatch: Match | undefined = selectedMatchId
    ? getDemoMatchById(selectedMatchId)
    : undefined;

  const handleFilterChange = (newFilter: MatchFilter) => {
    setFilter(newFilter);
    // Clear selection when filter changes to avoid stale IDs
    setSelectedMatchId(null);
  };

  const handleSelectMatch = (match: Match) => {
    setSelectedMatchId(match.id);
  };

  const handleClearSelection = () => {
    setSelectedMatchId(null);
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-ink">Match History</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Review your recent VALORANT matches. Connect your Riot account to populate your real
          history.
        </p>
      </div>

      {/* Demo data notice */}
      <DemoDataNotice />

      {/* Filters + count */}
      <div className="flex flex-wrap items-center gap-4">
        <MatchFilterTabs value={filter} onChange={handleFilterChange} />
        <span className="text-sm text-ink-muted">
          {matches.length} {matches.length === 1 ? 'match' : 'matches'}
        </span>
      </div>

      {/* Content */}
      {matches.length === 0 ? (
        <EmptyState filter={filter} />
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {/* Match list */}
          <div className="xl:col-span-2">
            <MatchHistoryItem
              matches={matches}
              selectedId={selectedMatchId}
              onSelect={handleSelectMatch}
            />
          </div>

          {/* Detail panel */}
          <div className="xl:col-span-1">
            {selectedMatch ? (
              <MatchDetailPanel match={selectedMatch} onClose={handleClearSelection} />
            ) : (
              <div className="rounded-lg border border-line bg-panel p-6 text-center">
                <p className="text-sm text-ink-muted">Select a match to view details.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState({ filter }: { filter: MatchFilter }) {
  const message =
    filter === 'wins'
      ? 'No victories yet. Play a match to see your wins here.'
      : filter === 'losses'
        ? 'No defeats recorded. Play a match to see your losses here.'
        : 'No matches recorded. Connect your Riot account to see your match history.';

  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-line bg-panel px-6 py-16 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M8 6h13" />
          <path d="M8 12h13" />
          <path d="M8 18h13" />
          <circle cx="3.5" cy="6" r="1.2" />
          <circle cx="3.5" cy="12" r="1.2" />
          <circle cx="3.5" cy="18" r="1.2" />
        </svg>
      </div>
      <p className="text-sm text-ink-muted">{message}</p>
    </div>
  );
}
