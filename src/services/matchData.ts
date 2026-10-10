import type { Match, MatchFilter } from '../types/match';

/**
 * Sample/demo match data used to demonstrate the Match History layout.
 *
 * IMPORTANT: This is explicitly demo data only. It is NOT the user's real match
 * history. A real data source (e.g. Riot API integration) must be wired in
 * later to replace this.
 */
const DEMO_MATCHES: Match[] = [
  {
    id: 'demo-1',
    result: 'victory',
    score: '13 - 9',
    map: 'Ascent',
    date: '2026-10-09T20:15:00Z',
    kills: 24,
    deaths: 14,
    assists: 6,
    acs: 248,
    agent: 'Jett',
    mode: 'Competitive',
    durationMinutes: 38,
  },
  {
    id: 'demo-2',
    result: 'defeat',
    score: '9 - 13',
    map: 'Icebox',
    date: '2026-10-08T19:30:00Z',
    kills: 11,
    deaths: 18,
    assists: 9,
    acs: 156,
    agent: 'Killjoy',
    mode: 'Competitive',
    durationMinutes: 32,
  },
  {
    id: 'demo-3',
    result: 'victory',
    score: '13 - 11',
    map: 'Lotus',
    date: '2026-10-07T21:00:00Z',
    kills: 19,
    deaths: 16,
    assists: 12,
    acs: 210,
    agent: 'Omen',
    mode: 'Unrated',
    durationMinutes: 41,
  },
  {
    id: 'demo-4',
    result: 'victory',
    score: '13 - 6',
    map: 'Bind',
    date: '2026-10-05T18:45:00Z',
    kills: 27,
    deaths: 9,
    assists: 4,
    acs: 298,
    agent: 'Raze',
    mode: 'Competitive',
    durationMinutes: 28,
  },
  {
    id: 'demo-5',
    result: 'defeat',
    score: '8 - 13',
    map: 'Pearl',
    date: '2026-10-04T22:20:00Z',
    kills: 13,
    deaths: 20,
    assists: 7,
    acs: 142,
    agent: 'Sage',
    mode: 'Competitive',
    durationMinutes: 35,
  },
  {
    id: 'demo-6',
    result: 'defeat',
    score: '11 - 13',
    map: 'Fracture',
    date: '2026-10-02T20:00:00Z',
    kills: 15,
    deaths: 17,
    assists: 10,
    acs: 178,
    agent: 'Skye',
    mode: 'Unrated',
    durationMinutes: 40,
  },
  {
    id: 'demo-7',
    result: 'victory',
    score: '13 - 10',
    map: 'Ascent',
    date: '2026-09-30T19:15:00Z',
    kills: 22,
    deaths: 13,
    assists: 8,
    acs: 264,
    agent: 'Reyna',
    mode: 'Competitive',
    durationMinutes: 36,
  },
  {
    id: 'demo-8',
    result: 'victory',
    score: '13 - 8',
    map: 'Icebox',
    date: '2026-09-28T21:30:00Z',
    kills: 20,
    deaths: 11,
    assists: 5,
    acs: 251,
    agent: 'Jett',
    mode: 'Unrated',
    durationMinutes: 33,
  },
  {
    id: 'demo-9',
    result: 'defeat',
    score: '10 - 13',
    map: 'Lotus',
    date: '2026-09-26T18:00:00Z',
    kills: 9,
    deaths: 19,
    assists: 11,
    acs: 134,
    agent: 'Omen',
    mode: 'Competitive',
    durationMinutes: 37,
  },
  {
    id: 'demo-10',
    result: 'victory',
    score: '13 - 12',
    map: 'Bind',
    date: '2026-09-24T20:45:00Z',
    kills: 25,
    deaths: 17,
    assists: 9,
    acs: 272,
    agent: 'Raze',
    mode: 'Competitive',
    durationMinutes: 44,
  },
];

/**
 * Returns demo match data filtered by the given filter option.
 * - 'all': returns all matches
 * - 'wins': returns only victories
 * - 'losses': returns only defeats
 *
 * @param filter The filter to apply.
 * @returns A new array of filtered matches.
 */
export function getDemoMatches(filter: MatchFilter = 'all'): Match[] {
  switch (filter) {
    case 'wins':
      return DEMO_MATCHES.filter((m) => m.result === 'victory');
    case 'losses':
      return DEMO_MATCHES.filter((m) => m.result === 'defeat');
    default:
      return DEMO_MATCHES.slice();
  }
}

/**
 * Returns a single demo match by its id, or undefined if not found.
 *
 * @param id The match id.
 * @returns The match or undefined.
 */
export function getDemoMatchById(id: string): Match | undefined {
  return DEMO_MATCHES.find((m) => m.id === id);
}
