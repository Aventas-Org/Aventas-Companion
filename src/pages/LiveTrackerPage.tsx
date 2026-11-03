import { useEffect, useState, type FormEvent } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useAventasAccount } from '../platform/AccountContext';
import { CrosshairIcon, PerformanceIcon, StatisticsIcon } from '../components/icons';

type Tab = 'dashboard' | 'matches' | 'agents' | 'maps' | 'progress' | 'insights';
const tabs: Array<{ id: Tab; label: string }> = [
  { id: 'dashboard', label: 'Overview' }, { id: 'matches', label: 'Matches' },
  { id: 'agents', label: 'Agents' }, { id: 'maps', label: 'Maps' },
  { id: 'progress', label: 'Progress' }, { id: 'insights', label: 'Insights' },
];
type RecordData = Record<string, unknown>;
interface Match {
  id: string; map?: string; agent?: string; result?: string; playedAt?: number;
  kills?: number; deaths?: number; assists?: number; acs?: number;
  headshotPercent?: number; queue?: string;
}
const record = (value: unknown): RecordData =>
  value && typeof value === 'object' && !Array.isArray(value) ? value as RecordData : {};
const list = <T,>(value: unknown): T[] => Array.isArray(value) ? value as T[] : [];
const fmt = (value: unknown, decimals = 0, suffix = ''): string =>
  typeof value === 'number' && Number.isFinite(value) ? value.toFixed(decimals) + suffix : '—';
const played = (value?: number) =>
  typeof value === 'number' && value > 0
    ? new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : 'Date not available';
const outcome = (result?: string) => {
  const lowered = (result || '').toLowerCase();
  return lowered === 'win' ? 'Victory' : lowered === 'loss' ? 'Defeat' : 'Recorded';
};

function SignIn() {
  const { login } = useAventasAccount();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setMessage(''); setBusy(true);
    try { await login(email, password); }
    catch { setMessage('Sign-in failed. Check your Aventas account credentials and network connection.'); }
    finally { setPassword(''); setBusy(false); }
  }

  return <div className="grid overflow-hidden rounded-[13px] border border-line bg-panel lg:grid-cols-[minmax(0,1fr)_minmax(310px,.82fr)]">
    <div className="relative flex min-h-[370px] flex-col justify-between overflow-hidden border-b border-line p-7 lg:border-b-0 lg:border-r lg:p-9">
      <div className="pointer-events-none absolute -right-32 -top-24 size-[360px] rounded-full border border-accent/20" aria-hidden="true">
        <div className="absolute inset-10 rounded-full border border-line"/>
        <div className="absolute inset-20 rounded-full border border-accent/30"/>
        <div className="absolute inset-36 rounded-full bg-accent/[0.06]"/>
      </div>
      <div className="relative">
        <span className="a-chip" data-tone="accent">Personal workspace</span>
        <h2 className="mt-7 max-w-[410px] font-display text-[33px] font-semibold leading-[1.1] tracking-[-.045em] text-ink">
          Your match history belongs to you.
        </h2>
        <p className="mt-4 max-w-[400px] text-[13px] leading-7 text-ink-muted">
          Connect the Aventas account you already use on the website. Your own approved stats will appear here when Riot linking becomes available.
        </p>
      </div>
      <div className="relative mt-8 space-y-2 border-t border-line pt-5 text-[12px] text-ink-muted">
        <div className="flex items-center gap-3"><span className="size-1.5 rounded-full bg-accent"/>No credentials saved to disk</div>
        <div className="flex items-center gap-3"><span className="size-1.5 rounded-full bg-accent"/>No opponent scouting or game injection</div>
        <div className="flex items-center gap-3"><span className="size-1.5 rounded-full bg-accent"/>Match data only when officially authorized</div>
      </div>
    </div>
    <div className="p-7 lg:p-9">
      <div className="flex size-11 items-center justify-center rounded-[9px] border border-line bg-app text-accent">
        <CrosshairIcon width={22} height={22}/>
      </div>
      <h3 className="mt-5 font-display text-[21px] font-semibold text-ink">Sign in to Aventas</h3>
      <p className="mt-1 text-[12px] leading-6 text-ink-muted">Your existing website email and password.</p>
      <form className="mt-7 space-y-5" onSubmit={(e) => void submit(e)}>
        <label className="block text-[12px] font-semibold text-ink">Email
          <input className="a-input mt-2" type="email" required autoComplete="email" value={email}
            onChange={e => setEmail(e.target.value)} placeholder="you@example.com"/>
        </label>
        <label className="block text-[12px] font-semibold text-ink">Password
          <input className="a-input mt-2" type="password" required autoComplete="current-password" value={password}
            onChange={e => setPassword(e.target.value)} placeholder="Your account password"/>
        </label>
        {message && <p role="alert" className="rounded-[7px] border border-accent/25 bg-accent/10 p-3 text-[12px] text-ink">{message}</p>}
        <button className="a-button a-button-primary w-full !py-3" type="submit" disabled={busy}>
          {busy ? 'Connecting securely…' : 'Sign in'}
        </button>
      </form>
      <p className="mt-6 text-[11px] leading-5 text-ink-muted">
        The session token stays in native memory and expires when the app closes. Discord-only account login is not available in this preview.
      </p>
    </div>
  </div>;
}

