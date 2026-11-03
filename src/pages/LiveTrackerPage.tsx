import { useEffect, useState, type FormEvent } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useAventasAccount } from '../platform/AccountContext';

type Tab = 'dashboard' | 'matches' | 'agents' | 'maps' | 'progress' | 'insights';
const tabs: Tab[] = ['dashboard', 'matches', 'agents', 'maps', 'progress', 'insights'];
type RecordData = Record<string, unknown>;
interface Match {
  id: string; map?: string; agent?: string; result?: string; playedAt?: number;
  kills?: number; deaths?: number; assists?: number; acs?: number; headshotPercent?: number;
}
const panel = 'rounded-xl border border-line bg-panel p-5';
const metric = (n: unknown, suffix = '', precision = 0) =>
  typeof n === 'number' && Number.isFinite(n) ? n.toFixed(precision) + suffix : '—';
const object = (v: unknown): RecordData =>
  v && typeof v === 'object' && !Array.isArray(v) ? v as RecordData : {};
const array = <T,>(v: unknown): T[] => Array.isArray(v) ? v as T[] : [];

function Login() {
  const { login } = useAventasAccount();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError(''); setBusy(true);
    try { await login(email, password); }
    catch { setError('Could not sign in. Check your Aventas website credentials and network connection.'); }
    finally { setPassword(''); setBusy(false); }
  }
  return <div className={panel + ' max-w-xl'}>
    <h3 className="font-semibold text-ink">Connect your Aventas account</h3>
    <p className="mt-2 text-sm text-ink-muted">Use the email/password you use on the Aventas website. The session token stays inside the native Rust process, never in local storage or the webview.</p>
    <form onSubmit={(e) => void submit(e)} className="mt-4 space-y-4">
      <label className="block text-sm text-ink">Email
        <input type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} className="mt-1 block w-full rounded-lg border border-line bg-app p-3" />
      </label>
      <label className="block text-sm text-ink">Password
        <input type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} className="mt-1 block w-full rounded-lg border border-line bg-app p-3" />
      </label>
      {error && <p role="alert" className="text-xs text-red-400">{error}</p>}
      <button type="submit" disabled={busy} className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-app disabled:opacity-50">{busy ? 'Signing in…' : 'Sign in'}</button>
    </form>
    <p className="mt-4 text-xs text-ink-muted">Discord-only accounts need a separate desktop sign-in flow. Live Riot match data requires server-side approval and account linking.</p>
  </div>;
}

function Tiles({ values }: { values: Array<{ name: string; value: string }> }) {
  return <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">{values.map(item =>
    <div className={panel} key={item.name}><p className="text-xs text-ink-muted">{item.name}</p>
      <p className="mt-2 text-2xl font-semibold text-ink">{item.value}</p></div>)}</div>;
}

function Matches({ matches }: { matches: Match[] }) {
  if (!matches.length) return <p className={panel + ' text-sm text-ink-muted'}>No verified match records are available for this account.</p>;
  return <div className="overflow-x-auto rounded-xl border border-line bg-panel">
    <table className="w-full text-left text-sm text-ink">
      <thead><tr className="border-b border-line text-xs uppercase text-ink-muted">
        {['Played', 'Map / agent', 'Result', 'K / D / A', 'ACS', 'HS %'].map(h => <th className="p-3" key={h}>{h}</th>)}
      </tr></thead>
      <tbody>{matches.map(m => <tr key={m.id} className="border-b border-line/60">
        <td className="p-3 text-xs">{m.playedAt ? new Date(m.playedAt).toLocaleDateString() : '—'}</td>
        <td className="p-3">{m.map || 'Unknown'}<span className="block text-xs text-ink-muted">{m.agent || 'Unknown'}</span></td>
        <td className="p-3 capitalize">{m.result || '—'}</td>
        <td className="p-3">{m.kills ?? '—'} / {m.deaths ?? '—'} / {m.assists ?? '—'}</td>
        <td className="p-3">{metric(m.acs)}</td>
        <td className="p-3">{metric(m.headshotPercent, '%', 1)}</td>
      </tr>)}</tbody>
    </table>
  </div>;
}

