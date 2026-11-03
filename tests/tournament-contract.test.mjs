import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validTournament, validMatch, validBracket } from '../src/services/tournamentContract.mjs';

const match = (round, slot) => ({
  id: `match-${round}-${slot}`, round, slot,
  teamA: 'Alpha', teamB: 'Bravo', scoreA: 0, scoreB: 0,
  status: 'scheduled', bestOf: 3,
});
const fixture = () => ({
  tournament: { slug: 'open-cup', name: 'Aventas Open Cup', status: 'upcoming', startsAt: 1815000000000 },
  teams: [{ id: 'a', name: 'Alpha' }, { id: 'b', name: 'Bravo' }],
  matches: [match(1, 0), match(1, 1), match(2, 0)],
});

describe('official website tournament contract', () => {
  it('accepts an empty, official bracket and a valid single-elimination bracket', () => {
    const data = fixture();
    assert.equal(validTournament(data.tournament), true);
    assert.equal(validMatch(data.matches[0]), true);
    assert.equal(validBracket(data, 'open-cup'), true);
    assert.equal(validBracket({ ...data, matches: [] }, 'open-cup'), true);
  });

  it('refuses a bracket from another tournament even when its matches look valid', () => {
    assert.equal(validBracket(fixture(), 'different-cup'), false);
  });

  it('refuses duplicate round slots and ambiguous final-round records', () => {
    const data = fixture();
    assert.equal(validBracket({ ...data, matches: [...data.matches, { ...match(2, 0), id: 'evil' }] }, 'open-cup'), false);
    assert.equal(validBracket({ ...data, matches: [match(1, 0), match(1, 1)] }, 'open-cup'), false);
  });

  it('does not coerce malformed scores or unknown statuses into official data', () => {
    const data = fixture();
    for (const variant of [
      { ...match(1, 0), scoreA: -1 },
      { ...match(1, 0), scoreA: '2' },
      { ...match(1, 0), status: 'reported' },
      { ...match(1, 0), round: 0 },
      { ...match(1, 0), slot: -1 },
    ]) {
      assert.equal(validMatch(variant), false);
      assert.equal(validBracket({ ...data, matches: [variant] }, 'open-cup'), false);
    }
  });

  it('rejects path-like slugs and huge unbounded responses', () => {
    const data = fixture();
    assert.equal(validTournament({ ...data.tournament, slug: '../../admin' }), false);
    assert.equal(validBracket({ ...data, matches: Array.from({ length: 129 }, (_, i) => match(1, i)) }, 'open-cup'), false);
  });
});
