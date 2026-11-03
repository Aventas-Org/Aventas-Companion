export interface Tournament {
  id?: string;
  slug: string;
  name: string;
  game?: string;
  status: 'upcoming' | 'live' | 'completed';
  startsAt?: number;
  region?: string;
  teamCount?: number;
  registeredTeams?: number;
  prizePool?: string;
  champion?: string;
  registrationOpen?: boolean;
}
export interface Match {
  id: string;
  round: number;
  slot: number;
  teamA: string;
  teamB: string;
  scoreA: number;
  scoreB: number;
  status: 'scheduled' | 'live' | 'completed';
  scheduledAt?: number;
  bestOf?: number;
}
export interface Bracket {
  tournament: Tournament;
  matches: Match[];
  teams: Array<{ id: string; name: string }>;
}
export function validTournament(value: unknown): value is Tournament;
export function validMatch(value: unknown): value is Match;
export function validBracket(value: unknown, expectedSlug: string): value is Bracket;