function Data({ tab, value, verified }: { tab: Tab; value: RecordData; verified: boolean }) {
  if (tab === 'matches') return <Matches matches={array<Match>(value.matches)} />;
  if (tab === 'dashboard') {
    const stats = object(value.statistics), currentRank = object(object(value.rank).current);
    return <div className="space-y-5">
      <Tiles values={[
        { name: 'Official matches', value: metric(stats.games) },
        { name: 'Win rate', value: metric(stats.winRate, '%', 1) },
        { name: 'K/D ratio', value: metric(stats.kd, '', 2) },
        { name: 'Average ACS', value: metric(stats.acs) },
        { name: 'Average ADR', value: metric(stats.adr) },
        { name: 'Headshot rate', value: metric(stats.headshotPercent, '%', 1) },
        { name: 'Rank', value: verified && Number(stats.games || 0) > 0 ? String(currentRank.tier || 'Unknown') : 'Not verified' },
        { name: 'Rank rating', value: verified && Number(stats.games || 0) > 0 ? metric(currentRank.rr, ' RR') : '—' },
      ]} />
      <h3 className="text-sm font-semibold uppercase text-ink-muted">Recent official matches</h3>
      <Matches matches={array<Match>(value.recentMatches).slice(0, 8)} />
    </div>;
  }
  if (tab === 'progress') {
    const comparison = object(value.comparison), current = object(comparison.current);
    return <Tiles values={[
      { name: 'Recent games', value: metric(current.games) },
      { name: 'Recent win rate', value: metric(current.winRate, '%', 1) },
      { name: 'ACS change', value: metric(comparison.acsDeltaPct, '%', 1) },
      { name: 'K/D change', value: metric(comparison.kdDelta, '', 2) },
    ]} />;
  }
  if (tab === 'insights') {
    const insights = array<RecordData>(value.insights);
    if (!insights.length) return <p className={panel}>No statistically supported insights yet.</p>;
    return <div className="grid gap-3 xl:grid-cols-2">{insights.map((item, i) =>
      <div key={String(item.id || i)} className={panel}>
        <p className="text-xs uppercase text-accent">{String(item.category || 'Insight')}</p>
        <h3 className="mt-2 font-semibold text-ink">{String(item.title || 'Insight')}</h3>
        <p className="mt-2 text-sm text-ink-muted">{String(item.body || '')}</p>
        <p className="mt-3 text-xs text-ink">{String(item.stat || '')}</p>
      </div>)}</div>;
  }
  const kind = tab === 'agents' ? 'agent' : 'map';
  const rows = array<RecordData>(value[tab]);
  if (!rows.length) return <p className={panel + ' text-sm text-ink-muted'}>No data available for this breakdown yet.</p>;
  return <div className="overflow-x-auto rounded-xl border border-line bg-panel"><table className="w-full text-left text-sm text-ink">
    <thead><tr className="border-b border-line text-xs uppercase text-ink-muted">
      {[kind, 'Games', 'Win rate', 'K/D', 'ACS', 'HS %'].map(h => <th key={h} className="p-3">{h}</th>)}
    </tr></thead><tbody>{rows.map((row, i) => <tr key={String(row[kind] || i)} className="border-b border-line/60">
      <td className="p-3">{String(row[kind] || 'Unknown')}</td>
      <td className="p-3">{metric(row.games)}</td>
      <td className="p-3">{metric(row.winRate, '%', 1)}</td>
      <td className="p-3">{metric(row.kd, '', 2)}</td>
      <td className="p-3">{metric(row.acs)}</td>
      <td className="p-3">{metric(row.headshotPercent, '%', 1)}</td>
    </tr>)}</tbody></table></div>;
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

  // Private data is never cached to disk; re-check the website while visible.
  useEffect(() => {
    if (phase !== 'signed-in') return;
    const interval = window.setInterval(() => setRevision(n => n + 1), 60_000);
    return () => window.clearInterval(interval);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'signed-in' || !account) {
      setData(null); setProfile(null); setLastSync(null); return;
    }
    let ignore = false;
    setLoading(true); setError('');
    void Promise.all([
      invoke<RecordData>('desktop_companion_data', { endpoint: tab }),
      invoke<RecordData>('desktop_companion_data', { endpoint: 'profile' }),
    ]).then(([stats, person]) => {
      if (!ignore) { setData(stats); setProfile(person); setLastSync(Date.now()); }
    }).catch((cause: unknown) => {
      if (!ignore) {
        setData(null); setProfile(null);
        const message = String(cause);
        if (message.includes('Session expired') || message.includes('Sign in to your Aventas')) {
          void refresh();
        } else {
          setError('Website data is unavailable. Recheck your connection and verify that your Riot profile is authorized.');
        }
      }
    }).finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; };
  }, [phase, account?.id, tab, revision, refresh]);

  const player = object(profile?.player), meta = object(profile?.meta);
  return <section className="flex flex-col gap-5 p-6">
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div><h2 className="text-2xl font-semibold text-ink">Aventas Live Tracker</h2>
        <p className="mt-1 text-sm text-ink-muted">Account-scoped website data; updates every 60 seconds while this page is open. No invented match statistics.</p>
        {lastSync && phase === 'signed-in' && <p className="mt-1 text-xs text-ink-muted">Checked {new Date(lastSync).toLocaleTimeString()}</p>}</div>
      {phase === 'signed-in' && <div className="flex items-center gap-2 text-sm">
        <span className="text-ink-muted">{account?.name}</span>
        <button className="rounded-lg border border-line px-3 py-2" onClick={() => setRevision(n => n + 1)}>Refresh</button>
        <button className="rounded-lg border border-line px-3 py-2" onClick={() => void logout()}>Sign out</button>
      </div>}
    </header>
    {phase === 'checking' && <p role="status" className="text-sm text-ink-muted">Checking website session…</p>}
    {phase === 'signed-out' && <Login />}
    {phase === 'signed-in' && <>
      {profile && <div className={panel}>
        <p className="font-semibold text-ink">{String(player.riotId || 'Player')}#{String(player.tagline || '—')}</p>
        <p className="mt-1 text-xs text-ink-muted">{meta.isDemo ? 'Development fixtures — not live Riot data' :
          meta.hasRiotLink ? 'Website record has a Riot identity link' : 'Riot identity is not linked'}</p>
      </div>}
      <div role="tablist" aria-label="Tracker sections" className="flex flex-wrap gap-2">
        {tabs.map(id => <button key={id} role="tab" aria-selected={tab === id} type="button"
          onClick={() => setTab(id)}
          className={'rounded-lg border px-4 py-2 text-sm capitalize ' +
            (tab === id ? 'border-accent bg-accent/10 text-ink' : 'border-line bg-panel text-ink-muted')}>
          {id === 'dashboard' ? 'Overview' : id}
        </button>)}
      </div>
      {loading && <p role="status" className="text-sm text-ink-muted">Loading website records…</p>}
      {error && <div className={panel}><p role="alert" className="text-sm text-ink">{error}</p>
        <button className="mt-3 text-sm text-accent underline" onClick={() => setRevision(n => n + 1)}>Retry</button></div>}
      {!loading && !error && data && <Data tab={tab} value={data} verified={meta.hasRiotLink === true && meta.isDemo !== true} />}
    </>}
  </section>;
}
