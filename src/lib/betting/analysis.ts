import type {
  AnalysisResult,
  Leg,
  Match,
  MarketKey,
  Outcome,
  ValueOutcome,
} from "./types";

export const MARKET_GROUPS: { name: string; keys: MarketKey[] }[] = [
  { name: "1X2", keys: ["home_win", "draw", "away_win"] },
  { name: "BTTS", keys: ["btts_yes", "btts_no"] },
  { name: "Total 2.5", keys: ["over_2_5", "under_2_5"] },
];

export const MARKET_OF: Record<MarketKey, string> = {
  home_win: "1X2",
  draw: "1X2",
  away_win: "1X2",
  btts_yes: "BTTS",
  btts_no: "BTTS",
  over_2_5: "Total 2.5",
  under_2_5: "Total 2.5",
};

export function selectionLabel(key: MarketKey, match?: Match): string {
  switch (key) {
    case "home_win":
      return match ? `${match.home_team} win` : "Home win";
    case "draw":
      return "Draw";
    case "away_win":
      return match ? `${match.away_team} win` : "Away win";
    case "btts_yes":
      return "BTTS Yes";
    case "btts_no":
      return "BTTS No";
    case "over_2_5":
      return "Over 2.5";
    case "under_2_5":
      return "Under 2.5";
  }
}

/** Devig a set of odds group-by-group: implied prob / overround. */
export function devig(odds: Partial<Record<MarketKey, number>>) {
  const fair: Partial<Record<MarketKey, number>> = {};
  for (const group of MARKET_GROUPS) {
    const present = group.keys.filter((k) => (odds[k] ?? 0) > 1);
    if (present.length < 2) continue;
    const implied = present.map((k) => 1 / (odds[k] as number));
    const overround = implied.reduce((a, b) => a + b, 0);
    present.forEach((k, i) => {
      fair[k] = (implied[i] as number) / overround;
    });
  }
  return fair;
}

export const EV_THRESHOLD = 0.02;

export function evPercent(fairProb: number, retailOdds: number) {
  return (fairProb * retailOdds - 1) * 100;
}

const CORRELATED: [MarketKey, MarketKey][] = [
  ["btts_yes", "over_2_5"],
  ["btts_no", "under_2_5"],
];

export function isCorrelated(a: MarketKey, b: MarketKey) {
  if (MARKET_OF[a] === MARKET_OF[b]) return true;
  return CORRELATED.some(
    ([x, y]) => (x === a && y === b) || (x === b && y === a),
  );
}

export function correlatedPairs(legs: Leg[]) {
  const pairs: [Leg, Leg][] = [];
  for (let i = 0; i < legs.length; i++) {
    for (let j = i + 1; j < legs.length; j++) {
      const a = legs[i] as Leg;
      const b = legs[j] as Leg;
      if (a.match_id === b.match_id && isCorrelated(a.key, b.key)) {
        pairs.push([a, b]);
      }
    }
  }
  return pairs;
}

export function riskLabel(score: number): AnalysisResult["risk_label"] {
  if (score <= 3.5) return "Low";
  if (score <= 6.5) return "Medium";
  return "High";
}

export function bestRetail(match: Match, key: MarketKey) {
  let best: { book: string; odds: number } | null = null;
  for (const book of match.retail_odds) {
    const o = book[key];
    if (typeof o === "number" && o > 1 && (!best || o > best.odds)) {
      best = { book: book.book_name || "Retail", odds: o };
    }
  }
  return best;
}

