import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useAventasAccount } from '../platform/AccountContext';
import { useValorantStatus } from '../hooks/useValorantStatus';
import { validTournament } from '../services/tournamentContract.mjs';
import type { Tournament } from '../services/tournamentContract.mjs';
import { TrophyIcon, PerformanceIcon } from '../components/icons';
import type { NavId } from '../components/nav';

type Data = Record<string, unknown>;
type AccountStatus = 'loading' | 'ready' | 'unavailable';
type EventStatus = 'loading' | 'ready' | 'unavailable';

function record(value: unknown): Data {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Data : {};
}
function numeric(value: unknown, decimals = 0, suffix = ''): string {
  return typeof value === 'number' && Number.isFinite(value) ? value.toFixed(decimals) + suffix : '—';
}
function formatDate(timestamp?: number): string {
  if (typeof timestamp !== 'number' || timestamp <= 0 || !Number.isFinite(timestamp)) return 'Date to be announced';
  return new Date(timestamp).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export function OverviewPage({ onNavigate }: { onNavigate?: (id: NavId) => void }) {
  const status = useValorantStatus();
  const { phase, account } = useAventasAccount();
  const [dashboard, setDashboard] = useState<Data | null>(null);
  const [profile, setProfile] = useState<Data | null>(null);
  const [accountStatus, setAccountStatus] = useState<AccountStatus>('loading');
  const [events, setEvents] = useState<Tournament[]>([]);
  const [eventStatus, setEventStatus] = useState<EventStatus>('loading');
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    if (phase !== 'signed-in' || !account) {
      setDashboard(null); setProfile(null); setAccountStatus('unavailable');
      return;
    }
    let cancelled = false;
    setAccountStatus('loading');
    void Promise.all([
      invoke<Data>('desktop_companion_data', { endpoint: 'dashboard' }),
      invoke<Data>('desktop_companion_data', { endpoint: 'profile' }),
    ]).then(([stats, meta]) => {
      if (cancelled) return;
      setDashboard(stats);
      setProfile(meta);
      setAccountStatus('ready');
    }).catch(() => {
      if (!cancelled) {
        setDashboard(null); setProfile(null);
        setAccountStatus('unavailable');
      }
    });
    return () => { cancelled = true; };
  }, [phase, account?.id, revision]);

  useEffect(() => {
    let cancelled = false;
    setEventStatus('loading');
    void invoke<{ tournaments: unknown[] }>('fetch_public_tournaments')
      .then(data => {
        if (cancelled) return;
        if (!Array.isArray(data?.tournaments)) throw new Error('Invalid tournament list');
        const filtered = data.tournaments.filter(validTournament)
          .filter(item => item.status === 'upcoming' || item.status === 'live')
          .sort((a, b) => (a.startsAt || Number.MAX_SAFE_INTEGER) - (b.startsAt || Number.MAX_SAFE_INTEGER));
        setEvents(filtered);
        setEventStatus('ready');
      }).catch(() => {
        if (!cancelled) { setEventStatus('unavailable'); setEvents([]); }
      });
    return () => { cancelled = true; };
  }, [revision]);

  useEffect(() => {
    const timer = window.setInterval(() => setRevision(value => value + 1), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const online = phase === 'signed-in' && accountStatus === 'ready';
  const meta = record(profile?.meta);
  const isDemo = meta.isDemo === true;
  const stats = record(dashboard?.statistics);
  const games = !isDemo && online && typeof stats.games === 'number' ? stats.games : null;
  const hasResults = typeof games === 'number' && games > 0;
  const recent = Array.isArray(dashboard?.recentMatches) && !isDemo
    ? dashboard.recentMatches.map(record).slice(0, 8) : [];
  const running = status.phase === 'ready' && status.response.status === 'running';
  const checking = status.phase === 'loading';
  const processLabel = status.phase === 'error' ? 'Local detector unavailable' :
    checking ? 'Checking for VALORANT' : running ? 'VALORANT process running' :
    'VALORANT is not running';

  const [updatedAt, setUpdatedAt] = useState(() => new Date());
  useEffect(() => { setUpdatedAt(new Date()); }, [revision]);

  const ratings = [
    { label: 'Matches', value: hasResults ? numeric(games) : '—' },
    { label: 'Win rate', value: hasResults ? numeric(stats.winRate, 1, '%') : '—' },
    { label: 'K/D', value: hasResults ? numeric(stats.kd, 2) : '—' },
    { label: 'Avg. combat score', value: hasResults ? numeric(stats.acs) : '—' },
  ];
  const gameTone = running ? 'text-emerald-400' : status.phase === 'error' ? 'text-amber-300' : 'text-ink-muted';

  return <div className="home-layout">
    <aside className="home-rail" aria-label="Your profile">
      <div className="flex items-center gap-3 px-5 pb-5 pt-6">
        <span className="rail-avatar">{(online && account?.name ? account.name : 'A').slice(0, 1).toUpperCase()}</span>
        <div className="min-w-0">
          <p className="truncate font-display text-[17px] font-semibold text-ink">{online ? account?.name || 'Aventas player' : 'Guest'}</p>
          <p className="mt-0.5 text-[11px] text-ink-muted">{online ? 'Aventas account connected' : phase === 'checking' ? 'Connecting…' : 'Not signed in'}</p>
        </div>
      </div>
      <dl className="rail-stats">
        {ratings.map(item => <div key={item.label} className="rail-stat">
          <dt>{item.label}</dt>
          <dd className="a-number">{item.value}</dd>
        </div>)}
      </dl>
      <div className="rail-refresh">
        <span>Updated {updatedAt.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
        <button type="button" onClick={() => setRevision(value => value + 1)} title="Refresh" aria-label="Refresh home">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true"><path d="M20 6v5h-5M4 18v-5h5"/><path d="M5.5 10a7.5 7.5 0 0 1 12.8-3M18.5 14a7.5 7.5 0 0 1-12.8 3"/></svg>
        </button>
      </div>
      <div className="space-y-5 px-5 py-5">
        <div>
          <p className="text-[11px] text-ink-muted">Game</p>
          <p className="mt-1 flex items-center gap-2 text-[13px] font-medium text-ink">
            <span className={'a-status-dot ' + gameTone}/>{processLabel}
          </p>
          <p className="mt-1 text-[11px] leading-5 text-ink-muted">Read-only process check. Companion never reads game memory.</p>
        </div>
        {!online && <button type="button" className="a-button a-button-primary w-full" onClick={() => onNavigate?.('live')}>
          Connect Aventas account
        </button>}
      </div>
      <div className="mt-auto border-t border-line px-5 py-4">
        <p className="text-[11px] text-ink-muted">Next event</p>
        {events[0] ? <button type="button" onClick={() => onNavigate?.('tournaments')} className="mt-1 block w-full text-left">
          <span className="block truncate text-[13px] font-semibold text-ink hover:text-accent">{events[0].name}</span>
          <span className="mt-0.5 block text-[11px] text-ink-muted">{events[0].status === 'live' ? 'In progress now' : formatDate(events[0].startsAt)}</span>
        </button> : <p className="mt-1 text-[12px] text-ink-muted">
          {eventStatus === 'loading' ? 'Checking the event calendar…' : eventStatus === 'unavailable' ? 'Event calendar unavailable' : 'No events scheduled'}
        </p>}
      </div>
    </aside>

    <div className="min-w-0 flex-1 space-y-6 p-5 xl:p-7">
      <section className="a-panel overflow-hidden" aria-label="Recent matches">
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
          <h1 className="section-title">Recent matches</h1>
          <button type="button" onClick={() => onNavigate?.('live')} className="workspace-link">Full history</button>
        </div>
        <div className="overflow-x-auto">
          <table className="roster-table">
            <thead><tr>
              <th scope="col">Map</th><th scope="col">Agent</th><th scope="col">Result</th>
              <th scope="col" className="num">K</th><th scope="col" className="num">D</th><th scope="col" className="num">A</th>
              <th scope="col" className="num">K/D</th><th scope="col" className="num">Played</th>
            </tr></thead>
            <tbody>
              {recent.length > 0 && hasResults ? recent.map((match, index) => {
                const outcome = String(match.result || '').toLowerCase();
                const kd = typeof match.kills === 'number' && typeof match.deaths === 'number' && match.deaths > 0
                  ? (match.kills / match.deaths).toFixed(2) : '—';
                return <tr key={String(match.id || index)} data-result={outcome}>
                  <td className="font-semibold text-ink">{String(match.map || 'Unknown map')}</td>
                  <td>{String(match.agent || '—')}</td>
                  <td><span className="result-tag">{outcome === 'win' ? 'Victory' : outcome === 'loss' ? 'Defeat' : 'Draw'}</span></td>
                  <td className="num">{numeric(match.kills)}</td>
                  <td className="num">{numeric(match.deaths)}</td>
                  <td className="num">{numeric(match.assists)}</td>
                  <td className="num font-semibold text-ink">{kd}</td>
                  <td className="num text-ink-muted">{formatDate(match.playedAt as number | undefined)}</td>
                </tr>;
              }) : <tr className="roster-empty"><td colSpan={8}>
                <p className="font-semibold text-ink">No verified matches yet</p>
                <p className="mt-1">Your matches show up here after you connect your Aventas account and Riot access is approved.</p>
                {!online && <button type="button" onClick={() => onNavigate?.('live')} className="workspace-link mt-3">Connect account</button>}
              </td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section className="a-panel overflow-hidden" aria-label="Tournaments">
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
          <h2 className="section-title">Upcoming tournaments</h2>
          <button type="button" onClick={() => onNavigate?.('tournaments')} className="workspace-link">All brackets</button>
        </div>
        {eventStatus === 'ready' && events.length ? <ul className="divide-y divide-line/70">
          {events.slice(0, 4).map(event => <li key={event.slug}>
            <button type="button" onClick={() => onNavigate?.('tournaments')} className="a-pressable flex w-full items-center gap-3 px-4 py-3 text-left">
              <TrophyIcon width={16} height={16} className={event.status === 'live' ? 'text-emerald-400' : 'text-accent'}/>
              <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-ink">{event.name}</span>
              <span className="text-[12px] text-ink-muted">{event.status === 'live' ? 'Live now' : formatDate(event.startsAt)}</span>
              {event.region && <span className="a-chip">{event.region}</span>}
            </button>
          </li>)}
        </ul> : <p className="px-4 py-6 text-[12px] text-ink-muted">
          {eventStatus === 'loading' ? 'Loading events…' : eventStatus === 'unavailable' ? 'The Aventas website did not respond. Use refresh in the left panel to try again.' : 'No tournaments are open right now. Published events appear here.'}
        </p>}
      </section>

      <section className="flex flex-wrap items-center gap-4 rounded-[8px] border border-dashed border-line px-4 py-4">
        <PerformanceIcon width={18} height={18} className="text-accent"/>
        <p className="min-w-[220px] flex-1 text-[12px] leading-5 text-ink-muted">
          <span className="font-semibold text-ink">Waiting for Riot access?</span> Try round analysis and benchmarks in the Practice lab. Every screen there uses sample data.
        </p>
        <button type="button" className="a-button" onClick={() => onNavigate?.('performance')}>Open Practice lab</button>
      </section>
    </div>
  </div>;
}
