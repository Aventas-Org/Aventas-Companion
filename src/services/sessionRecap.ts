import type { TapeMatch } from '../components/SessionTape';

/** A personal best set tonight, compared against everything played before it. */
export interface PersonalBest {
  key: string;
  metric: 'acs' | 'kills' | 'kd';
  label: string;
  value: string;
  previous: string | null;
  match: TapeMatch;
}

const kd = (m: TapeMatch) => (m.kills != null && m.deaths != null ? m.kills / Math.max(m.deaths, 1) : undefined);

const METRICS: { metric: PersonalBest['metric']; label: string; get: (m: TapeMatch) => number | undefined; fmt: (n: number) => string }[] = [
  { metric: 'acs', label: 'ACS', get: m => m.acs, fmt: n => String(Math.round(n)) },
  { metric: 'kills', label: 'kills', get: m => m.kills, fmt: n => String(n) },
  { metric: 'kd', label: 'K/D', get: kd, fmt: n => n.toFixed(2) },
];

/**
 * Bests from tonight that beat every earlier match. Needs at least five
 * earlier matches with the figure, so a new account doesn't get a "best"
 * every game.
 */
export function personalBests(tonight: TapeMatch[], earlier: TapeMatch[]): PersonalBest[] {
  const bests: PersonalBest[] = [];
  for (const { metric, label, get, fmt } of METRICS) {
    const past = earlier.map(get).filter((n): n is number => typeof n === 'number');
    if (past.length < 5) continue;
    const record = Math.max(...past);
    let top: TapeMatch | null = null;
    for (const m of tonight) {
      const v = get(m);
      if (v != null && v > record && (top == null || v > (get(top) ?? -Infinity))) top = m;
    }
    if (top) bests.push({ key: `${metric}:${top.id}`, metric, label, value: fmt(get(top)!), previous: fmt(record), match: top });
  }
  return bests;
}

export interface Recap {
  games: number;
  avgAcs: number | null;
  kd: number | null;
  best: TapeMatch | null;
  mostPlayed: string | null;
}

export function recapOf(tonight: TapeMatch[]): Recap {
  const withAcs = tonight.filter(m => m.acs != null);
  const kills = tonight.reduce((s, m) => s + (m.kills ?? 0), 0);
  const deaths = tonight.reduce((s, m) => s + (m.deaths ?? 0), 0);
  const counts = new Map<string, number>();
  tonight.forEach(m => m.agent && counts.set(m.agent, (counts.get(m.agent) ?? 0) + 1));
  const mostPlayed = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  return {
    games: tonight.length,
    avgAcs: withAcs.length ? Math.round(withAcs.reduce((s, m) => s + (m.acs ?? 0), 0) / withAcs.length) : null,
    kd: deaths > 0 ? kills / deaths : null,
    best: withAcs.length ? withAcs.reduce((a, b) => ((b.acs ?? 0) > (a.acs ?? 0) ? b : a)) : null,
    mostPlayed,
  };
}

const SEEN_KEY = 'aventas.companion.pb-seen';

/** Bests already announced, so each one toasts exactly once. */
export function unseenBests(bests: PersonalBest[]): PersonalBest[] {
  try {
    const seen = new Set<string>(JSON.parse(localStorage.getItem(SEEN_KEY) ?? '[]'));
    return bests.filter(b => !seen.has(b.key));
  } catch { return bests; }
}

export function markBestsSeen(bests: PersonalBest[]): void {
  try {
    const seen = new Set<string>(JSON.parse(localStorage.getItem(SEEN_KEY) ?? '[]'));
    bests.forEach(b => seen.add(b.key));
    localStorage.setItem(SEEN_KEY, JSON.stringify([...seen].slice(-200)));
  } catch { /* storage unavailable: the toast simply shows again next time */ }
}
