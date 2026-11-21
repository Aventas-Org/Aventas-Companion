import { useEffect, useState } from 'react';
import type { TapeMatch } from './SessionTape';
import { markBestsSeen, personalBests, recapOf, unseenBests, type PersonalBest } from '../services/sessionRecap';

/** Quiet period after the last game before "tonight so far" becomes a recap. */
const SESSION_GAP_MS = 45 * 60_000;

export function SessionRecap({ tonight, earlier, sample, now = Date.now() }: {
  tonight: TapeMatch[]; earlier: TapeMatch[]; sample?: boolean; now?: number;
}) {
  if (tonight.length === 0) return null;
  const recap = recapOf(tonight);
  const bests = personalBests(tonight, earlier);
  const last = Math.max(...tonight.map(m => m.playedAt));
  const ended = sample || now - last > SESSION_GAP_MS;

  return <section className="recap" aria-label={ended ? 'Session recap' : 'Tonight so far'}>
    <div className="flex flex-wrap items-baseline justify-between gap-2">
      <h2 className="text-[18px] font-semibold text-ink">{ended ? 'Session recap' : 'Tonight so far'}</h2>
      <p className="text-[13px] text-ink-muted">{recap.games} {recap.games === 1 ? 'game' : 'games'}{recap.mostPlayed ? `, mostly ${recap.mostPlayed}` : ''}</p>
    </div>
    <dl className="recap-grid mt-5">
      {recap.best && <div className="recap-best">
        <dt>Best game</dt>
        <dd className="figure text-[34px] font-semibold leading-none text-ink">{recap.best.acs} ACS</dd>
        <dd className="mt-1 text-[13px] text-ink-muted">
          {recap.best.map}{recap.best.agent ? ` as ${recap.best.agent}` : ''}
          {recap.best.kills != null ? `, ${recap.best.kills}/${recap.best.deaths}/${recap.best.assists}` : ''}
        </dd>
      </div>}
      {recap.avgAcs != null && <div><dt>Average ACS</dt><dd className="figure recap-figure">{recap.avgAcs}</dd></div>}
      {recap.kd != null && <div><dt>K/D</dt><dd className="figure recap-figure">{recap.kd.toFixed(2)}</dd></div>}
    </dl>
    {bests.length > 0 && <ul className="mt-6 space-y-2" aria-label="Personal bests">
      {bests.map(b => <li key={b.key} className="recap-pb">
        <span className="recap-pb-mark" aria-hidden="true">PB</span>
        <span>
          <span className="text-ink">New personal best: {b.value} {b.label}</span>
          <span className="text-ink-muted"> on {b.match.map}{b.previous ? `, beating ${b.previous}` : ''}</span>
        </span>
      </li>)}
    </ul>}
  </section>;
}

/**
 * Announces each new personal best once, as a toast. Seen bests are stored
 * locally; sample data never toasts so guests aren't told about fake records.
 */
export function PersonalBestToast({ tonight, earlier, sample }: { tonight: TapeMatch[]; earlier: TapeMatch[]; sample?: boolean }) {
  const [queue, setQueue] = useState<PersonalBest[]>([]);
  useEffect(() => {
    if (sample) return;
    const fresh = unseenBests(personalBests(tonight, earlier));
    if (fresh.length) { setQueue(fresh); markBestsSeen(fresh); }
  }, [tonight, earlier, sample]);
  useEffect(() => {
    if (!queue.length) return;
    const timer = window.setTimeout(() => setQueue(q => q.slice(1)), 9000);
    return () => window.clearTimeout(timer);
  }, [queue]);
  const current = queue[0];
  if (!current) return null;
  return <div className="pb-toast" role="status" aria-live="polite">
    <span className="recap-pb-mark" aria-hidden="true">PB</span>
    <div className="min-w-0">
      <p className="font-semibold text-ink">New personal best</p>
      <p className="text-[13px] text-ink-muted">{current.value} {current.label} on {current.match.map}{current.previous ? `, beating ${current.previous}` : ''}</p>
    </div>
    <button type="button" className="ml-2 text-ink-muted hover:text-ink" aria-label="Dismiss" onClick={() => setQueue(q => q.slice(1))}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>
    </button>
  </div>;
}