function MetricStrip({ items }: { items: Array<{ title: string; value: string; hint?: string }> }) {
  return <div className="a-metric-strip">{items.map(item => <div className="a-metric" key={item.title}>
    <p className="label">{item.title}</p>
    <p className="value mt-1 text-ink">{item.value}</p>
    {item.hint && <p className="hint">{item.hint}</p>}
  </div>)}</div>;
}

function MatchTable({ matches }: { matches: Match[] }) {
  if (!matches.length) return <div className="a-empty">
    <p className="font-semibold text-ink">No match history yet</p>
    <p className="mt-1">Records arrive only after server-side Riot authorization and an actual match sync. No sample data is shown in this view.</p>
  </div>;

  return <div className="a-panel overflow-x-auto">
    <table className="a-table min-w-[650px]">
      <thead><tr>{['Match', 'Result', 'K / D / A', 'ACS', 'Headshots'].map(h => <th key={h}>{h}</th>)}</tr></thead>
      <tbody>{matches.map((m, index) => {
        const result = outcome(m.result);
        return <tr key={m.id || index}>
          <td>
            <div className="flex items-center gap-3">
              <span className={'h-9 w-[3px] shrink-0 rounded-full ' +
                (result === 'Victory' ? 'bg-emerald-400' : result === 'Defeat' ? 'bg-accent' : 'bg-line')}/>
              <div>
                <p className="font-semibold text-ink">{m.map || 'Unknown map'}</p>
                <p className="mt-1 text-[11px] text-ink-muted">{m.agent || 'Unknown agent'} · {played(m.playedAt)}</p>
              </div>
            </div>
          </td>
          <td><span className={'font-semibold ' + (result === 'Victory' ? 'text-emerald-400' : result === 'Defeat' ? 'text-accent' : 'text-ink-muted')}>{result}</span></td>
          <td className="a-number text-[14px] text-ink">{fmt(m.kills)} / {fmt(m.deaths)} / {fmt(m.assists)}</td>
          <td className="a-number text-[14px] text-ink">{fmt(m.acs)}</td>
          <td className="a-number text-[14px] text-ink">{fmt(m.headshotPercent, 1, '%')}</td>
        </tr>;
      })}</tbody>
    </table>
  </div>;
}

