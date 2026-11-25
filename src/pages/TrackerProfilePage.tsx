import { useMemo, useState } from 'react';
import type { Match, MatchFilter } from '../types/match';
import { getDemoMatches } from '../services/matchData';
import { computeMatchStats } from '../services/matchStats';
import { WorkspaceTabs } from '../components/WorkspaceUI';

/**
 * Tracker profile, Practice lab edition.
 *
 * Laid out like a full stat tracker: profile header, season stat bar, combat
 * score trend, agent and map breakdowns, then match history grouped by day.
 * All numbers come from the demo match fixtures in `services/matchData.ts`.
 */

const FILTERS = [
  { id: 'all' as const, name: 'All matches' },
  { id: 'wins' as const, name: 'Wins' },
  { id: 'losses' as const, name: 'Losses' },
];

const kd = (k: number, d: number) => (d > 0 ? k / d : k);
const pct = (n: number) => n.toFixed(1) + '%';

interface Group { name: string; games: number; wins: number; kills: number; deaths: number; acs: number }

function groupBy(matches: Match[], key: (m: Match) => string | undefined): Group[] {
  const map = new Map<string, Group>();
  for (const m of matches) {
    const name = key(m) || 'Unknown';
    const g = map.get(name) ?? { name, games: 0, wins: 0, kills: 0, deaths: 0, acs: 0 };
    g.games += 1; g.wins += m.result === 'victory' ? 1 : 0;
    g.kills += m.kills; g.deaths += m.deaths; g.acs += m.acs ?? 0;
    map.set(name, g);
  }
  return [...map.values()].sort((a, b) => b.games - a.games || b.wins - a.wins);
}

function dayLabel(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' });
}

