import type {
  AnalysisMatch,
  BuyType,
  ClutchType,
  FirstDuelEvent,
  MapPoint,
  OpeningDuelOutcome,
  PlaySide,
  RoundEvent,
  RoundOutcome,
  SiteId,
  UtilityEvent,
} from '../types/analysis';
import type { RiotKill, RiotMatchResponse, RiotRoundResult } from '../types/riot';
import { getMapLayout } from './mapLayouts';

/**
 * Maps a Riot `VAL-MATCH-V1` payload onto the app's analysis model.
 *
 * Everything downstream (heatmaps, economy chart, clutch breakdown, benchmarks,
 * insights) consumes `RoundEvent[]`, so this is the single place where Riot's
 * world-space coordinates and round semantics are translated. Wiring the API in
 * later is therefore `mapRiotMatches(payloads, puuid)` feeding `analyzeWindow`.
 *
 * Every inference the mapper has to make is recorded in the returned `notes`
 * array rather than hidden, because several of them (coordinate normalization in
 * particular) need calibrating against real payloads before they can be trusted.
 */

/** Per-map world-space bounds used to normalize coordinates into 0..1. */
export interface WorldBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface RiotMapOptions {
  /**
   * Calibrated bounds per map name. Prefer supplying these: without them the
   * mapper normalizes against the match's own observed extremes, which is
   * consistent *within* a match but not comparable between matches.
   */
  bounds?: Record<string, WorldBounds>;
  /** Set when Riot's Y axis runs opposite to the top-down canvas. */
  flipY?: boolean;
  /** Used when the payload contains no spike plants to infer sides from. */
  firstHalfAttackingTeam?: string;
}

export interface MappedMatch {
  match: AnalysisMatch;
  rounds: RoundEvent[];
  /** Assumptions the mapper made, so callers can log or surface them. */
  notes: string[];
}

export interface MappedMatches {
  matches: AnalysisMatch[];
  rounds: RoundEvent[];
  notes: string[];
}

/** Average loadout value bands used to classify a buy. */
const SPEND_ECO_MAX = 1800;
const SPEND_FORCE_MAX = 2900;
const SPEND_HALF_MAX = 3500;

/** Extracts a map name from Riot's asset path, e.g. "/Game/Maps/Ascent/Ascent". */
export function mapNameFromMapId(mapId: string): string {
  const segments = mapId.split('/').filter(Boolean);
  return segments[segments.length - 1] ?? 'Unknown';
}

function buyTypeFromSpend(spend: number): BuyType {
  if (spend <= SPEND_ECO_MAX) return 'eco';
  if (spend <= SPEND_FORCE_MAX) return 'force';
  if (spend <= SPEND_HALF_MAX) return 'half';
  return 'full';
}

/** Which team is attacking in a given round, given who attacked the first half. */
function attackingTeamForRound(
  round: number,
  firstHalfAttackers: string,
  otherTeam: string,
): string {
  if (round <= 12) return firstHalfAttackers;
  if (round <= 24) return otherTeam;
  // Overtime swaps sides every round, starting back with the first-half attackers.
  return (round - 25) % 2 === 0 ? firstHalfAttackers : otherTeam;
}

/**
 * The attacking team is always the team that planted the spike, so a single
 * plant is enough to pin down the half. Falls back to second-half plants (which
 * imply the opposite first-half attacker) when the first half had none.
 */
function inferFirstHalfAttackers(
  roundResults: RiotRoundResult[],
  teamByPuuid: Map<string, string>,
  otherTeamOf: (team: string) => string,
): string | null {
  for (const round of roundResults) {
    if (round.roundNum > 12) continue;
    const planter = round.bombPlanter;
    const team = planter ? teamByPuuid.get(planter) : undefined;
    if (team) return team;
  }
  for (const round of roundResults) {
    if (round.roundNum <= 12 || round.roundNum > 24) continue;
    const planter = round.bombPlanter;
    const team = planter ? teamByPuuid.get(planter) : undefined;
    if (team) return otherTeamOf(team);
  }
  return null;
}

function collectWorldPoints(kills: RiotKill[]): MapPoint[] {
  const points: MapPoint[] = [];
  for (const kill of kills) {
    if (kill.victimLocation) points.push(kill.victimLocation);
    for (const location of kill.playerLocations ?? []) {
      if (location.location) points.push(location.location);
    }
  }
  return points;
}