export function analyzeMatch(match: Match, slipLegs: Leg[] = []): AnalysisResult {
  const fair = devig(match.pinnacle_odds);
  const entries = (Object.keys(fair) as MarketKey[]).map((k) => ({
    key: k,
    market: MARKET_OF[k],
    selection: selectionLabel(k, match),
    probability: fair[k] as number,
  }));

  const sorted = [...entries].sort((a, b) => b.probability - a.probability);
  const most_probable_outcome: Outcome | null = sorted[0] ?? null;

  // Safest: highest probability with an available retail price (tradeable) —
  // fall back to highest probability overall.
  let safest: (Outcome & { reasoning: string }) | null = null;
  for (const e of sorted) {
    const retail = bestRetail(match, e.key);
    if (retail) {
      const breakEven = 1 / retail.odds;
      safest = {
        ...e,
        reasoning: `Fair probability ${(e.probability * 100).toFixed(1)}% vs break-even ${(breakEven * 100).toFixed(1)}% at ${retail.book} (${retail.odds.toFixed(2)}).`,
      };
      break;
    }
  }
  if (!safest && most_probable_outcome) {
    safest = {
      ...most_probable_outcome,
      reasoning: "Highest devigged probability; no retail price entered yet.",
    };
  }

  // Value: best positive EV above threshold
  let value_outcome: ValueOutcome | null = null;
  for (const e of entries) {
    const retail = bestRetail(match, e.key);
    if (!retail) continue;
    const ev = evPercent(e.probability, retail.odds);
    if (ev > EV_THRESHOLD * 100 && (!value_outcome || ev > value_outcome.ev_percent)) {
      value_outcome = {
        ...e,
        fair_prob: e.probability,
        retail_odds: retail.odds,
        retail_book: retail.book,
        ev_percent: ev,
      };
    }
  }

  // ---- Risk score (1-10, lower = safer)
  const factors: string[] = [];
  let score = 5;

  const focus = value_outcome ?? safest;
  if (focus) {
    const retail = bestRetail(match, focus.key);
    if (retail) {
      const margin = focus.probability - 1 / retail.odds;
      score -= Math.max(-2, Math.min(3, margin * 25));
      if (margin > 0.04)
        factors.push(
          `Healthy probability margin: +${(margin * 100).toFixed(1)}pts over break-even`,
        );
      else if (margin < 0)
        factors.push(
          `Negative probability margin: ${(margin * 100).toFixed(1)}pts under break-even`,
        );
    } else {
      score += 1;
      factors.push("No retail price entered — pricing edge unverified");
    }

    // Line movement
    const open = match.opening_odds?.[focus.key];
    const now = match.pinnacle_odds[focus.key];
    if (open && now) {
      const move = Math.abs(now - open) / open;
      if (move >= 0.05) {
        score += Math.min(2, move * 20);
        factors.push(
          `Line moved ${(move * 100).toFixed(1)}% ${now < open ? "toward" : "away from"} this selection in the last 24–48h`,
        );
      } else {
        factors.push("Line stable since opening (<5% movement)");
      }
    } else {
      score += 0.5;
      factors.push("No opening odds provided — line movement unknown");
    }

    // Correlation with existing slip legs
    const conflict = slipLegs.find(
      (l) => l.match_id === match.id && isCorrelated(l.key, focus.key),
    );
    if (conflict) {
      score += 2;
      factors.push(
        `Correlated with "${conflict.selection}" already in the banker ticket — not independent`,
      );
    }

    // Low probability outcomes are inherently riskier
    if (focus.probability < 0.4) {
      score += 1;
      factors.push(`Sub-40% fair probability (${(focus.probability * 100).toFixed(1)}%)`);
    }
  } else {
    score += 2;
    factors.push("Insufficient odds entered to devig any market");
  }

  if (!match.stats_notes.trim()) {
    score += 1;
    factors.push("No stats notes — form/injury context missing, lower sample reliability");
  }

  score = Math.max(1, Math.min(10, Math.round(score * 10) / 10));

  return {
    match_id: match.id,
    fair_probabilities: fair,
    most_probable_outcome,
    safest_outcome: safest,
    value_outcome,
    risk_score: score,
    risk_label: riskLabel(score),
    risk_factors: factors,
  };
}

/** Combined probability with a discount applied for correlated legs. */
export function combineLegs(legs: Leg[]) {
  const raw = legs.reduce((acc, l) => acc * l.probability, 1);
  const pairs = correlatedPairs(legs);
  const discount = Math.pow(0.85, pairs.length);
  const odds = legs.reduce((acc, l) => acc * l.odds, 1);
  return {
    combined_probability: legs.length ? raw * discount : 0,
    combined_odds: legs.length ? odds : 0,
    correlated: pairs,
  };
}
