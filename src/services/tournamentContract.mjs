/**
 * Pure public-tournament API contract: both desktop UI and Node tests import
 * this file. Nothing here writes scores or invents matches.
 */
const SLUG = /^[a-z0-9][a-z0-9-]{1,59}$/;
const STATUS = new Set(['upcoming', 'live', 'completed']);
const MATCH_STATUS = new Set(['scheduled', 'live', 'completed']);

const record = value => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const positiveInteger = n => Number.isInteger(n) && n >= 0;

export function validTournament(value) {
  return record(value) && typeof value.slug === 'string' && SLUG.test(value.slug) &&
    typeof value.name === 'string' && value.name.trim().length >= 2 &&
    value.name.length <= 120 && STATUS.has(value.status) &&
    (value.startsAt == null || positiveInteger(value.startsAt));
}

export function validMatch(value) {
  return record(value) && typeof value.id === 'string' && value.id.length > 0 &&
    Number.isInteger(value.round) && value.round >= 1 && value.round <= 6 &&
    positiveInteger(value.slot) && value.slot <= 31 &&
    typeof value.teamA === 'string' && value.teamA.length <= 120 &&
    typeof value.teamB === 'string' && value.teamB.length <= 120 &&
    positiveInteger(value.scoreA) && positiveInteger(value.scoreB) &&
    MATCH_STATUS.has(value.status) &&
    (value.bestOf == null || (Number.isInteger(value.bestOf) && value.bestOf > 0));
}

/** Accept the empty-but-authoritative bracket, reject duplicate/forged slots. */
export function validBracket(value, expectedSlug) {
  if (!record(value) || !validTournament(value.tournament) ||
      value.tournament.slug !== expectedSlug ||
      !Array.isArray(value.matches) || value.matches.length > 63 ||
      !Array.isArray(value.teams) || value.teams.length > 64 ||
      !value.teams.every(team => record(team) && typeof team.id === 'string' &&
        typeof team.name === 'string') ||
      !value.matches.every(validMatch)) return false;

  const seen = new Set();
  let finalRound = 0;
  for (const match of value.matches) {
    const key = match.round + ':' + match.slot;
    if (seen.has(key)) return false;
    seen.add(key);
    finalRound = Math.max(finalRound, match.round);
  }
  // Single-elimination brackets require one final, every child must feed a
  // real next-round slot, and every parent must have both feeder slots.
  if (!value.matches.length) return true;
  if (value.matches.filter(m => m.round === finalRound).length !== 1 ||
      !seen.has(finalRound + ':0')) return false;
  for (const m of value.matches) {
    if (m.round < finalRound &&
        !seen.has((m.round + 1) + ':' + Math.floor(m.slot / 2))) return false;
    if (m.round > 1 &&
        (!seen.has((m.round - 1) + ':' + (m.slot * 2)) ||
         !seen.has((m.round - 1) + ':' + (m.slot * 2 + 1)))) return false;
  }
  return true;
}
