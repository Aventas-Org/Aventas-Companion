import { useEffect, useRef, useState, type FormEvent } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { UserIcon, CrosshairIcon, StatisticsIcon } from '../components/icons';

interface RankRef { tier: string; division: number; rr: number }
interface PublicPlayer {
  handle: string; riotId: string; tagline: string; region: string; accountLevel: number;
  currentRank?: RankRef; peakRank?: RankRef;
  statistics?: { games: number; wins: number; losses: number; winRate: number; kd: number; acs: number; adr: number; headshotPercent: number } | null;
  topAgents?: Array<{ agent: string; games: number; winRate: number }>;
  topMaps?: Array<{ map: string; games: number; winRate: number }>;
  lastUpdated?: number;
}
type Status = 'idle' | 'loading' | 'ready' | 'error';
const fmt = (number: unknown, decimals = 0, suffix = '') =>
  typeof number === 'number' && Number.isFinite(number) ? number.toFixed(decimals) + suffix : '—';

function validPlayer(value: unknown): value is PublicPlayer {
  if (!value || typeof value !== 'object') return false;
  const row = value as Record<string, unknown>;
  return typeof row.handle === 'string' && /^[0-9a-f]{18}$/.test(row.handle) &&
    typeof row.riotId === 'string' && typeof row.tagline === 'string' &&
    typeof row.region === 'string';
}
function rankName(rank?: RankRef) {
  if (!rank || !rank.tier) return 'Rank unavailable';
  return rank.tier + (rank.division > 0 ? ' ' + rank.division : '') +
    (typeof rank.rr === 'number' ? ' · ' + rank.rr + ' RR' : '');
}

function ProfileDetail({ player }: { player: PublicPlayer }) {
  const stats = player.statistics;
  const metrics: Array<[string,string]> = [
    ['Matches', fmt(stats?.games)], ['Win rate', fmt(stats?.winRate, 1, '%')],
    ['K/D ratio', fmt(stats?.kd, 2)], ['Average ACS', fmt(stats?.acs)],
  ];
  return <div className="space-y-4">
    <div className="a-hero p-6">
      <div className="flex items-start gap-4">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-[10px] border border-accent/25 bg-accent/10 text-accent">
          <CrosshairIcon width={23} height={23}/>
        </span>
        <div className="min-w-0 flex-1">
          <span className="a-chip" data-tone="live"><span className="a-status-dot"/>Public profile</span>
          <h2 className="mt-3 break-words font-display text-[23px] font-semibold tracking-[-.03em] text-ink">{player.riotId}#{player.tagline}</h2>
          <p className="mt-1 text-[11px] text-ink-muted">{player.region || 'Region not provided'} · Level {fmt(player.accountLevel)}</p>
        </div>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-4 border-t border-line pt-5">
        <div><p className="a-eyebrow">Current rank</p><p className="mt-2 font-display text-[15px] font-semibold text-ink">{rankName(player.currentRank)}</p></div>
        <div><p className="a-eyebrow">Peak rank</p><p className="mt-2 font-display text-[15px] font-semibold text-ink">{rankName(player.peakRank)}</p></div>
      </div>
    </div>
    {!stats ? <div className="a-empty">
      <p className="font-semibold text-ink">No public competitive records</p>
      <p className="mt-1">This player opted into directory visibility but has no synchronized match aggregates yet.</p>
    </div> : <>
      <div className="a-metric-strip !grid-cols-2">
        {metrics.map(([name,value]) => <div className="a-metric" key={name}>
          <p className="label">{name}</p><p className="value mt-1 text-ink">{value}</p>
        </div>)}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {([
          { label: 'Preferred agents', rows: (player.topAgents || []).map(row => ({ name: row.agent, games: row.games, winRate: row.winRate })) },
          { label: 'Frequent maps', rows: (player.topMaps || []).map(row => ({ name: row.map, games: row.games, winRate: row.winRate })) },
        ]).map(({ label, rows }) => <div className="a-panel p-5" key={label}>
          <h3 className="font-display text-[15px] font-semibold text-ink">{label}</h3>
          {rows.length ? <div className="mt-4 divide-y divide-line">
            {rows.slice(0, 5).map((row,index) => <div key={index} className="flex items-center justify-between gap-3 py-3">
              <span className="truncate text-[12px] font-medium text-ink">{String(row.name || 'Unknown')}</span>
              <span className="a-number text-[12px] text-ink-muted">{fmt(row.winRate, 1, '%')} win · {fmt(row.games)} games</span>
            </div>)}
          </div> : <p className="mt-3 text-[12px] leading-6 text-ink-muted">No public breakdown is available.</p>}
        </div>)}
      </div>
    </>}
    <p className="text-[11px] leading-6 text-ink-muted">
      Public, opted-in aggregates only. Emails, private match history, Riot PUUID and contact details are never available through this screen.
      {player.lastUpdated ? ' Website updated ' + new Date(player.lastUpdated).toLocaleDateString() + '.' : ''}
    </p>
  </div>;
}

