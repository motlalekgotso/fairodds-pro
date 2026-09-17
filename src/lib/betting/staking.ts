/**
 * Bankroll / stake sizing. Conservative quarter-Kelly with a hard cap so a single
 * ticket can never take a damaging slice of the bankroll.
 */

export const KELLY_FRACTION = 0.25;
/** Never risk more than this share of the bankroll on one ticket. */
export const MAX_BANKROLL_SHARE = 0.05;

export interface StakeAdvice {
  stake: number;
  /** Share of bankroll, 0-1 */
  share: number;
  edge: number;
  capped: boolean;
  reason: string;
}

export function kellyStake(
  bankroll: number,
  probability: number,
  odds: number,
): StakeAdvice {
  const b = odds - 1;
  const p = Math.max(0, Math.min(1, probability));
  const q = 1 - p;
  const edge = p * odds - 1;

  if (!(bankroll > 0)) {
    return {
      stake: 0,
      share: 0,
      edge,
      capped: false,
      reason: "Enter your bookmaker balance to get a stake suggestion.",
    };
  }
  if (b <= 0 || edge <= 0) {
    return {
      stake: 0,
      share: 0,
      edge,
      capped: false,
      reason:
        "No edge at this price — the odds are shorter than the true chance. Skipping is the profitable play.",
    };
  }

  const full = (b * p - q) / b;
  const fractional = full * KELLY_FRACTION;
  const capped = fractional > MAX_BANKROLL_SHARE;
  const share = Math.min(fractional, MAX_BANKROLL_SHARE);
  const stake = Math.max(0, Math.round(bankroll * share * 100) / 100);

  return {
    stake,
    share,
    edge,
    capped,
    reason: capped
      ? `Edge is large, but the stake is capped at ${(MAX_BANKROLL_SHARE * 100).toFixed(0)}% of your balance to protect the bankroll.`
      : `Quarter-Kelly on a ${(edge * 100).toFixed(1)}% edge — ${(share * 100).toFixed(2)}% of your balance.`,
  };
}
