import { useMemo, useState } from 'react';
import { RankEmblem, parseRank } from './RankEmblem';
import { tierColor } from '../services/rankIcons';

/**
 * The session tape: tonight's matches as frames on a strip, read left to
 * right, with the running RR stepping underneath. It answers the question a
 * player has between queues — "how is tonight going?" — at a glance.
 */
export interface TapeMatch {
  id: string;
  map: string;
  agent?: string;
  won: number;
  lost: number;
  rr?: number;
  kills?: number;
  deaths?: number;
  assists?: number;
  acs?: number;
  playedAt: number;
}

interface SessionTapeProps {
  matches: TapeMatch[];
  rankLabel?: string;
  rr?: number;
  sample?: boolean;
}

const WIN = '#5BB98C';
const LOSS = '#D9534A';

function streakOf(matches: TapeMatch[]): { kind: 'win' | 'loss' | null; length: number } {
  const last = matches[matches.length - 1];
  if (!last) return { kind: null, length: 0 };
  const win = last.won > last.lost;
  let length = 0;
  for (let i = matches.length - 1; i >= 0; i--) {
    if ((matches[i].won > matches[i].lost) !== win) break;
    length++;
  }
  return { kind: win ? 'win' : 'loss', length };
}

export function SessionTape({ matches, rankLabel, rr, sample }: SessionTapeProps) {
  const ordered = useMemo(() => [...matches].sort((a, b) => a.playedAt - b.playedAt), [matches]);
  const [focus, setFocus] = useState<number | null>(null);
  const wins = ordered.filter(m => m.won > m.lost).length;
  const losses = ordered.length - wins;
  const net = ordered.reduce((sum, m) => sum + (m.rr ?? 0), 0);
  const hasRr = ordered.some(m => m.rr != null);
  const streak = streakOf(ordered);
  const rank = rankLabel ? parseRank(rankLabel) : null;
  const color = rank ? tierColor(rank.tier) : '#F1F1EE';

  // Running RR line: cumulative delta per frame, scaled into the strip height.
  const running = ordered.reduce<number[]>((acc, m) => [...acc, (acc[acc.length - 1] ?? 0) + (m.rr ?? 0)], []);
  const lo = Math.min(0, ...running), hi = Math.max(0, ...running);
  const span = Math.max(hi - lo, 1);
  const y = (v: number) => 44 - ((v - lo) / span) * 40;
  const focused = focus != null ? ordered[focus] : ordered[ordered.length - 1];

  return <section className="session-tape" aria-label="Tonight's session" style={{ ['--rank-color' as string]: color }}>
    <header className="flex flex-wrap items-end justify-between gap-x-10 gap-y-5">
      <div>
        <p className="tape-label"><span className="tape-dot" aria-hidden="true"/>{sample ? 'Sample session' : 'Tonight'}</p>
        <p className="tape-record mt-2">
          <span style={{ color: WIN }}>{wins}</span>
          <span className="tape-record-sep" aria-hidden="true">–</span>
          <span style={{ color: LOSS }}>{losses}</span>
          <span className="sr-only">{wins} wins, {losses} losses</span>
        </p>
      </div>
      <dl className="flex flex-wrap gap-x-10 gap-y-3">
        {hasRr && <div>
          <dt className="tape-label">Net RR</dt>
          <dd className="tape-figure" style={{ color: net >= 0 ? WIN : LOSS }}>{net > 0 ? '+' : ''}{net}</dd>
        </div>}
        {streak.length >= 2 && <div>
          <dt className="tape-label">On a</dt>
          <dd className="tape-figure">{streak.length}-game {streak.kind === 'win' ? 'win' : 'loss'} streak</dd>
        </div>}
        {rankLabel && <div className="flex items-center gap-3">
          <RankEmblem label={rankLabel} size={52}/>
          <div>
            <dt className="tape-label">Rank</dt>
            <dd className="tape-figure" style={{ color }}>{rankLabel}{rr != null && <span className="ml-2 text-ink-muted">{rr} RR</span>}</dd>
          </div>
        </div>}
      </dl>
    </header>

    {ordered.length === 0 ? (
      <p className="mt-8 text-sm text-ink-muted">No matches yet tonight. Queue up and each game lands here as a frame.</p>
    ) : <>
      <ol className="tape-strip mt-7" role="list">
        {ordered.map((m, i) => {
          const win = m.won > m.lost;
          return <li key={m.id}>
            <button type="button" className="tape-frame" data-result={win ? 'win' : 'loss'} aria-pressed={focus === i}
              onMouseEnter={() => setFocus(i)} onFocus={() => setFocus(i)} onClick={() => setFocus(i)}
              aria-label={`${win ? 'Win' : 'Loss'} on ${m.map}, ${m.won} to ${m.lost}${m.rr != null ? `, ${m.rr > 0 ? '+' : ''}${m.rr} RR` : ''}`}>
              <span className="tape-frame-map">{m.map}</span>
              <span className="tape-frame-score">{m.won}–{m.lost}</span>
              {m.rr != null && <span className="tape-frame-rr">{m.rr > 0 ? '+' : ''}{m.rr}</span>}
            </button>
          </li>;
        })}
      </ol>
      {hasRr && ordered.length > 1 && <svg className="tape-line" viewBox={`0 0 ${ordered.length * 100} 48`} preserveAspectRatio="none" aria-hidden="true">
        <line x1="0" x2={ordered.length * 100} y1={y(0)} y2={y(0)} className="tape-zero"/>
        <path d={running.map((v, i) => `${i === 0 ? 'M' : 'L'}${i * 100} ${y(i === 0 ? 0 : running[i - 1])} L${i * 100 + 100} ${y(v)}`).join(' ')}
          fill="none" stroke="var(--rank-color)" strokeWidth="2.5" vectorEffect="non-scaling-stroke"/>
      </svg>}
      {focused && <p className="mt-4 text-sm text-ink-muted" aria-live="polite">
        <span className="text-ink">{focused.map}</span>
        {focused.agent && <> as <span className="text-ink">{focused.agent}</span></>}
        {focused.kills != null && <>, {focused.kills}/{focused.deaths}/{focused.assists}</>}
        {focused.acs != null && <>, {focused.acs} ACS</>}
      </p>}
    </>}
  </section>;
}
