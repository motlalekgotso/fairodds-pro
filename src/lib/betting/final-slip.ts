import { analyzeMatch, bestRetail, MARKET_OF, selectionLabel, isCorrelated } from "./analysis";
import type { Leg, MarketKey, Match } from "./types";

export interface Candidate {
  match: Match;
  key: MarketKey;
  selection: string;
  probability: number;
  odds: number;
  book: string;
  ev: number;
  risk_score: number;
  quality: number;
}

/** Every tradeable selection across all analysed matches, ranked by confidence-with-value. */
export function candidates(matches: Match[]): Candidate[] {
  const out: Candidate[] = [];
  for (const match of matches) {
    const analysis = analyzeMatch(match);
    for (const k of Object.keys(analysis.fair_probabilities) as MarketKey[]) {
      const p = analysis.fair_probabilities[k];
      if (!p) continue;
      const retail = bestRetail(match, k);
      if (!retail) continue;
      const ev = p * retail.odds - 1;
      // Confidence first, value as a multiplier; anything clearly -EV is dropped.
      if (ev < -0.02) continue;
      out.push({
        match,
        key: k,
        selection: selectionLabel(k, match),
        probability: p,
        odds: retail.odds,
        book: retail.book,
        ev,
        risk_score: analysis.risk_score,
        quality: p * (1 + Math.max(0, ev) * 3) - analysis.risk_score / 100,
      });
    }
  }
  return out.sort((a, b) => b.quality - a.quality);
}

export interface SlipBuild {
  legs: Candidate[];
  combined_odds: number;
  combined_probability: number;
  reachedTarget: boolean;
  note: string;
}

/**
 * Build the most accurate slip that lands inside a target odds range:
 * highest-probability selections with value, one per match, no correlated legs.
 */
export function buildFinalSlip(
  matches: Match[],
  minOdds: number,
  maxOdds: number,
  maxLegs = 6,
): SlipBuild {
  const pool = candidates(matches);
  const picked: Candidate[] = [];
  let odds = 1;

  for (const c of pool) {
    if (picked.length >= maxLegs) break;
    if (odds >= minOdds) break;
    if (picked.some((p) => p.match.id === c.match.id)) continue;
    if (picked.some((p) => p.match.id === c.match.id && isCorrelated(p.key, c.key))) continue;
    const next = odds * c.odds;
    if (next > maxOdds && picked.length) continue;
    picked.push(c);
    odds = next;
  }

  const probability = picked.reduce((a, c) => a * c.probability, 1);
  const reached = picked.length > 0 && odds >= minOdds && odds <= maxOdds;

  return {
    legs: picked,
    combined_odds: picked.length ? odds : 0,
    combined_probability: picked.length ? probability : 0,
    reachedTarget: reached,
    note: !picked.length
      ? "No selections with a usable retail price yet — add matches with comparison odds first."
      : reached
        ? "Target range hit with the safest value selections available."
        : odds < minOdds
          ? "Ran out of safe selections before reaching your target — add more matches or lower the target."
          : "Closest safe combination; going higher would mean adding a risky leg.",
  };
}

export function candidateToLeg(c: Candidate, risk: number): Leg {
  return {
    id: crypto.randomUUID(),
    match_id: c.match.id,
    label: `${c.match.home_team} v ${c.match.away_team}`,
    market: MARKET_OF[c.key],
    key: c.key,
    selection: c.selection,
    probability: c.probability,
    odds: c.odds,
    book: c.book,
    risk_score: risk,
    home_team: c.match.home_team,
    away_team: c.match.away_team,
    kickoff_time: c.match.kickoff_time,
  };
}
