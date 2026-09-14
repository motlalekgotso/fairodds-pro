export type MarketKey =
  | "home_win"
  | "draw"
  | "away_win"
  | "btts_yes"
  | "btts_no"
  | "over_2_5"
  | "under_2_5";

export type OddsSet = Record<MarketKey, number>;

export interface RetailBook extends Partial<OddsSet> {
  book_name: string;
}

export interface LineupPlayer {
  name: string;
  position?: string;
  minutes?: number;
  goals?: number;
  assists?: number;
  xg?: number;
  xa?: number;
  rating?: number;
}

export interface TeamLineup {
  team: string;
  formation?: string;
  players: LineupPlayer[];
}

export interface Lineups {
  home: TeamLineup;
  away: TeamLineup;
}

export interface Match {
  id: string;
  home_team: string;
  away_team: string;
  league: string;
  kickoff_time: string;
  pinnacle_odds: Partial<OddsSet>;
  opening_odds?: Partial<OddsSet>;
  retail_odds: RetailBook[];
  stats_notes: string;
  lineups?: Lineups | null;
  created_at: string;
}

export interface Outcome {
  market: string;
  key: MarketKey;
  selection: string;
  probability: number;
}

export interface ValueOutcome extends Outcome {
  fair_prob: number;
  retail_odds: number;
  retail_book: string;
  ev_percent: number;
}

export interface AnalysisResult {
  match_id: string;
  fair_probabilities: Partial<Record<MarketKey, number>>;
  most_probable_outcome: Outcome | null;
  safest_outcome: (Outcome & { reasoning: string }) | null;
  value_outcome: ValueOutcome | null;
  risk_score: number;
  risk_label: "Low" | "Medium" | "High";
  risk_factors: string[];
}

export interface Leg {
  id: string;
  match_id: string;
  label: string;
  market: string;
  key: MarketKey;
  selection: string;
  probability: number;
  odds: number;
  book: string;
  risk_score: number;
}

export interface Ticket {
  id: string;
  created_at: string;
  legs: Leg[];
  combined_probability: number;
  combined_odds: number;
  status: "pending" | "won" | "lost";
  stake: number;
  payout: number;
}