function ResultTimeline({ matches }: { matches: Match[] }) {
  const scoped = matches.filter(m => m.result === 'win' || m.result === 'loss');
  if (!scoped.length) return <div className="a-empty">No verified match trend yet. The timeline will populate as completed matches synchronize.</div>;
  const wins = scoped.filter(m => m.result === 'win').length;
  return <div className="a-panel p-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><p className="a-eyebrow">Recent form</p><h3 className="mt-1 font-display text-[16px] font-semibold text-ink">Your last {scoped.length} recorded results</h3></div>
      <p className="a-number text-[20px] text-ink">{wins}<span className="px-1.5 text-ink-muted">/</span>{scoped.length} <span className="font-ui text-[11px] font-normal text-ink-muted">wins</span></p>
    </div>
    <div className="mt-5 flex h-[50px] gap-[5px]">
      {scoped.slice(0, 20).reverse().map((match, index) => <span key={match.id || index}
        title={played(match.playedAt) + ' · ' + outcome(match.result)}
        className={'min-w-0 flex-1 rounded-[4px] ' + (match.result === 'win' ? 'bg-emerald-400/75' : 'bg-accent/65')}
        aria-label={outcome(match.result) + ' on ' + (match.map || 'unknown map')}/>)}
    </div>
    <div className="mt-3 flex items-center justify-between text-[10px] text-ink-muted"><span>Older</span><span>Most recent</span></div>
  </div>;
}

function Breakdown({ tab, value }: { tab: 'agents' | 'maps'; value: RecordData }) {
  const rows = list<RecordData>(value[tab]);
  if (!rows.length) return <div className="a-empty">No {tab} breakdown yet. Complete matches must be synchronized before this view can be calculated.</div>;
  return <div className="a-panel overflow-x-auto">
    <table className="a-table min-w-[570px]">
      <thead><tr>{[tab === 'agents' ? 'Agent' : 'Map', 'Matches', 'Win rate', 'K/D', 'ACS', 'HS %'].map(h => <th key={h}>{h}</th>)}</tr></thead>
      <tbody>{rows.map((row, index) => {
        const name = String(tab === 'agents' ? row.agent || 'Unknown agent' : row.map || 'Unknown map');
        const rate = typeof row.winRate === 'number' ? Math.min(100, Math.max(0, row.winRate)) : null;
        return <tr key={name + index}>
          <td className="font-semibold text-ink">{name}</td>
          <td className="a-number text-ink">{fmt(row.games)}</td>
          <td className="min-w-[150px]">
            <div className="flex items-center gap-3">
              <span className="a-number w-11 shrink-0 text-ink">{fmt(row.winRate, 1, '%')}</span>
              <span className="h-[5px] flex-1 overflow-hidden rounded-full bg-line">
                {rate !== null && <span className="block h-full rounded-full bg-accent" style={{ width: rate + '%' }}/>}
              </span>
            </div>
          </td>
          <td className="a-number text-ink">{fmt(row.kd, 2)}</td>
          <td className="a-number text-ink">{fmt(row.acs)}</td>
          <td className="a-number text-ink">{fmt(row.headshotPercent, 1, '%')}</td>
        </tr>;
      })}</tbody>
    </table>
  </div>;
}

