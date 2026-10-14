/**
 * Subset of the Riot `VAL-MATCH-V1` match payload (`/val/match/v1/matches/{id}`)
 * that this app consumes.
 *
 * Only the fields the analysis layer actually needs are declared. Everything is
 * optional-tolerant so a partial or evolving payload degrades into missing
 * analysis rather than a crash. Field names and nesting mirror Riot's published
 * match sample: `matchInfo`, `players`, `roundResults[]` (with per-player
 * `economy` and `ability`), and the flat `kills[]` array carrying world-space
 * coordinates.
 */

/** A world-space map coordinate as delivered by the Riot API. */
export interface RiotWorldPosition {
  x: number;
  y: number;
}

/** A player's position (and facing) at a specific event. */
export interface RiotPlayerLocation {
  puuid: string;
  viewRadians: number;
  /** Null when the player was not in the world at that moment. */
  location: RiotWorldPosition | null;
}

/** One player's per-round statistics. */
export interface RiotRoundPlayerStats {
  puuid: string;
  score: number;
  economy: {
    /** Credits tied up in the player's loadout this round. */
    loadoutValue: number;
    /** Credits banked going into the round. */
    remaining: number;
    spent: number;
  };
  /** Ability effect ids fired this round; null for a slot that was not used. */
  ability?: {
    grenadeEffects?: string | null;
    ability1Effects?: string | null;
    ability2Effects?: string | null;
    ultimateEffects?: string | null;
  } | null;
}

/** One round of the match. */
export interface RiotRoundResult {
  roundNum: number;
  /** Human-readable outcome, e.g. "Bomb defused" or "Eliminated by Attacking Team". */
  roundResult: string;
  winningTeam: string;
  /** Puuid of the spike planter, or null when the spike was never planted. */
  bombPlanter?: string | null;
  bombDefuser?: string | null;
  plantRoundTime?: number;
  playerStats: RiotRoundPlayerStats[];
  /** Every player's position at the moment the spike was planted. */
  plantPlayerLocations?: RiotPlayerLocation[] | null;
  defusePlayerLocations?: RiotPlayerLocation[] | null;
}

/** A single kill event, with the positions of everyone involved. */
export interface RiotKill {
  /** Round number the kill happened in. */
  round: number;
  /** Milliseconds into the round. */
  time: number;
  killer: string;
  victim: string;
  victimLocation: RiotWorldPosition;
  assistants: string[];
  playerLocations: RiotPlayerLocation[];
  finishingDamage: {
    damageType: string;
    damageItem: string;
    isSecondaryFireMode: boolean;
  };
}

export interface RiotPlayer {
  puuid: string;
  gameName: string;
  tagLine: string;
  /** "Blue" or "Red". */
  teamId: string;
  /** Agent id (a path such as "/Game/Characters/..."). */
  characterId: string;
  stats?: {
    score: number;
    kills: number;
    deaths: number;
    assists: number;
    headshots: number;
    bodyshots: number;
    legshots: number;
  };
}

export interface RiotMatchInfo {
  matchId: string;
  /** Asset path such as "/Game/Maps/Ascent/Ascent". */
  mapId: string;
  gameStartMillis: number;
  gameLengthMillis: number;
  /** Queue id, e.g. "competitive" or "unrated". */
  queueId: string;
  gameMode: string;
  isCompleted: boolean;
}

export interface RiotMatchResponse {
  matchInfo: RiotMatchInfo;
  players: RiotPlayer[];
  roundResults: RiotRoundResult[];
  kills: RiotKill[];
}