export function PlayerDirectoryPage() {
  const [query, setQuery] = useState('');
  const [searched, setSearched] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [players, setPlayers] = useState<PublicPlayer[]>([]);
  const [selected, setSelected] = useState<PublicPlayer | null>(null);
  const [profileStatus, setProfileStatus] = useState<Status>('idle');
  const searchRequest = useRef(0);
  const profileRequest = useRef(0);

  useEffect(() => () => { ++searchRequest.current; ++profileRequest.current; }, []);

  async function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const term = query.trim();
    if (term.length < 2 || term.length > 32) { setStatus('error'); return; }
    const requestId = ++searchRequest.current;
    ++profileRequest.current;
    setSearched(term); setStatus('loading'); setProfileStatus('idle'); setSelected(null);
    try {
      const payload = await invoke<{ players: unknown[] }>('search_public_players', { query: term });
      if (!Array.isArray(payload?.players)) throw new Error('Invalid public search result');
      if (searchRequest.current !== requestId) return;
      setPlayers(payload.players.filter(validPlayer));
      setStatus('ready');
    } catch {
      if (searchRequest.current === requestId) { setPlayers([]); setStatus('error'); }
    }
  }

  async function inspect(player: PublicPlayer) {
    const requestId = ++profileRequest.current;
    setSelected(null); setProfileStatus('loading');
    try {
      const data = await invoke<{ player: unknown }>('fetch_public_player', { handle: player.handle });
      if (!validPlayer(data.player)) throw new Error('Public profile unavailable');
      if (profileRequest.current !== requestId) return;
      setSelected(data.player); setProfileStatus('ready');
    } catch {
      if (profileRequest.current === requestId) setProfileStatus('error');
    }
  }

  return <section className="page-stage space-y-6">
    <header>
      <p className="page-kicker">Aventas / Community</p>
      <h1 className="page-heading mt-2">Player directory.</h1>
      <p className="page-description mt-3">Explore public competitive profiles. Players appear here only when they choose to be visible.</p>
    </header>

    <form onSubmit={(e) => void search(e)} className="a-panel flex max-w-[950px] flex-wrap items-center gap-3 p-3">
      <span className="ml-2 hidden text-ink-muted sm:block"><UserIcon width={19} height={19}/></span>
      <label htmlFor="directory-search" className="sr-only">Search opted-in public players by Riot ID</label>
      <input id="directory-search" value={query} maxLength={32} onChange={e => setQuery(e.target.value)}
        placeholder="Search by Riot ID or player name…" autoComplete="off"
        className="min-w-[180px] flex-1 bg-transparent px-2 py-2 text-[13px] text-ink outline-none placeholder:text-ink-muted"/>
      <button className="a-button a-button-primary !px-6" type="submit" disabled={status === 'loading'}>
        {status === 'loading' ? 'Searching…' : 'Find player'}
      </button>
    </form>

    <div className="grid items-start gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
      <div className="a-panel overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
          <h2 className="font-display text-[15px] font-semibold text-ink">Search results</h2>
          <span className="text-[11px] text-ink-muted">{status === 'ready' ? players.length + ' found' : 'Opt-in only'}</span>
        </div>
        {status === 'idle' && <div className="a-empty m-3">Enter at least two characters to search the public Aventas directory.</div>}
        {status === 'loading' && <p role="status" className="px-5 py-7 text-[12px] text-ink-muted">Checking visible profiles…</p>}
        {status === 'error' && <div role="alert" className="a-empty m-3">Search unavailable. Check the connection or try a Riot ID between two and 32 characters.</div>}
        {status === 'ready' && players.length === 0 && <div className="a-empty m-3">
          No public players matched “{searched}”. Private profiles are never displayed.
        </div>}
        <div className="divide-y divide-line/70">
          {players.map(player => <button key={player.handle} type="button" onClick={() => void inspect(player)}
            aria-pressed={selected?.handle === player.handle}
            className={'a-pressable flex w-full items-center gap-3 border-l-2 px-4 py-4 text-left ' +
              (selected?.handle === player.handle ? 'border-l-accent bg-accent/[.05]' : 'border-l-transparent')}>
            <span className="flex size-9 shrink-0 items-center justify-center rounded-[7px] border border-line bg-app font-display text-[14px] font-semibold text-accent">
              {player.riotId.slice(0, 1).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[12px] font-semibold text-ink">{player.riotId}#{player.tagline}</span>
              <span className="mt-1 block truncate text-[11px] text-ink-muted">{rankName(player.currentRank)}</span>
            </span>
            <span className="text-ink-muted" aria-hidden="true">›</span>
          </button>)}
        </div>
      </div>

      <div className="min-w-0">
        {profileStatus === 'loading' && <div role="status" className="a-panel p-8 text-[12px] text-ink-muted">Opening opted-in profile…</div>}
        {profileStatus === 'error' && <div role="alert" className="a-empty">This profile is unavailable or the player may have withdrawn public consent. Select another result.</div>}
        {selected && profileStatus === 'ready' && <ProfileDetail player={selected}/>}
        {profileStatus === 'idle' && <div className="a-panel flex min-h-[270px] flex-col items-center justify-center px-6 py-12 text-center">
          <StatisticsIcon width={34} height={34} className="text-ink-muted"/>
          <h2 className="mt-4 font-display text-[20px] font-semibold text-ink">Select a public player</h2>
          <p className="mt-2 max-w-[380px] text-[12px] leading-6 text-ink-muted">Only profiles explicitly made public by their owners can be viewed here. Performance aggregates appear when the website has authorized match records.</p>
        </div>}
      </div>
    </div>
  </section>;
}
