import { SessionRecap, PersonalBestToast } from '../components/SessionRecap';
import { SessionTape, type TapeMatch } from '../components/SessionTape';
import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useAventasAccount } from '../platform/AccountContext';
import { useValorantStatus } from '../hooks/useValorantStatus';
import { validTournament } from '../services/tournamentContract.mjs';
import type { Tournament } from '../services/tournamentContract.mjs';
import { CrosshairIcon, TrophyIcon, PerformanceIcon } from '../components/icons';
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

function SignalGlyph({ running, checking, unavailable }: { running: boolean; checking: boolean; unavailable: boolean }) {
  return <div className="relative mx-auto flex size-[228px] items-center justify-center sm:size-[252px]" aria-hidden="true">
    <div className={'absolute inset-0 rounded-full ' + (running ? 'bg-emerald-400/[0.045]' : 'bg-accent/[0.025]')} />
    <svg viewBox="0 0 260 260" className={'absolute inset-0 size-full ' + (running ? 'text-emerald-400' : 'text-accent')} fill="none">
      <circle cx="130" cy="130" r="115" stroke="currentColor" strokeOpacity=".17"/>
      <circle cx="130" cy="130" r="100" stroke="currentColor" strokeOpacity=".35" strokeDasharray="3 10"/>
      <circle cx="130" cy="130" r="81" stroke="currentColor" strokeOpacity=".17"/>
      <path d="M130 0v38M130 222v38M0 130h38M222 130h38" stroke="currentColor" strokeOpacity=".36" strokeWidth="1.5"/>
      <path d="M53 53l20 20M207 53l-20 20M53 207l20-20M207 207l-20-20" stroke="currentColor" strokeOpacity=".2"/>
      <circle cx="130" cy="130" r="59" stroke="currentColor" strokeOpacity=".29" strokeWidth="7"/>
      <path d="M130 46a84 84 0 0 1 84 84" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeOpacity=".7"/>
      {running && <circle cx="130" cy="130" r="102" stroke="currentColor" strokeWidth="2" strokeDasharray="44 596" strokeLinecap="round" className="origin-center animate-[spin_14s_linear_infinite]"/>}
    </svg>
    <div className={'relative z-10 flex size-[112px] flex-col items-center justify-center rounded-full border ' + (running
      ? 'border-emerald-400/35 bg-emerald-400/[0.08]' : 'border-line bg-app/85')}>
      <CrosshairIcon width={32} height={32} className={running ? 'text-emerald-400' : 'text-accent'}/>
      <span className="mt-2 font-display text-[12px] font-semibold text-ink">
        {unavailable ? 'Unavailable' : checking ? 'Scanning' : running ? 'Game active' : 'On standby'}
      </span>
    </div>
    <span className="absolute bottom-0 right-[-12px] rounded-[5px] border border-line bg-app px-2.5 py-1.5 font-mono text-[10px] text-ink-muted">
      LOCAL / PC
    </span>
  </div>;
}

function ActionLink({ label, onClick, primary = false }: { label: string; onClick?: () => void; primary?: boolean }) {
  return <button type="button" className={'a-button ' + (primary ? 'a-button-primary' : '')} onClick={onClick}>
    {label}
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="15" height="15" aria-hidden="true"><path d="M4 12h16m-7-7 7 7-7 7"/></svg>
  </button>;
}

const T0 = Date.UTC(2026, 10, 21, 18, 0);
const SAMPLE_TAPE: TapeMatch[] = [
  { id: 's1', map: 'Ascent', agent: 'Jett', won: 13, lost: 9, rr: 21, kills: 24, deaths: 14, assists: 6, acs: 268, playedAt: T0 },
  { id: 's2', map: 'Icebox', agent: 'Jett', won: 11, lost: 13, rr: -16, kills: 17, deaths: 18, assists: 4, acs: 221, playedAt: T0 + 1 },
  { id: 's3', map: 'Lotus', agent: 'Omen', won: 13, lost: 7, rr: 24, kills: 19, deaths: 11, assists: 9, acs: 247, playedAt: T0 + 2 },
  { id: 's4', map: 'Bind', agent: 'Raze', won: 13, lost: 11, rr: 18, kills: 22, deaths: 16, assists: 5, acs: 255, playedAt: T0 + 3 },
  { id: 's5', map: 'Sunset', agent: 'Jett', won: 13, lost: 10, rr: 20, kills: 26, deaths: 15, assists: 3, acs: 291, playedAt: T0 + 4 },
];