function Panel({ tab, data, verified }: { tab: Tab; data: RecordData; verified: boolean }) {
  if (tab === 'matches') return <MatchTable matches={list<Match>(data.matches)} />;
  if (tab === 'agents' || tab === 'maps') return <Breakdown tab={tab} value={data}/>;
  if (tab === 'progress') {
    const comparison = record(data.comparison), current = record(comparison.current);
    return <div className="space-y-5">
      <MetricStrip items={[
        { title: 'Recent matches', value: fmt(current.games) },
        { title: 'Recent win rate', value: fmt(current.winRate, 1, '%') },
        { title: 'ACS change', value: fmt(comparison.acsDeltaPct, 1, '%') },
        { title: 'K/D change', value: fmt(comparison.kdDelta, 2) },
      ]}/>
      <div className="a-empty">Progress comparisons reflect only the server's available match samples. Missing windows and unverified rank changes are never estimated.</div>
    </div>;
  }
  if (tab === 'insights') {
    const insights = list<RecordData>(data.insights);
    if (!insights.length) return <div className="a-empty">There aren't enough verified matches for useful coaching insights yet.</div>;
    return <div className="grid gap-4 lg:grid-cols-2">{insights.map((insight, index) =>
      <article className="a-panel relative overflow-hidden p-6" key={String(insight.id || index)}>
        <span className="a-eyebrow text-accent">{String(insight.category || 'Analysis')}</span>
        <h3 className="mt-3 font-display text-[20px] font-semibold tracking-[-.025em] text-ink">{String(insight.title || 'Insight')}</h3>
        <p className="mt-3 text-[12px] leading-7 text-ink-muted">{String(insight.body || '')}</p>
        {insight.stat !== undefined && insight.stat !== null && insight.stat !== '' && <p className="mt-5 border-t border-line pt-4 text-[12px] text-ink">{String(insight.stat)}</p>}
      </article>)}</div>;
  }

  const stats = record(data.statistics), rank = record(record(data.rank).current);
  const games = Number(stats.games || 0);
  const matchRows = list<Match>(data.recentMatches);

  return <div className="space-y-5">
    <MetricStrip items={[
      { title: 'Recorded matches', value: fmt(stats.games), hint: 'Official website record' },
      { title: 'Win rate', value: games > 0 ? fmt(stats.winRate, 1, '%') : '—', hint: 'Competitive matches' },
      { title: 'K/D ratio', value: games > 0 ? fmt(stats.kd, 2) : '—', hint: 'Kills per death' },
      { title: 'Average ACS', value: games > 0 ? fmt(stats.acs) : '—', hint: 'Combat score' },
    ]}/>
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
      <ResultTimeline matches={matchRows}/>
      <div className="a-panel flex flex-col justify-between p-5">
        <div className="flex items-center justify-between">
          <p className="a-eyebrow">Competitive rating</p>
          <StatisticsIcon width={19} height={19} className="text-accent"/>
        </div>
        <div>
          <p className="mt-7 font-display text-[29px] font-semibold tracking-[-.04em] text-ink">
            {verified && games > 0 ? String(rank.tier || 'Unranked') : 'Not linked'}
          </p>
          <p className="mt-1 text-[12px] text-ink-muted">
            {verified && games > 0 ? fmt(rank.rr, 0, ' RR') : 'Verified Riot linking required'}
          </p>
        </div>
        <p className="mt-5 border-t border-line pt-4 text-[11px] leading-5 text-ink-muted">
          Rank is shown only when the website confirms a linked Riot identity and synced games.
        </p>
      </div>
    </div>
    <div className="flex items-center justify-between">
      <h3 className="font-display text-[17px] font-semibold text-ink">Latest matches</h3>
      <span className="text-[11px] text-ink-muted">Official account history</span>
    </div>
    <MatchTable matches={matchRows.slice(0, 8)}/>
  </div>;
}

