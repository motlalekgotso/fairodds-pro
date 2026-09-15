import type { Lineups, TeamLineup } from "./types";

/**
 * A simple squad-quality score from whatever per-player numbers were read.
 * Prefers match ratings; falls back to attacking output per player.
 */
export function teamStrength(side: TeamLineup | undefined): number | null {
  if (!side || !side.players.length) return null;

  const ratings = side.players
    .map((p) => p.rating)
    .filter((r): r is number => typeof r === "number" && r > 0);
  if (ratings.length >= 3) {
    return ratings.reduce((a, b) => a + b, 0) / ratings.length;
  }

  const contributions = side.players.map(
    (p) => (p.goals ?? p.xg ?? 0) + 0.7 * (p.assists ?? p.xa ?? 0),
  );
  const total = contributions.reduce((a, b) => a + b, 0);
  if (total <= 0) return null;
  return total / side.players.length;
}

export function lineupEdge(lineups: Lineups | null | undefined) {
  if (!lineups) return null;
  const home = teamStrength(lineups.home);
  const away = teamStrength(lineups.away);
  if (home === null || away === null) return null;
  const diff = home - away;
  const pct = away !== 0 ? (diff / ((home + away) / 2)) * 100 : 0;
  return { home, away, diff, pct };
}
