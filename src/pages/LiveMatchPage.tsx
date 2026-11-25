import { useMemo, useState } from 'react';
import { WorkspaceTabs } from '../components/WorkspaceUI';

/**
 * Live match roster, Practice lab edition.
 *
 * Every value below is a fixed sample. The real screen needs per-player
 * match data that Companion can only read once Riot approves access, so this
 * page never touches the game, the website API or any other player's account.
 */

type Team = 'ally' | 'enemy';
type Tier = 'Iron' | 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond' | 'Ascendant' | 'Immortal' | 'Radiant';

interface SamplePlayer {
  name: string; tag: string; agent: string; team: Team; you?: boolean;
  /** Null when the player keeps their profile private. */
  stats: null | {
    tier: Tier; division?: 1 | 2 | 3; rr: number;
    kd: number; damagePerRound: number; winRate: number;
    agentKd: number; agentWinRate: number; agentGames: number;
  };
}

const PLAYERS: SamplePlayer[] = [
  { name: 'Nightjar', tag: 'EU1', agent: 'Jett', team: 'ally', stats: { tier: 'Immortal', division: 2, rr: 61, kd: 1.24, damagePerRound: 151, winRate: 54.2, agentKd: 1.31, agentWinRate: 56.0, agentGames: 212 } },
  { name: 'You', tag: 'AVN', agent: 'Omen', team: 'ally', you: true, stats: { tier: 'Immortal', division: 1, rr: 34, kd: 1.08, damagePerRound: 132, winRate: 51.6, agentKd: 1.12, agentWinRate: 53.4, agentGames: 147 } },
  { name: 'kestrel', tag: '4410', agent: 'Sova', team: 'ally', stats: { tier: 'Ascendant', division: 3, rr: 88, kd: 0.97, damagePerRound: 121, winRate: 49.8, agentKd: 1.02, agentWinRate: 52.1, agentGames: 96 } },
  { name: 'Halfmoon', tag: 'GG', agent: 'Killjoy', team: 'ally', stats: { tier: 'Immortal', division: 1, rr: 12, kd: 1.15, damagePerRound: 138, winRate: 55.9, agentKd: 1.21, agentWinRate: 58.3, agentGames: 180 } },
  { name: 'tidepool', tag: 'mint', agent: 'Skye', team: 'ally', stats: null },
  { name: 'Vantor', tag: 'NA2', agent: 'Raze', team: 'enemy', stats: { tier: 'Immortal', division: 3, rr: 74, kd: 1.33, damagePerRound: 162, winRate: 57.1, agentKd: 1.41, agentWinRate: 59.2, agentGames: 301 } },
  { name: 'pale ember', tag: '777', agent: 'Viper', team: 'enemy', stats: { tier: 'Immortal', division: 1, rr: 40, kd: 1.04, damagePerRound: 129, winRate: 50.4, agentKd: 0.98, agentWinRate: 47.7, agentGames: 58 } },
  { name: 'Rook', tag: 'one', agent: 'Breach', team: 'enemy', stats: { tier: 'Ascendant', division: 2, rr: 23, kd: 0.88, damagePerRound: 114, winRate: 46.3, agentKd: 0.91, agentWinRate: 48.5, agentGames: 133 } },
  { name: 'Sable', tag: 'SBL', agent: 'Cypher', team: 'enemy', stats: { tier: 'Diamond', division: 3, rr: 95, kd: 1.01, damagePerRound: 125, winRate: 52.8, agentKd: 1.06, agentWinRate: 54.9, agentGames: 244 } },
  { name: 'lowlight', tag: 'zz', agent: 'Neon', team: 'enemy', stats: { tier: 'Immortal', division: 2, rr: 50, kd: 1.19, damagePerRound: 147, winRate: 53.0, agentKd: 1.27, agentWinRate: 55.5, agentGames: 89 } },
];

/** One hue per rank family; ranks are drawn as our own badge, not Riot artwork. */
const TIER_COLOR: Record<Tier, string> = {
  Iron: '#7d8288', Bronze: '#b4805a', Silver: '#c6ccd2', Gold: '#e6ae48', Platinum: '#4fb3c4',
  Diamond: '#b48cf0', Ascendant: '#43c27f', Immortal: '#e0566a', Radiant: '#f4e3a1',
};

function RankBadge({ tier }: { tier: Tier }) {
  const color = TIER_COLOR[tier];
  return <svg width="22" height="24" viewBox="0 0 22 24" aria-hidden="true" className="shrink-0">
    <path d="M11 1 21 7v10l-10 6L1 17V7z" fill={color} fillOpacity=".16" stroke={color} strokeWidth="1.5"/>
    <path d="M11 7 16 10v4l-5 3-5-3v-4z" fill={color}/>
  </svg>;
}

function tone(value: number, good: number, bad: number) {
  return value >= good ? 'text-emerald-400' : value <= bad ? 'text-[#f06d80]' : 'text-ink';
}

type View = 'roster' | 'teams';
const VIEWS = [{ id: 'roster' as const, name: 'Roster' }, { id: 'teams' as const, name: 'Team comparison' }];

