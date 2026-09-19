# Fairodds pro

# BetAnalyser Pro — Lovable Build Spec



## App Purpose

A football betting analysis web app that devigs sharp odds (Pinnacle), compares them against retail books, calculates a risk score per pick, and surfaces both the safest and highest-value bets — plus builds a combined "banker ticket" from trusted picks.



---



## 1. Data Models



**Match**

- id, home_team, away_team, league, kickoff_time

- pinnacle_odds: { home_win, draw, away_win, btts_yes, btts_no, over_2_5, under_2_5 }

- retail_odds: array of { book_name, home_win, draw, away_win, btts_yes, btts_no, over_2_5, under_2_5 }

- stats_notes: free text (form, injuries, head-to-head — manually entered or pasted from FBref/Understat)



**Analysis Result** (generated per match)

- fair_probabilities: devigged from Pinnacle odds

- most_probable_outcome: { market, selection, probability }

- safest_outcome: { market, selection, probability, reasoning }

- value_outcome: { market, selection, fair_prob, retail_odds, retail_book, ev_percent } or null if no +EV found

- risk_score: 1–10 with label (Low/Medium/High)

- risk_factors: array of strings (e.g. "line moved 8% toward favorite in 24h", "correlated with BTTS pick already in slip")



**Slip / Banker Ticket**

- id, created_at, legs: array of Analysis Results included

- combined_probability (multiplied across legs, with correlation discount applied)

- combined_odds

- status: pending / won / lost

- stake, payout (for the tracker/ledger)



---



## 2. Devig & Risk Logic (explain to Lovable so it scaffolds correctly)



**Devigging:** Convert each odds set to implied probability (1/odds), sum them to get the overround, then divide each individual implied probability by that overround to get fair probability.



**EV%:** `(fair_probability × retail_odds) - 1`, expressed as a percentage. Only flag as a value bet if EV% is positive and exceeds a small threshold (e.g. 2%) to avoid noise.



**Risk score inputs (weight these into a 1–10 scale):**

- Probability margin — how far fair probability sits above the retail book's break-even implied probability (bigger gap = lower risk)

- Line movement volatility — flag if odds moved sharply in the last 24–48h (manual input field for "opening odds" vs "current odds")

- Correlation flag — if a leg overlaps in outcome logic with another leg already in the same slip (e.g. BTTS Yes + Over 2.5), raise risk and note it explicitly rather than treating them as independent probabilities

- Sample reliability — flag if stats_notes field is empty (less confidence, higher risk)



---



## 3. Screens



**1. Dashboard / Home**

- List of analyzed matches (card per match: teams, league, kickoff, risk badge)

- "Add Match" button

- Quick stats: total matches analyzed, live +EV picks count, current banker ticket status



**2. Add/Analyze Match**

- Form: teams, league, kickoff time

- Odds input: Pinnacle odds fields + one or more retail book odds fields (repeatable rows)

- Optional stats notes textarea

- "Analyze" button → runs devig + EV + risk logic → shows Analysis Result card



**3. Match Analysis Result View**

- Three-tab or three-card layout: Most Probable / Safest / Best Value

- Risk score badge with breakdown (expandable list of risk_factors)

- "Add to Banker Ticket" button per outcome



**4. High-Probability Mode Toggle**

- Global toggle (top nav or settings) that re-sorts/re-filters the dashboard and match views to prioritize probability over EV — same data, different lens, not a separate dataset



**5. Banker Ticket Builder**

- Shows all legs currently added

- Combined probability and combined odds calculated live

- Warning banner if correlated legs are detected across the slip

- "Finalize Ticket" → moves to tracker as "pending"



**6. Leg Tracker / Ledger**

- Dark-themed table/list: date, match, market, selection, odds, stake, result, running ROI

- Filter by status (pending/won/lost) and date range

- Simple bankroll summary at top (total staked, total returned, net)



---



## 4. Visual Style

Dark ledger aesthetic (matches your existing HTML tracker) — dark background, high-contrast text, sharp accent color for +EV highlights (e.g. green) and risk badges (green/amber/red for Low/Med/High).



---



## 5. Suggested Build Order (paste as follow-up prompts in Lovable, one at a time)

1. Dashboard + Add Match form (no logic yet, just UI and data storage)

2. Devig + EV calculation logic wired to the Analyze button

3. Risk score logic + risk badge display

4. Three-outcome result view (Probable/Safe/Value)

5. Banker Ticket builder with correlation warning

6. Leg Tracker / Ledger with bankroll summary

7. High-probability mode toggle last, once base data model is stable

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/eca2ad10-dce7-46d4-bce4-53671e4c94f7).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