// Older sample games, so the sample recap can show how personal bests read.
const SAMPLE_HISTORY: TapeMatch[] = [
  { id: 'h1', map: 'Haven', agent: 'Jett', won: 13, lost: 8, kills: 23, deaths: 12, assists: 5, acs: 284, playedAt: T0 - 86_400_000 },
  { id: 'h2', map: 'Split', agent: 'Raze', won: 10, lost: 13, kills: 18, deaths: 17, assists: 6, acs: 231, playedAt: T0 - 2 * 86_400_000 },
  { id: 'h3', map: 'Bind', agent: 'Jett', won: 13, lost: 6, kills: 25, deaths: 10, assists: 4, acs: 276, playedAt: T0 - 3 * 86_400_000 },
  { id: 'h4', map: 'Ascent', agent: 'Omen', won: 13, lost: 11, kills: 16, deaths: 14, assists: 11, acs: 219, playedAt: T0 - 4 * 86_400_000 },
  { id: 'h5', map: 'Lotus', agent: 'Jett', won: 7, lost: 13, kills: 14, deaths: 17, assists: 3, acs: 198, playedAt: T0 - 5 * 86_400_000 },
  { id: 'h6', map: 'Pearl', agent: 'Sova', won: 13, lost: 9, kills: 20, deaths: 13, assists: 9, acs: 247, playedAt: T0 - 6 * 86_400_000 },
];

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
    ? dashboard.recentMatches.map(record).slice(0, 4) : [];
  const running = status.phase === 'ready' && status.response.status === 'running';
  const checking = status.phase === 'loading';
  const processLabel = status.phase === 'error' ? 'Local detector unavailable' :
    checking ? 'Checking for VALORANT' : running ? 'VALORANT process running' :
    'VALORANT is not running';

  // Tonight's tape: verified website matches from the last 12 hours, or a
  // clearly labelled sample when no account data is available yet.
  const liveTape: TapeMatch[] = (Array.isArray(dashboard?.recentMatches) && !isDemo ? dashboard.recentMatches.map(record) : [])
    .map((m, i) => {
      const [won, lost] = String(m.score ?? '').split(/\s*[-–:]\s*/).map(Number);
      return { id: String(m.id ?? i), map: String(m.map ?? 'Unknown'), agent: m.agent ? String(m.agent) : undefined,
        won: Number.isFinite(won) ? won : (m.result === 'win' ? 13 : 0), lost: Number.isFinite(lost) ? lost : (m.result === 'win' ? 0 : 13),
        rr: typeof m.rrChange === 'number' ? m.rrChange : undefined,
        kills: m.kills as number | undefined, deaths: m.deaths as number | undefined, assists: m.assists as number | undefined,
        acs: m.acs as number | undefined, playedAt: Number(m.playedAt ?? 0) };
    })
    ;
  const cutoff = Date.now() - 12 * 3600_000;
  const liveTonight = liveTape.filter(m => m.playedAt > cutoff);
  const liveEarlier = liveTape.filter(m => m.playedAt <= cutoff);
  const rankCurrent = record(record(dashboard?.rank).current);
  const showSample = !hasResults;
  const tape = showSample ? SAMPLE_TAPE : liveTonight;
  const earlier = showSample ? SAMPLE_HISTORY : liveEarlier;

  return <div className="page-stage space-y-7">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="flex items-center gap-2 text-[13px] text-ink-muted">
        <span className={'a-status-dot ' + (running ? 'text-emerald-400' : 'text-ink-muted')}/>
        {processLabel}
        <span className="text-ink-muted/60">(read-only process check, no game memory access)</span>
      </p>
      <div className="flex gap-2">
        <ActionLink primary label="Open Live Tracker" onClick={() => onNavigate?.('live')}/>
        <button type="button" className="a-button" onClick={() => setRevision(value => value + 1)}>Refresh</button>
      </div>
    </div>

    <SessionTape matches={tape} sample={showSample}
      rankLabel={showSample ? 'Diamond 2' : (rankCurrent.tier ? String(rankCurrent.tier) : undefined)}
      rr={showSample ? 74 : (typeof rankCurrent.rr === 'number' ? rankCurrent.rr : undefined)}/>
    <SessionRecap tonight={tape} earlier={earlier} sample={showSample}/>
    <PersonalBestToast tonight={tape} earlier={earlier} sample={showSample}/>
    {showSample && <p className="-mt-4 text-[13px] text-ink-muted">This is a sample of what tonight looks like. Connect your Aventas account in Live Tracker and your real games fill the tape.</p>}

    <section aria-label="Account performance">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="font-display text-[17px] font-semibold text-ink">Performance at a glance</h2>
          <span className="a-chip" data-tone={hasResults ? 'live' : 'warning'}>
            {hasResults ? 'Website records' : 'Not yet synced'}
          </span>
        </div>
        <span className="text-[11px] text-ink-muted">
          {online ? (isDemo ? 'Demo identity hidden from live metrics' : account?.name) :
            phase === 'signed-out' ? 'Connect your Aventas account to view stats' :
            phase === 'checking' || accountStatus === 'loading' ? 'Checking website' : 'Stats unavailable'}
        </span>
      </div>
      <div className="a-metric-strip">
        {[
          { label: 'Recorded matches', value: hasResults ? numeric(games) : '—', hint: hasResults ? 'Official website history' : 'Awaiting match sync' },
          { label: 'Win rate', value: hasResults ? numeric(stats.winRate, 1, '%') : '—', hint: 'Verified competitive data only' },
          { label: 'K/D ratio', value: hasResults ? numeric(stats.kd, 2) : '—', hint: 'From completed matches' },
          { label: 'Average ACS', value: hasResults ? numeric(stats.acs) : '—', hint: 'Combat score' },
        ].map(item => <div key={item.label} className="a-metric">
          <p className="label">{item.label}</p>
          <p className="value mt-1 text-ink">{item.value}</p>
          <p className="hint">{item.hint}</p>
        </div>)}
      </div>
    </section>

    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(310px,.82fr)]">
      <section className="a-panel min-w-0 overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div>
            <h2 className="font-display text-[17px] font-semibold text-ink">Recent performance</h2>
            <p className="mt-1 text-[11px] text-ink-muted">Your completed matches on the Aventas website</p>
          </div>
          <button type="button" onClick={() => onNavigate?.('live')}
            className="text-[12px] font-semibold text-accent hover:underline">Full history</button>
        </div>
        {recent.length > 0 && hasResults ? <div className="divide-y divide-line/70">
          {recent.map((match, index) => {
            const outcome = String(match.result || '').toLowerCase();
            const resultTone = outcome === 'win' ? 'text-emerald-400' : outcome === 'loss' ? 'text-accent' : 'text-ink-muted';
            return <div key={String(match.id || index)} className="flex min-h-[72px] items-center gap-4 px-5 py-3">
              <span className={'flex size-8 shrink-0 items-center justify-center rounded-[6px] border border-line bg-app font-display text-[13px] font-semibold ' + resultTone}>
                {outcome === 'win' ? 'W' : outcome === 'loss' ? 'L' : '–'}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-ink">{String(match.map || 'Map unavailable')}</p>
                <p className="mt-1 truncate text-[11px] text-ink-muted">{String(match.agent || 'Agent unavailable')} · {formatDate(match.playedAt as number | undefined)}</p>
              </div>
              <div className="text-right">
                <p className="a-number text-[16px] text-ink">{[match.kills,match.deaths,match.assists].map(value => numeric(value)).join(' / ')}</p>
                <p className="text-[10px] text-ink-muted">Kills / deaths / assists</p>
              </div>
            </div>;
          })}
        </div> : <div className="a-empty m-4">
          <p className="font-semibold text-ink">No verified matches yet</p>
          <p className="mt-1">Your Riot match history will appear here when your website account is linked and authorized data is available.</p>
          <button type="button" onClick={() => onNavigate?.('live')} className="mt-3 text-[12px] font-semibold text-accent hover:underline">
            Connect to Aventas
          </button>
        </div>}
      </section>

      <section className="a-panel min-w-0 overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div>
            <h2 className="font-display text-[17px] font-semibold text-ink">Competition board</h2>
            <p className="mt-1 text-[11px] text-ink-muted">Upcoming and active Aventas events</p>
          </div>
          <TrophyIcon width={20} height={20} className="text-accent"/>
        </div>
        {eventStatus === 'ready' && events.length ? <div className="divide-y divide-line/70">
          {events.slice(0, 3).map(event => <button key={event.slug} type="button" onClick={() => onNavigate?.('tournaments')}
            className="a-pressable flex w-full items-center gap-3 px-5 py-4 text-left">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-[7px] border border-line bg-app text-accent"><TrophyIcon width={18} height={18}/></span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-semibold text-ink">{event.name}</span>
              <span className="mt-1 block text-[11px] text-ink-muted">{event.status === 'live' ? 'Live tournament' : formatDate(event.startsAt)}{event.region ? ' · ' + event.region : ''}</span>
            </span>
            <span className="text-[15px] text-ink-muted" aria-hidden="true">›</span>
          </button>)}
        </div> : <div className="a-empty m-4">
          <p className="font-semibold text-ink">
            {eventStatus === 'loading' ? 'Loading events…' : eventStatus === 'unavailable' ? 'Website unavailable' : 'No active competitions'}
          </p>
          <p className="mt-1">{eventStatus === 'unavailable' ? 'Check your connection, then refresh the board.' : 'Events will appear here when they are published on Aventas.'}</p>
        </div>}
        <div className="border-t border-line px-5 py-4">
          <button type="button" onClick={() => onNavigate?.('tournaments')} className="flex items-center gap-2 text-[12px] font-semibold text-ink hover:text-accent">
            See the full bracket board <span aria-hidden="true">↗</span>
          </button>
        </div>
      </section>
    </div>

    <section className="a-panel-soft flex flex-wrap items-start gap-4 p-5 md:items-center">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-[8px] border border-line bg-panel text-accent"><PerformanceIcon width={20} height={20}/></span>
      <div className="min-w-[220px] flex-1">
        <h2 className="font-display text-[15px] font-semibold text-ink">Waiting for official Riot tracking?</h2>
        <p className="mt-1 text-[12px] leading-6 text-ink-muted">Explore sample round analysis in the Practice lab. Every practice screen is marked as demo data, so you can test the interface without mistaking it for live results.</p>
      </div>
      <ActionLink label="Open Practice lab" onClick={() => onNavigate?.('performance')}/>
    </section>
  </div>;
}
