import { useEffect, useRef, useState, type FormEvent } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface PublicPlayer {
  handle: string; riotId: string; tagline: string; region: string; accountLevel: number;
  currentRank?: { tier: string; division: number; rr: number };
  peakRank?: { tier: string; division: number; rr: number };
  statistics?: { games: number; wins: number; losses: number; winRate: number; kd: number; acs: number; adr: number; headshotPercent: number };
  topAgents?: Array<{ agent: string; games: number; winRate: number }>;
  topMaps?: Array<{ map: string; games: number; winRate: number }>;
  lastUpdated?: number;
}
type SearchState = 'idle' | 'loading' | 'ready' | 'error';

function validPublicPlayer(p: unknown): p is PublicPlayer {
  if (!p || typeof p !== 'object') return false;
  const r = p as Record<string, unknown>;
  return typeof r.handle === 'string' && /^[0-9a-f]{18}$/.test(r.handle) &&
    typeof r.riotId === 'string' && typeof r.tagline === 'string';
}

export function PlayerDirectoryPage() {
  const [query, setQuery] = useState('');
  const [state, setState] = useState<SearchState>('idle');
  const [rows, setRows] = useState<PublicPlayer[]>([]);
  const [selected, setSelected] = useState<PublicPlayer | null>(null);
  const [profileState, setProfileState] = useState<SearchState>('idle');
  const searchRequest = useRef(0);
  const profileRequest = useRef(0);

  useEffect(() => () => {
    ++searchRequest.current;
    ++profileRequest.current;
  }, []);

  async function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = query.trim();
    if (text.length < 2 || text.length > 40) { setState('error'); return; }
    const requestId = ++searchRequest.current;
    ++profileRequest.current;
    setState('loading');
    setProfileState('idle');
    setSelected(null);
    try {
      const payload = await invoke<{ players: unknown[] }>('search_public_players', { query: text });
      if (!Array.isArray(payload.players)) throw new Error('Unexpected directory result');
      if (searchRequest.current !== requestId) return;
      setRows(payload.players.filter(validPublicPlayer));
      setState('ready');
    } catch {
      if (searchRequest.current === requestId) {
        setRows([]); setState('error');
      }
    }
  }

  async function openPlayer(player: PublicPlayer) {
    const requestId = ++profileRequest.current;
    setProfileState('loading');
    setSelected(null);
    try {
      const data = await invoke<{ player: unknown }>('fetch_public_player', { handle: player.handle });
      if (!validPublicPlayer(data.player)) throw new Error('Invalid opted-in player');
      if (profileRequest.current !== requestId) return;
      setSelected(data.player);
      setProfileState('ready');
    } catch {
      if (profileRequest.current === requestId) setProfileState('error');
    }
  }

  const rank = (p?: { tier: string; division: number; rr: number }) =>
    p ? p.tier + ' ' + String(p.division) + ' · ' + String(p.rr) + ' RR' : 'Not available';
  const stat = (n: number | undefined, suffix = '', digits = 0) =>
    typeof n === 'number' && Number.isFinite(n) ? n.toFixed(digits) + suffix : '—';

  return <section className="flex flex-col gap-5 p-6">
    <header>
      <h2 className="text-2xl font-semibold text-ink">Player Directory</h2>
      <p className="mt-1 text-sm text-ink-muted">Search only players who explicitly opted into public visibility on the Aventas website.</p>
    </header>
    <form onSubmit={(e) => void search(e)} className="flex max-w-xl gap-3">
      <input aria-label="Search public players" value={query} onChange={e => setQuery(e.target.value)}
        placeholder="Riot ID or name (minimum 2 characters)" maxLength={40}
        className="min-w-0 flex-1 rounded-lg border border-line bg-panel px-4 py-3 text-sm text-ink" />
      <button disabled={state === 'loading'} type="submit"
        className="rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-app disabled:opacity-50">Search</button>
    </form>
    {state === 'loading' && <p role="status" className="text-sm text-ink-muted">Searching the opted-in directory…</p>}
    {state === 'error' && <p role="alert" className="text-sm text-amber-300">Unable to search the directory. Check your connection and query.</p>}
    {state === 'ready' && rows.length === 0 && <p className="text-sm text-ink-muted">No opted-in public profiles match this search.</p>}
    <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">{rows.map(p =>
      <button key={p.handle} type="button" onClick={() => void openPlayer(p)}
        className="rounded-xl border border-line bg-panel p-4 text-left hover:border-accent">
        <p className="font-semibold text-ink">{p.riotId}#{p.tagline}</p>
        <p className="mt-1 text-xs text-ink-muted">{p.region} · {rank(p.currentRank)}</p>
        <p className="mt-3 text-xs text-accent">View public performance</p>
      </button>)}</div>
    {profileState === 'loading' && <p role="status" className="text-sm text-ink-muted">Loading consented public player statistics…</p>}
    {profileState === 'error' && <p role="alert" className="text-sm text-amber-300">The player has no available public profile, or has withdrawn consent.</p>}
    {profileState === 'ready' && selected && <article className="rounded-xl border border-line bg-panel p-5">
      <h3 className="text-lg font-semibold text-ink">{selected.riotId}#{selected.tagline}</h3>
      <p className="mt-2 text-xs text-ink-muted">Current rank: {rank(selected.currentRank)} · Peak: {rank(selected.peakRank)}</p>
      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ['Matches', stat(selected.statistics?.games)],
          ['Win rate', stat(selected.statistics?.winRate, '%', 1)],
          ['K/D', stat(selected.statistics?.kd, '', 2)],
          ['ACS', stat(selected.statistics?.acs)],
        ].map(([label, value]) =>
          <div className="rounded-lg border border-line bg-app p-3" key={label}>
            <p className="text-xs text-ink-muted">{label}</p>
            <p className="mt-2 text-xl font-semibold text-ink">{value}</p>
          </div>)}
      </div>
      <p className="mt-4 text-xs text-ink-muted">Reduced, opt-in aggregate statistics only. No email, PUUID or private match history is exposed.</p>
    </article>}
  </section>;
}
