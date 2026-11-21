import { useState } from 'react';
import { rankIconUrl, tierColor } from '../services/rankIcons';

/** Parses "Diamond 2" / "Radiant" into a tier + division. */
export function parseRank(label: string): { tier: string; division: number } | null {
  const match = /^([A-Za-z]+)\s*(\d)?/.exec(label.trim());
  if (!match) return null;
  const tier = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
  return { tier, division: Number(match[2] ?? 1) };
}

/** Official VALORANT tier icon; falls back to the tier initial if it cannot load. */
export function RankEmblem({ label, size = 48 }: { label: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  const rank = parseRank(label);
  const url = rank ? rankIconUrl(rank) : null;
  if (!rank || !url || failed) {
    const color = rank ? tierColor(rank.tier) : '#959CAA';
    return <span aria-hidden="true" className="figure grid shrink-0 place-items-center rounded-full border text-lg font-semibold"
      style={{ width: size, height: size, color, borderColor: color + '55' }}>{rank ? rank.tier.charAt(0) : '?'}</span>;
  }
  return <img src={url} alt="" width={size} height={size} onError={() => setFailed(true)}
    className="shrink-0 object-contain" style={{ width: size, height: size }}/>;
}