interface Normalizer {
  normalize: (point: MapPoint) => MapPoint;
  note: string;
}

function createNormalizer(
  kills: RiotKill[],
  bounds: WorldBounds | undefined,
  flipY: boolean,
): Normalizer {
  const toPoint = (
    x: number,
    y: number,
    minX: number,
    minY: number,
    spanX: number,
    spanY: number,
  ) => ({
    x: Math.min(1, Math.max(0, (x - minX) / spanX)),
    y: Math.min(1, Math.max(0, flipY ? 1 - (y - minY) / spanY : (y - minY) / spanY)),
  });

  if (bounds) {
    const spanX = bounds.maxX - bounds.minX || 1;
    const spanY = bounds.maxY - bounds.minY || 1;
    return {
      normalize: (point) => toPoint(point.x, point.y, bounds.minX, bounds.minY, spanX, spanY),
      note: 'Coordinates normalized using the supplied per-map bounds.',
    };
  }

  const points = collectWorldPoints(kills);
  if (points.length === 0) {
    return {
      normalize: () => ({ x: 0.5, y: 0.5 }),
      note: 'Payload contained no world coordinates; heatmap points fall back to the map centre.',
    };
  }

  const minX = Math.min(...points.map((point) => point.x));
  const maxX = Math.max(...points.map((point) => point.x));
  const minY = Math.min(...points.map((point) => point.y));
  const maxY = Math.max(...points.map((point) => point.y));
  const spanX = maxX - minX || 1;
  const spanY = maxY - minY || 1;

  return {
    normalize: (point) => toPoint(point.x, point.y, minX, minY, spanX, spanY),
    note: 'Coordinates normalized against this match\u2019s observed extremes — supply calibrated per-map bounds for cross-match accuracy.',
  };
}

function siteFromZoneId(zoneId: string): SiteId | null {
  if (zoneId.startsWith('a-')) return 'A';
  if (zoneId.startsWith('b-')) return 'B';
  if (zoneId.startsWith('c-')) return 'C';
  return null;
}

/** Nearest named site to a point, using the schematic layout as the reference. */
function nearestSite(point: MapPoint, map: string): SiteId {
  let best: SiteId = 'Mid';
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const zone of getMapLayout(map).zones) {
    const site = siteFromZoneId(zone.id);
    if (!site) continue;
    const cx = zone.x + zone.w / 2;
    const cy = zone.y + zone.h / 2;
    const distance = (cx - point.x) ** 2 + (cy - point.y) ** 2;
    if (distance < bestDistance) {
      bestDistance = distance;
      best = site;
    }
  }
  return best;
}

/** Nearest zone label to a point, used for the heatmap tooltip. */
function nearestZoneLabel(point: MapPoint, map: string): string {
  let best = 'Unknown';
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const zone of getMapLayout(map).zones) {
    const cx = zone.x + zone.w / 2;
    const cy = zone.y + zone.h / 2;
    const distance = (cx - point.x) ** 2 + (cy - point.y) ** 2;
    if (distance < bestDistance) {
      bestDistance = distance;
      best = zone.label;
    }
  }
  return best;
}