/** Combat score per match, oldest to newest, with the average as a reference line. */
function AcsTrend({ matches }: { matches: Match[] }) {
  const points = [...matches].reverse().filter(m => typeof m.acs === 'number');
  if (points.length < 2) return <p className="px-4 py-10 text-center text-[12px] text-ink-muted">Play two or more matches to see a trend.</p>;
  const W = 640, H = 170, P = { l: 34, r: 12, t: 14, b: 22 };
  const values = points.map(m => m.acs!);
  const lo = Math.floor((Math.min(...values) - 20) / 50) * 50;
  const hi = Math.ceil((Math.max(...values) + 20) / 50) * 50;
  const x = (i: number) => P.l + (i * (W - P.l - P.r)) / (points.length - 1);
  const y = (v: number) => P.t + (1 - (v - lo) / (hi - lo)) * (H - P.t - P.b);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const path = points.map((m, i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(m.acs!).toFixed(1)).join(' ');
  const area = path + ` L${x(points.length - 1)} ${H - P.b} L${x(0)} ${H - P.b} Z`;
  const ticks = [lo, (lo + hi) / 2, hi];
  return <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img"
    aria-label={`Combat score over the last ${points.length} matches, averaging ${avg.toFixed(0)}`}>
    <defs>
      <linearGradient id="acs-fill" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor="rgb(var(--color-accent))" stopOpacity=".22"/>
        <stop offset="1" stopColor="rgb(var(--color-accent))" stopOpacity="0"/>
      </linearGradient>
    </defs>
    {ticks.map(t => <g key={t}>
      <line x1={P.l} x2={W - P.r} y1={y(t)} y2={y(t)} stroke="rgb(var(--color-line))" strokeWidth="1"/>
      <text x={P.l - 8} y={y(t) + 4} textAnchor="end" fontSize="10" fill="rgb(var(--color-ink-muted))">{t}</text>
    </g>)}
    <line x1={P.l} x2={W - P.r} y1={y(avg)} y2={y(avg)} stroke="rgb(var(--color-ink-muted))" strokeDasharray="3 4" strokeWidth="1"/>
    <path d={area} fill="url(#acs-fill)"/>
    <path d={path} fill="none" stroke="rgb(var(--color-accent))" strokeWidth="2" strokeLinejoin="round"/>
    {points.map((m, i) => <circle key={m.id} cx={x(i)} cy={y(m.acs!)} r="4"
      fill={m.result === 'victory' ? '#3fbf8a' : '#e0566a'} stroke="rgb(var(--color-panel))" strokeWidth="2">
      <title>{`${m.map}, ${m.agent ?? ''}: ${m.acs} ACS, ${m.result === 'victory' ? 'win' : 'loss'}`}</title>
    </circle>)}
  </svg>;
}

function WinBar({ wins, games }: { wins: number; games: number }) {
  const rate = games ? (wins / games) * 100 : 0;
  return <div className="flex items-center gap-2.5">
    <span className="tracker-bar"><span style={{ width: rate + '%' }} data-good={rate >= 50}/></span>
    <span className="w-12 text-right font-display text-[13px] font-semibold tabular-nums text-ink">{rate.toFixed(0)}%</span>
  </div>;
}

export function TrackerProfilePage() {
  const [filter, setFilter] = useState<MatchFilter>('all');
  const all = useMemo(() => getDemoMatches('all'), []);
  const shown = useMemo(() => getDemoMatches(filter), [filter]);
  const stats = computeMatchStats(all);
  const agents = groupBy(all, m => m.agent);
  const maps = groupBy(all, m => m.map);
  const avgKda = all.length ? (stats.totalKills + stats.totalAssists) / Math.max(stats.totalDeaths, 1) : 0;
  const recentForm = all.slice(0, 5);

  const days = useMemo(() => {
    const out: { day: string; matches: Match[] }[] = [];
    for (const m of shown) {
      const day = dayLabel(m.date);
      const last = out[out.length - 1];
      if (last?.day === day) last.matches.push(m); else out.push({ day, matches: [m] });
    }
    return out;
  }, [shown]);

  const kpis = [
    { label: 'Win rate', value: stats.winRate != null ? pct(stats.winRate) : '—', sub: `${stats.wins}W ${stats.losses}L` },
    { label: 'K/D', value: stats.overallKd?.toFixed(2) ?? '—', sub: `${stats.totalKills} kills` },
    { label: 'Combat score', value: stats.averageAcs?.toFixed(0) ?? '—', sub: 'Average per match' },
    { label: 'KDA', value: avgKda.toFixed(2), sub: `${stats.totalAssists} assists` },
    { label: 'Matches', value: String(stats.totalMatches), sub: 'Competitive and unrated' },
  ];

  return <div className="tracker-page">
    <header className="tracker-hero">
      <div className="page-stage !pb-0 !pt-6">
        <div className="flex flex-wrap items-center gap-5">
          <span className="tracker-avatar">AV</span>
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-[28px] font-bold leading-tight tracking-tight text-ink">Aventas Player<span className="ml-1.5 text-[18px] font-medium text-ink-muted">#AVN</span></h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-5 gap-y-1 text-[12px] text-ink-muted">
              <span>Level 214</span>
              <span>Europe</span>
              <span className="flex items-center gap-1.5">Last 5
                {recentForm.map(m => <span key={m.id} className="form-pip" data-result={m.result} title={`${m.map}: ${m.result === 'victory' ? 'win' : 'loss'}`}/>)}
              </span>
            </div>
          </div>
          <div className="tracker-rank">
            <svg width="44" height="48" viewBox="0 0 22 24" aria-hidden="true">
              <path d="M11 1 21 7v10l-10 6L1 17V7z" fill="#e0566a" fillOpacity=".16" stroke="#e0566a" strokeWidth="1.3"/>
              <path d="M11 7 16 10v4l-5 3-5-3v-4z" fill="#e0566a"/>
            </svg>
            <div>
              <p className="text-[11px] text-ink-muted">Current rank</p>
              <p className="font-display text-[19px] font-bold leading-tight text-ink">Immortal 1</p>
              <p className="text-[12px] text-ink-muted"><span className="font-semibold text-ink">34</span> RR, peak Immortal 2</p>
            </div>
          </div>
        </div>
        <dl className="tracker-kpis mt-6">
          {kpis.map(k => <div key={k.label}>
            <dt>{k.label}</dt>
            <dd className="a-number">{k.value}</dd>
            <p>{k.sub}</p>
          </div>)}
        </dl>
      </div>
    </header>

    <div className="page-stage grid gap-5 !pt-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="min-w-0 space-y-5">
        <section className="a-panel overflow-hidden" aria-label="Combat score trend">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 className="section-title">Combat score, last {all.length} matches</h2>
            <span className="flex items-center gap-3 text-[11px] text-ink-muted">
              <span className="flex items-center gap-1.5"><span className="form-pip" data-result="victory"/>Win</span>
              <span className="flex items-center gap-1.5"><span className="form-pip" data-result="defeat"/>Loss</span>
              <span>Dashed line: average {stats.averageAcs?.toFixed(0)}</span>
            </span>
          </div>
          <div className="px-3 pb-2 pt-3"><AcsTrend matches={all}/></div>
        </section>

        <section aria-label="Match history" className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="section-title">Match history</h2>
            <WorkspaceTabs label="Filter matches" items={FILTERS} value={filter} onChange={setFilter}/>
          </div>
          {days.length === 0 && <p className="a-empty">No matches for this filter.</p>}
          {days.map(({ day, matches }) => {
            const wins = matches.filter(m => m.result === 'victory').length;
            return <div key={day} className="a-panel overflow-hidden">
              <div className="flex items-center justify-between bg-app/40 px-4 py-2 text-[12px]">
                <span className="font-semibold text-ink">{day}</span>
                <span className="text-ink-muted">{wins}W {matches.length - wins}L</span>
              </div>
              {matches.map(m => <div key={m.id} className="match-row" data-result={m.result}>
                <span className="agent-chip" title={m.agent}>{(m.agent ?? '?').slice(0, 2)}</span>
                <div className="min-w-0 w-32">
                  <p className="truncate font-semibold text-ink">{m.map}</p>
                  <p className="truncate text-[11px] text-ink-muted">{m.mode ?? 'Match'}{m.durationMinutes ? `, ${m.durationMinutes} min` : ''}</p>
                </div>
                <p className="match-score">{m.score.replace(' - ', ' : ')}</p>
                <div className="match-cell"><span>K / D / A</span><b>{m.kills} / {m.deaths} / {m.assists}</b></div>
                <div className="match-cell"><span>K/D</span><b className={kd(m.kills, m.deaths) >= 1 ? 'text-emerald-400' : 'text-[#f06d80]'}>{kd(m.kills, m.deaths).toFixed(2)}</b></div>
                <div className="match-cell hidden md:flex"><span>ACS</span><b>{m.acs ?? '—'}</b></div>
                <div className="match-cell hidden lg:flex"><span>Agent</span><b className="!font-medium">{m.agent ?? '—'}</b></div>
              </div>)}
            </div>;
          })}
        </section>
      </div>

      <aside className="space-y-5" aria-label="Breakdowns">
        <section className="a-panel overflow-hidden">
          <h2 className="section-title border-b border-line px-4 py-3">Top agents</h2>
          <table className="side-table">
            <thead><tr><th>Agent</th><th className="num">Games</th><th className="num">K/D</th><th>Win rate</th></tr></thead>
            <tbody>{agents.slice(0, 6).map(a => <tr key={a.name}>
              <td><span className="flex items-center gap-2"><span className="agent-chip !size-7 !text-[11px]">{a.name.slice(0, 2)}</span><span className="font-medium text-ink">{a.name}</span></span></td>
              <td className="num">{a.games}</td>
              <td className="num text-ink">{kd(a.kills, a.deaths).toFixed(2)}</td>
              <td><WinBar wins={a.wins} games={a.games}/></td>
            </tr>)}</tbody>
          </table>
        </section>
        <section className="a-panel overflow-hidden">
          <h2 className="section-title border-b border-line px-4 py-3">Maps</h2>
          <ul className="divide-y divide-line/60">
            {maps.map(mp => <li key={mp.name} className="px-4 py-2.5">
              <div className="mb-1.5 flex items-baseline justify-between text-[12px]">
                <span className="font-medium text-ink">{mp.name}</span>
                <span className="text-ink-muted">{mp.wins}W {mp.games - mp.wins}L, {mp.games ? (mp.acs / mp.games).toFixed(0) : '—'} ACS</span>
              </div>
              <WinBar wins={mp.wins} games={mp.games}/>
            </li>)}
          </ul>
        </section>
      </aside>
    </div>
  </div>;
}
