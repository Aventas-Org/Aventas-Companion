export interface RankRef { tier: string; division: number }

/**
 * Official VALORANT competitive tier icons, served by the community asset
 * mirror valorant-api.com. Riot permits these assets in community projects
 * under its "Legal Jibber Jabber" policy, provided the project carries the
 * notice in RIOT_ASSET_NOTICE and makes no claim of endorsement.
 *
 * Tier numbers follow Riot's competitive-tier table: Iron 1 = 3 … Radiant = 27.
 */
const TIER_SET = "03621f52-342b-cf4e-4f86-9350a49c6d04";

const TIER_BASE: Record<string, number> = {
  Iron: 3, Bronze: 6, Silver: 9, Gold: 12, Platinum: 15,
  Diamond: 18, Ascendant: 21, Immortal: 24, Radiant: 27,
};

/** Riot's own tier colours, used as the page accent. */
export const TIER_COLORS: Record<string, string> = {
  Iron: "#8a8a8a", Bronze: "#b88a5a", Silver: "#d5dbdf", Gold: "#e9c15a",
  Platinum: "#4fb7c6", Diamond: "#c890f5", Ascendant: "#45c48c",
  Immortal: "#e2535f", Radiant: "#ffe9a8",
};

export function tierNumber(rank: Pick<RankRef, "tier" | "division">): number | null {
  const base = TIER_BASE[rank.tier];
  if (base == null) return null;
  if (rank.tier === "Radiant") return base;
  return base + Math.min(Math.max(rank.division, 1), 3) - 1;
}

export function rankIconUrl(rank: Pick<RankRef, "tier" | "division">): string | null {
  const n = tierNumber(rank);
  return n == null ? null : `https://media.valorant-api.com/competitivetiers/${TIER_SET}/${n}/largeicon.png`;
}

export function tierColor(tier: string): string {
  return TIER_COLORS[tier] ?? "#9aa3ad";
}

export const RIOT_ASSET_NOTICE =
  "Aventas Companion was created under Riot Games' \"Legal Jibber Jabber\" policy using assets owned by Riot Games. Riot Games does not endorse or sponsor this project.";