/** Team-average loadout value for the round, which is the app's "spend". */
function meanTeamSpend(
  round: RiotRoundResult,
  teamId: string,
  teamByPuuid: Map<string, string>,
): number {
  const values: number[] = [];
  for (const stats of round.playerStats ?? []) {
    if (teamByPuuid.get(stats.puuid) !== teamId) continue;
    values.push(stats.economy?.loadoutValue ?? 0);
  }
  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

/**
 * Site is taken from where the spike was planted — the one position in the
 * payload that unambiguously identifies the site the round was played around.
 * Rounds that ended without a plant stay unresolved.
 */
function inferSite(round: RiotRoundResult, map: string, normalize: (p: MapPoint) => MapPoint) {
  const locations = round.plantPlayerLocations ?? [];
  const planterLocation =
    locations.find((location) => location.puuid === round.bombPlanter)?.location ??
    locations.find((location) => location.location)?.location ??
    null;
  if (!planterLocation) return null;
  return nearestSite(normalize(planterLocation), map);
}

/**
 * The opening duel is simply the first kill of the round, so this is exact: if
 * the player is the killer it is a first blood, if they are the victim a first
 * death, otherwise they were not part of it.
 */
function inferFirstDuel(
  roundKills: RiotKill[],
  puuid: string,
  map: string,
  normalize: (p: MapPoint) => MapPoint,
): FirstDuelEvent | undefined {
  const first = roundKills[0];
  if (!first) return undefined;

  let kind: OpeningDuelOutcome | null = null;
  if (first.killer === puuid) kind = 'first-blood';
  else if (first.victim === puuid) kind = 'first-death';
  if (!kind) return undefined;

  const raw =
    first.playerLocations?.find((location) => location.puuid === puuid)?.location ??
    first.victimLocation;
  const point = raw ? normalize(raw) : { x: 0.5, y: 0.5 };
  return { kind, zone: nearestZoneLabel(point, map), point };
}

/**
 * Replays the round's kills in chronological order to find the moment the
 * player was outnumbered. 1vX is exact: it is the instant they became the last
 * member of their team alive, and the round result tells us whether it converted.
 * 2vX is the moment their team dropped to two alive with the fight still live.
 *
 * The *first* qualifying moment is kept, so winning a 1v2 and then cleaning up a
 * 1v1 still counts as a 1v2 clutch rather than being downgraded. 1vX takes
 * precedence over 2vX when both occur in the same round.
 */
function inferClutch(
  roundKills: RiotKill[],
  teamByPuuid: Map<string, string>,
  puuid: string,
  playerTeamId: string,
  result: RoundOutcome,
): RoundEvent['clutch'] {
  const aliveMates = new Set<string>();
  const aliveEnemies = new Set<string>();
  for (const [member, team] of teamByPuuid) {
    if (team === playerTeamId) aliveMates.add(member);
    else aliveEnemies.add(member);
  }

  let oneVersus: ClutchType | null = null;
  let twoVersus: ClutchType | null = null;

  for (const kill of roundKills) {
    if (aliveMates.has(kill.victim)) aliveMates.delete(kill.victim);
    else if (aliveEnemies.has(kill.victim)) aliveEnemies.delete(kill.victim);

    // The player is dead: any clutch they were in is already over.
    if (!aliveMates.has(puuid)) break;

    if (aliveMates.size === 1 && aliveEnemies.size >= 1 && aliveEnemies.size <= 3) {
      if (oneVersus === null) oneVersus = `1v${aliveEnemies.size}` as ClutchType;
    } else if (aliveMates.size === 2 && (aliveEnemies.size === 1 || aliveEnemies.size === 2)) {
      if (twoVersus === null) twoVersus = `2v${aliveEnemies.size}` as ClutchType;
    }
  }

  const type = oneVersus ?? twoVersus;
  if (!type) return undefined;
  return { type, won: result === 'win' };
}

/**
 * Ability casts are counted from the effect ids Riot attaches per slot. There is
 * no reliable flash classification in this payload, so flash-specific numbers are
 * left at zero rather than guessed.
 */
function inferUtility(round: RiotRoundResult, puuid: string): UtilityEvent | undefined {
  const stats = round.playerStats?.find((entry) => entry.puuid === puuid);
  const ability = stats?.ability;
  if (!ability) return undefined;

  let casts = 0;
  if (ability.grenadeEffects) casts += 1;
  if (ability.ability1Effects) casts += 1;
  if (ability.ability2Effects) casts += 1;
  if (ability.ultimateEffects) casts += 1;

  return { casts, flashesThrown: 0, flashAssists: 0 };
}

/** Maps a single `VAL-MATCH-V1` match payload for one player. */
export function mapRiotMatch(
  payload: RiotMatchResponse,
  puuid: string,
  options: RiotMapOptions = {},
): MappedMatch {
  const notes: string[] = [];
  const { matchInfo, players, roundResults = [], kills = [] } = payload;

  const me = players.find((player) => player.puuid === puuid);
  if (!me) {
    throw new Error(`puuid ${puuid} did not play in match ${matchInfo.matchId}`);
  }

  const playerTeamId = me.teamId;
  const teamByPuuid = new Map(players.map((player) => [player.puuid, player.teamId]));
  const otherTeamId = players.find((player) => player.teamId !== playerTeamId)?.teamId ?? '';
  const otherTeamOf = (team: string) => (team === playerTeamId ? otherTeamId : playerTeamId);

  const mapName = mapNameFromMapId(matchInfo.mapId);
  const { normalize, note: coordinateNote } = createNormalizer(
    kills,
    options.bounds?.[mapName],
    options.flipY ?? false,
  );
  notes.push(coordinateNote);

  const inferredAttackers = inferFirstHalfAttackers(roundResults, teamByPuuid, otherTeamOf);
  const firstHalfAttackers = options.firstHalfAttackingTeam ?? inferredAttackers ?? playerTeamId;
  if (options.firstHalfAttackingTeam) {
    notes.push('Side determined by the supplied firstHalfAttackingTeam override.');
  } else if (inferredAttackers) {
    notes.push('Side inferred from which team planted the spike.');
  } else {
    notes.push(
      'No spike plants in the payload; assumed the player’s team attacked the first half. Supply firstHalfAttackingTeam to correct this.',
    );
  }

  const teamWins = new Map<string, number>();
  for (const round of roundResults) {
    teamWins.set(round.winningTeam, (teamWins.get(round.winningTeam) ?? 0) + 1);
  }
  const wins = teamWins.get(playerTeamId) ?? 0;
  const losses = teamWins.get(otherTeamId) ?? 0;

  let unresolvedSites = 0;
  const rounds: RoundEvent[] = roundResults.map((round) => {
    const roundKills = kills
      .filter((kill) => kill.round === round.roundNum)
      .sort((a, b) => a.time - b.time);

    const result: RoundOutcome = round.winningTeam === playerTeamId ? 'win' : 'loss';
    const attackers = attackingTeamForRound(round.roundNum, firstHalfAttackers, otherTeamId);
    const side: PlaySide = attackers === playerTeamId ? 'attack' : 'defense';
    const spend = meanTeamSpend(round, playerTeamId, teamByPuuid);
    const site = inferSite(round, mapName, normalize);
    if (!site) unresolvedSites += 1;

    const event: RoundEvent = {
      matchId: matchInfo.matchId,
      round: round.roundNum,
      map: mapName,
      side,
      site: site ?? 'Mid',
      buyType: buyTypeFromSpend(spend),
      spend,
      result,
    };

    const firstDuel = inferFirstDuel(roundKills, puuid, mapName, normalize);
    if (firstDuel) event.firstDuel = firstDuel;

    const clutch = inferClutch(roundKills, teamByPuuid, puuid, playerTeamId, result);
    if (clutch) event.clutch = clutch;

    const utility = inferUtility(round, puuid);
    if (utility) event.utility = utility;

    return event;
  });

  if (roundResults.length === 0) {
    notes.push('Payload contained no roundResults; only match metadata was mapped.');
  }
  if (unresolvedSites > 0) {
    notes.push(
      `${unresolvedSites} round(s) ended without a spike plant, so their site could not be determined and defaults to Mid.`,
    );
  }
  notes.push(
    'Flash usage is not derivable from this payload without an agent ability table; flash metrics stay at zero.',
  );

  return {
    match: {
      id: matchInfo.matchId,
      map: mapName,
      date: new Date(matchInfo.gameStartMillis).toISOString(),
      result: wins > losses ? 'win' : 'loss',
      score: `${wins} - ${losses}`,
      rounds: roundResults.length,
    },
    rounds,
    notes,
  };
}

/** Maps many match payloads, concatenating their rounds and de-duplicating notes. */
export function mapRiotMatches(
  payloads: RiotMatchResponse[],
  puuid: string,
  options: RiotMapOptions = {},
): MappedMatches {
  const matches: AnalysisMatch[] = [];
  const rounds: RoundEvent[] = [];
  const noteSet = new Set<string>();

  for (const payload of payloads) {
    const mapped = mapRiotMatch(payload, puuid, options);
    matches.push(mapped.match);
    rounds.push(...mapped.rounds);
    for (const note of mapped.notes) noteSet.add(note);
  }

  matches.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return { matches, rounds, notes: [...noteSet] };
}

/** The world-space bounds type is exported for callers building option objects. */
export type { WorldBounds as RiotWorldBounds };