export function LiveTrackerPage() {
  const { phase, account, logout, refresh } = useAventasAccount();
  const [tab, setTab] = useState<Tab>('dashboard');
  const [revision, setRevision] = useState(0);
  const [data, setData] = useState<RecordData | null>(null);
  const [profile, setProfile] = useState<RecordData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastSync, setLastSync] = useState<number | null>(null);

  useEffect(() => {
    if (phase !== 'signed-in') return;
    const timer = window.setInterval(() => setRevision(n => n + 1), 60_000);
    return () => window.clearInterval(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'signed-in' || !account) {
      setData(null); setProfile(null); setLastSync(null); return;
    }
    let cancelled = false;
    setLoading(true); setError('');
    void Promise.all([
      invoke<RecordData>('desktop_companion_data', { endpoint: tab }),
      invoke<RecordData>('desktop_companion_data', { endpoint: 'profile' }),
    ]).then(([stats, meta]) => {
      if (cancelled) return;
      setData(stats); setProfile(meta); setLastSync(Date.now());
    }).catch((cause: unknown) => {
      if (cancelled) return;
      setData(null); setProfile(null);
      const message = String(cause);
      if (message.includes('Session expired') || message.includes('Sign in to your Aventas')) {
        void refresh();
      } else {
        setError('The website is unavailable or this account has no authorized tracker data. Check your connection and retry.');
      }
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [phase, account?.id, tab, revision, refresh]);

  const player = record(profile?.player), meta = record(profile?.meta);
  const isDemo = meta.isDemo === true;
  const linked = meta.hasRiotLink === true && !isDemo;
  return <section className="page-stage space-y-6">
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="page-kicker">Aventas / Competitive analysis</p>
        <h1 className="page-heading mt-2">Live Tracker.</h1>
        <p className="page-description mt-3">Your personal competitive history, sourced from your Aventas website account.</p>
      </div>
      {phase === 'signed-in' && <div className="flex items-center gap-2">
        <button type="button" className="a-button" onClick={() => setRevision(n => n + 1)}>Refresh</button>
        <button type="button" className="a-button" onClick={() => void logout()}>Sign out</button>
      </div>}
    </header>
    {phase === 'checking' && <p role="status" className="a-empty">Checking your Aventas account session…</p>}
    {phase === 'signed-out' && <SignIn/>}
    {phase === 'signed-in' && <>
      <div className="a-hero flex flex-wrap items-center gap-5 p-6 sm:p-8">
        <div className="flex size-[68px] shrink-0 items-center justify-center rounded-[12px] border border-accent/30 bg-accent/10 text-accent">
          <CrosshairIcon width={30} height={30}/>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-[23px] font-semibold tracking-[-.03em] text-ink">
              {profile ? String(player.riotId || account?.name || 'Aventas player') : account?.name || 'Aventas player'}
              {profile && player.tagline ? '#' + String(player.tagline) : ''}
            </h2>
            <span className="a-chip" data-tone={linked ? 'live' : 'warning'}>{isDemo ? 'Demo source' : linked ? 'Riot identity linked' : 'Link required'}</span>
          </div>
          <p className="mt-2 text-[12px] text-ink-muted">
            {isDemo ? 'This account is configured for development demonstration. It is not your live Riot identity.' :
              linked ? 'Website account verified. Match history is available only when the approved sync has records.' :
              'Your Aventas account is connected. Riot match data requires separate authorized linking.'}
          </p>
        </div>
        <div className="text-left sm:text-right">
          <span className="a-chip" data-tone="live"><span className="a-status-dot"/>Website account</span>
          {lastSync && <p className="mt-2 text-[11px] text-ink-muted">Checked {new Date(lastSync).toLocaleTimeString()}</p>}
        </div>
      </div>

      <div className="a-segment" role="tablist" aria-label="Tracker sections">
        {tabs.map(item => <button role="tab" type="button" key={item.id} aria-selected={tab === item.id}
          onClick={() => setTab(item.id)}>{item.label}</button>)}
      </div>

      {loading && <div className="a-panel space-y-4 p-7" role="status" aria-live="polite">
        <div className="h-3 w-32 animate-pulse rounded bg-line"/>
        <div className="h-9 w-[55%] animate-pulse rounded bg-line"/>
        <div className="h-3 w-[75%] animate-pulse rounded bg-line"/>
        <p className="text-[11px] text-ink-muted">Loading account records from Aventas…</p>
      </div>}
      {error && <div role="alert" className="a-empty">
        <p className="font-semibold text-ink">Account data couldn't be retrieved</p>
        <p className="mt-1">{error}</p>
        <button type="button" className="a-button mt-4" onClick={() => setRevision(n => n + 1)}>Try again</button>
      </div>}
      {!loading && !error && isDemo && <div className="a-empty">
        <p className="font-semibold text-ink">Development data is not live tracking</p>
        <p className="mt-2">This source is a demo account. Use the Practice lab to explore sample data; real Riot records will be shown only after authorized synchronization.</p>
      </div>}
      {!loading && !error && data && !isDemo && <Panel tab={tab} data={data} verified={linked}/>}
      <div className="flex items-start gap-3 border-t border-line pt-4 text-[11px] leading-6 text-ink-muted">
        <PerformanceIcon width={18} height={18} className="mt-0.5 shrink-0 text-ink-muted"/>
        <p>Official match history is read-only here. No live opponent data, player scouting or unsupported competitive assistance is enabled. Sync checks run every 60 seconds while this page is open.</p>
      </div>
    </>}
  </section>;
}
