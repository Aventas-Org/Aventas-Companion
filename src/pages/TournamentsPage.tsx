import { useCallback, useEffect, useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { validTournament, validBracket } from '../services/tournamentContract.mjs';
import type { Tournament, Match, Bracket } from '../services/tournamentContract.mjs';

type ListState = { state: 'loading' | 'ready' | 'error'; rows: Tournament[] };
type DetailState = { state: 'loading' | 'ready' | 'error'; data: Bracket | null };
const linkFor = (slug: string) => 'https://aventasgaming.com/tournaments/' + encodeURIComponent(slug);

function time(ts?: number) {
  return typeof ts === 'number' && ts > 0 ? new Date(ts).toLocaleString() : 'Schedule pending';
}
function RoundBracket({ bracket }: { bracket: Bracket }) {
  if (!bracket.matches.length) return <div className="rounded-xl border border-line bg-panel p-6 text-sm text-ink-muted">No official bracket yet. The organizer has not published matchups.</div>;
  const rounds = [...new Set(bracket.matches.map(match => match.round))].sort((a, b) => a - b);
  const maxRound = rounds[rounds.length - 1];
  const label = (round: number) => round === maxRound ? 'Final'
    : round === maxRound - 1 ? 'Semifinals'
    : round === maxRound - 2 ? 'Quarterfinals'
    : 'Round ' + round;

  return <section className="overflow-x-auto rounded-xl border border-line bg-panel p-5" aria-label="Official tournament bracket">
    <div className="flex min-w-max items-stretch gap-5">
      {rounds.map(round => <div key={round} className="w-64 shrink-0">
        <h4 className="mb-4 border-b border-line pb-3 text-xs font-semibold uppercase tracking-wider text-accent">{label(round)}</h4>
        <div className="flex flex-col justify-around gap-4" style={{ minHeight: '350px' }}>
          {bracket.matches.filter(m => m.round === round).sort((a, b) => a.slot - b.slot).map(m =>
            <div key={m.id} className="overflow-hidden rounded-lg border border-line bg-app">
              <div className="flex items-center justify-between border-b border-line px-3 py-2">
                <span className="min-w-0 truncate text-sm text-ink">{m.teamA || 'TBD'}</span>
                <span className="ml-3 font-semibold text-ink">{m.status === 'completed' ? m.scoreA : '—'}</span>
              </div>
              <div className="flex items-center justify-between px-3 py-2">
                <span className="min-w-0 truncate text-sm text-ink">{m.teamB || 'TBD'}</span>
                <span className="ml-3 font-semibold text-ink">{m.status === 'completed' ? m.scoreB : '—'}</span>
              </div>
              <p className="border-t border-line px-3 py-2 text-[11px] text-ink-muted">
                {m.status === 'live' ? '● LIVE' : m.status === 'completed' ? 'Final result' : time(m.scheduledAt)}
              </p>
            </div>)}
        </div>
      </div>)}
    </div>
    <p className="mt-5 text-xs text-ink-muted">
      Official website pairings and scores. Round order and results are synchronized from Aventas D1; no local bracket is generated.
    </p>
  </section>;
}

export function TournamentsPage() {
  const [list, setList] = useState<ListState>({ state: 'loading', rows: [] });
  const [selected, setSelected] = useState<string | null>(null);
  const [detail, setDetail] = useState<DetailState>({ state: 'loading', data: null });
  const [revision, setRevision] = useState(0);
  const [lastSync, setLastSync] = useState<number | null>(null);
  const listRevision = useRef(0);

  const refreshList = useCallback(async () => {
    const requestId = ++listRevision.current;
    try {
      const payload = await invoke<{ tournaments: unknown[] }>('fetch_public_tournaments');
      if (!Array.isArray(payload?.tournaments)) throw new Error('Invalid list');
      const rows = payload.tournaments.filter(validTournament);
      if (requestId !== listRevision.current) return;
      setList({ state: 'ready', rows });
      setLastSync(Date.now());
      setSelected(current => current && !rows.some(t => t.slug === current) ? null : current);
    } catch {
      if (requestId === listRevision.current) {
        setList(prev => ({ state: 'error', rows: prev.rows }));
      }
    }
  }, []);

  useEffect(() => {
    void refreshList();
    const interval = window.setInterval(() => void refreshList(), 60_000);
    return () => {
      ++listRevision.current;
      window.clearInterval(interval);
    };
  }, [refreshList, revision]);

  useEffect(() => {
    if (!selected) return;
    const selectedSlug = selected;
    let ignore = false;
    let lastRequest = 0;
    setDetail({ state: 'loading', data: null });
    async function load() {
      const requestId = ++lastRequest;
      try {
        const value = await invoke<unknown>('fetch_public_tournament_detail', { slug: selectedSlug });
        if (!validBracket(value, selectedSlug)) throw new Error('Invalid official bracket');
        if (!ignore && requestId === lastRequest) setDetail({ state: 'ready', data: value });
      } catch {
        if (!ignore && requestId === lastRequest) setDetail({ state: 'error', data: null });
      }
    }
    void load();
    const interval = window.setInterval(() => void load(), 60_000);
    return () => { ignore = true; window.clearInterval(interval); };
  }, [selected, revision]);

  const current = detail.data?.tournament;
  return <section className="flex flex-col gap-5 p-6">
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div><h2 className="text-2xl font-semibold text-ink">Aventas Tournaments</h2>
        <p className="mt-1 text-sm text-ink-muted">Official tournament listings, brackets and results synchronized from the website.</p></div>
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs text-ink-muted">
          {lastSync ? 'Website checked ' + new Date(lastSync).toLocaleTimeString() : 'Not synchronized yet'}
        </span>
        <button type="button" onClick={() => setRevision(n => n + 1)}
          className="rounded-lg border border-line px-4 py-2 text-sm text-ink hover:bg-line">Refresh</button>
      </div>
    </header>
    {list.state === 'loading' && <p role="status" className="text-sm text-ink-muted">Loading website tournaments…</p>}
    {list.state === 'error' && <p role="alert" className="rounded-lg border border-amber-500/30 bg-panel p-4 text-sm text-ink">The official website is unavailable. Previous listings may be outdated.</p>}
    {list.state === 'ready' && !list.rows.length && <p className="rounded-lg border border-line bg-panel p-6 text-sm text-ink-muted">No official tournaments are currently published.</p>}
    <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">{list.rows.map(t =>
      <button key={t.slug} type="button" onClick={() => setSelected(t.slug)}
        aria-pressed={selected === t.slug} className={'rounded-xl border p-5 text-left ' +
        (selected === t.slug ? 'border-accent bg-accent/10' : 'border-line bg-panel hover:border-ink-muted')}>
        <h3 className="font-semibold text-ink">{t.name}</h3>
        <p className="mt-1 text-xs capitalize text-ink-muted">{t.status} · {t.game || 'Valorant'} · {t.region || 'Global'}</p>
        <p className="mt-3 text-sm text-ink-muted">{time(t.startsAt)}</p>
        <p className="mt-1 text-xs text-ink-muted">
          {t.registrationOpen ? 'Registration open' : 'Registration status: see website'}
        </p>
      </button>)}</div>
    {selected && <div className="space-y-4">
      {detail.state === 'loading' && <p role="status" className="text-sm text-ink-muted">Retrieving official bracket…</p>}
      {detail.state === 'error' && <p role="alert" className="rounded-lg border border-amber-500/30 bg-panel p-5 text-sm text-ink">Could not verify this tournament bracket. Refresh to retry.</p>}
      {detail.state === 'ready' && detail.data && <>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h3 className="text-lg font-semibold text-ink">{current?.name}</h3>
            <p className="mt-1 text-sm text-ink-muted">
              {detail.data.teams.length} approved teams
              {current?.champion ? ' · Champion: ' + current.champion : ''}
            </p></div>
          <a href={linkFor(selected)} target="_blank" rel="noopener noreferrer"
            className="rounded-lg border border-line px-4 py-2 text-sm text-accent underline">
            Official website / registration
          </a>
        </div>
        <RoundBracket bracket={detail.data} />
      </>}
    </div>}
    <p className="text-xs text-ink-muted">
      Public data refreshes every 60 seconds while this page is open. Private registrations and team check-ins require authenticated website integration.
    </p>
  </section>;
}