function average(players: SamplePlayer[], pick: (s: NonNullable<SamplePlayer['stats']>) => number) {
  const known = players.flatMap(p => p.stats ? [pick(p.stats)] : []);
  return known.length ? known.reduce((a, b) => a + b, 0) / known.length : 0;
}

export function LiveMatchPage() {
  const [view, setView] = useState<View>('roster');
  const teams = useMemo(() => (['ally', 'enemy'] as Team[]).map(team => {
    const players = PLAYERS.filter(p => p.team === team);
    return {
      team, players,
      kd: average(players, s => s.kd), dpr: average(players, s => s.damagePerRound),
      win: average(players, s => s.winRate), agentWin: average(players, s => s.agentWinRate),
      hidden: players.filter(p => !p.stats).length,
    };
  }), []);

  return <div className="page-stage space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="page-heading">Live match</h1>
        <p className="page-description mt-1">Competitive on Lotus, round 1. Your team is in green, the enemy team in red.</p>
      </div>
      <WorkspaceTabs label="Live match view" items={VIEWS} value={view} onChange={setView}/>
    </div>

    {view === 'roster' ? <section className="a-panel overflow-hidden" aria-label="Match roster">
      <div className="overflow-x-auto">
        <table className="roster-table live-roster">
          <thead><tr>
            <th scope="col">Player</th><th scope="col">Rank</th>
            <th scope="col" className="num">K/D</th><th scope="col" className="num">Damage / round</th>
            <th scope="col" className="num">Win rate</th>
            <th scope="col" className="num agent-col">Agent K/D</th><th scope="col" className="num agent-col">Agent win rate</th>
          </tr></thead>
          {teams.map(({ team, players }) => <tbody key={team} data-team={team}>
            {players.map(player => <tr key={player.name} data-team={team} data-you={player.you || undefined}>
              <td>
                <div className="flex items-center gap-3">
                  <span className="agent-chip" title={player.agent}>{player.agent.slice(0, 2)}</span>
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-ink">{player.name}<span className="ml-1 font-normal text-ink-muted">#{player.tag}</span></span>
                    <span className="block text-[11px] text-ink-muted">{player.agent}{player.you ? ', you' : ''}</span>
                  </span>
                </div>
              </td>
              {player.stats ? <>
                <td>
                  <div className="flex items-center gap-2.5">
                    <RankBadge tier={player.stats.tier}/>
                    <span className="leading-tight">
                      <span className="block text-[12px] text-ink">{player.stats.tier}{player.stats.division ? ' ' + player.stats.division : ''}</span>
                      <span className="block font-display text-[13px] font-semibold text-ink">{player.stats.rr} <span className="text-[10px] font-normal text-ink-muted">RR</span></span>
                    </span>
                  </div>
                </td>
                <td className="num "><span className={tone(player.stats.kd, 1.15, 0.9)}>{player.stats.kd.toFixed(2)}</span></td>
                <td className="num"><span className="text-ink">{player.stats.damagePerRound}</span></td>
                <td className="num "><span className={tone(player.stats.winRate, 55, 47)}>{player.stats.winRate.toFixed(1)}%</span></td>
                <td className="num agent-col"><span className={tone(player.stats.agentKd, 1.15, 0.9)}>{player.stats.agentKd.toFixed(2)}</span></td>
                <td className="num agent-col">
                  <span className={tone(player.stats.agentWinRate, 55, 47)}>{player.stats.agentWinRate.toFixed(1)}%</span>
                  <span className="block text-[10px] font-normal text-ink-muted">{player.stats.agentGames} games</span>
                </td>
              </> : <td colSpan={6} className="private-cell">Profile set to private</td>}
            </tr>)}
          </tbody>)}
        </table>
      </div>
    </section> : <section className="grid gap-4 md:grid-cols-2" aria-label="Team comparison">
      {teams.map(t => <div key={t.team} className="a-panel overflow-hidden" data-team-card={t.team}>
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 className="section-title">{t.team === 'ally' ? 'Your team' : 'Enemy team'}</h2>
          {t.hidden > 0 && <span className="text-[11px] text-ink-muted">{t.hidden} private, left out of averages</span>}
        </div>
        <dl className="grid grid-cols-2">
          {[
            ['Average K/D', t.kd.toFixed(2)], ['Damage / round', t.dpr.toFixed(0)],
            ['Win rate', t.win.toFixed(1) + '%'], ['Win rate on agent', t.agentWin.toFixed(1) + '%'],
          ].map(([label, value]) => <div key={label} className="border-b border-r border-line/70 px-4 py-4 [&:nth-child(2n)]:border-r-0">
            <dt className="text-[11px] text-ink-muted">{label}</dt>
            <dd className="a-number mt-1 text-[30px] leading-none text-ink">{value}</dd>
          </div>)}
        </dl>
      </div>)}
    </section>}

    <p className="text-[11px] leading-5 text-ink-muted">
      Players and numbers on this page are made up. When Riot approves access, this view fills in from your real match as soon as agent select ends. Players who keep their profile private stay hidden.
    </p>
  </div>;
}
