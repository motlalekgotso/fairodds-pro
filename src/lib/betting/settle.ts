import type { MarketKey } from "./types";

export type LegResult = "won" | "lost" | "pending";

/** Resolve a single market key against a final score. */
export function settleKey(key: MarketKey, home: number, away: number): LegResult {
  const total = home + away;
  const btts = home > 0 && away > 0;
  switch (key) {
    case "home_win":
      return home > away ? "won" : "lost";
    case "draw":
      return home === away ? "won" : "lost";
    case "away_win":
      return away > home ? "won" : "lost";
    case "dc_1x":
      return home >= away ? "won" : "lost";
    case "dc_12":
      return home !== away ? "won" : "lost";
    case "dc_x2":
      return away >= home ? "won" : "lost";
    case "dnb_home":
      return home === away ? "pending" : home > away ? "won" : "lost";
    case "dnb_away":
      return home === away ? "pending" : away > home ? "won" : "lost";
    case "btts_yes":
      return btts ? "won" : "lost";
    case "btts_no":
      return btts ? "lost" : "won";
    case "over_1_5":
      return total > 1.5 ? "won" : "lost";
    case "under_1_5":
      return total < 1.5 ? "won" : "lost";
    case "over_2_5":
      return total > 2.5 ? "won" : "lost";
    case "under_2_5":
      return total < 2.5 ? "won" : "lost";
    case "over_3_5":
      return total > 3.5 ? "won" : "lost";
    case "under_3_5":
      return total < 3.5 ? "won" : "lost";
  }
}
