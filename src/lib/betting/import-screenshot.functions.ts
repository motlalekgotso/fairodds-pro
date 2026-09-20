import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const MarketKeys = [
  "home_win",
  "draw",
  "away_win",
  "dc_1x",
  "dc_12",
  "dc_x2",
  "dnb_home",
  "dnb_away",
  "btts_yes",
  "btts_no",
  "over_1_5",
  "under_1_5",
  "over_2_5",
  "under_2_5",
  "over_3_5",
  "under_3_5",
] as const;

type MarketKey = typeof MarketKeys[number];

const oddsSchema = () => ({
  type: "object",
  properties: Object.fromEntries(
    MarketKeys.map((k) => [k, { type: "number" }])
  ),
  additionalProperties: false,
});

const InputSchema = z.object({
  imageDataUrl: z.string(),
});

export interface ImportedBook {
  book_name: string;
  odds: Partial<Record<MarketKey, number>>;
}

export type ScreenshotKind = "odds" | "comparison" | "stats" | "lineup" | "other";

export interface ImportedScreenshot {
  kind: ScreenshotKind;
  home_team: string;
  away_team: string;
  league: string;
  kickoff_time: string;
  pinnacle: Partial<Record<MarketKey, number>>;
  books: ImportedBook[];
  notes: string;
  lineups: any | null;
}

const SYSTEM = `You read screenshots related to a football match and extract whatever is visible.
First classify the screenshot with "kind":
- "odds": a sportsbook page showing one book's prices (e.g. Pinnacle).
- "comparison": an odds comparison table across several bookmakers (e.g. OddsPortal).
- "stats": form tables, xG, head-to-head, standings, injuries (e.g. FBref, Understat).
- "lineup": starting XI / line-up / squad or player-statistics tables (e.g. FBref player tables).
- "other": anything else.

Odds: decimal only (convert fractional/American). Market keys: home_win, draw, away_win (1X2), dc_1x, dc_12, dc_x2 (double chance: home-or-draw, home-or-away, draw-or-away), dnb_home, dnb_away (draw no bet), btts_yes, btts_no, over_1_5, under_1_5, over_2_5, under_2_5, over_3_5, under_3_5 (total goals).

Read EVERY market visible in the image, not just the match result. Bookmaker wording varies:
"1X"/"Home or Draw" = dc_1x, "12"/"Home or Away" = dc_12, "X2"/"Draw or Away" = dc_x2,
"Draw No Bet"/"DNB" = dnb_home/dnb_away, "Both Teams To Score" = btts_yes/btts_no,
"Total Goals Over/Under" at the matching line = over_/under_ keys. Ignore markets with no key above.
A column named Pinnacle goes into "pinnacle"; other bookmakers go into "books". If a single unlabelled set of prices is shown, treat it as "pinnacle".

Stats: put a concise plain-text bullet summary of any visible statistics into "notes" (form, goals, xG, head-to-head, injuries, suspensions). Never invent numbers.

Line-ups / player tables: fill "lineups" with the home and away teams, formation if shown, and each player with the numeric per-player stats visible (FBref style: minutes, goals, assists, xG, xA, match rating). Omit any field that is not visible. If only one team is shown, fill just that side and leave the other side's players empty.

Never invent anything that is not readable in the image.`;

export const importScreenshot = createServerFn({ method: "POST" })
 .inputValidator((data: unknown) => InputSchema.parse(data))
 .handler(async ({ data }): Promise<ImportedScreenshot> => {
    const apiKey = process.env["GEMINI_API_KEY"];
    if (!apiKey) throw new Error("GEMINI_API_KEY is not configured for this project.");

    const res = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gemini-2.0-flash",
        messages: [
          { role: "system", content: SYSTEM },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Classify this screenshot and extract everything readable from it.",
              },
              {
                type: "image_url",
                image_url: { url: (data as any).imageDataUrl },
              },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "submit_screenshot",
              description: "Submit every detail read from the screenshot.",
              parameters: {
                type: "object",
                properties: {
                  kind: {
                    type: "string",
                    enum: ["odds", "comparison", "stats", "lineup", "other"],
                  },
                  home_team: { type: "string" },
                  away_team: { type: "string" },
                  league: { type: "string" },
                  kickoff_time: { type: "string" },
                  pinnacle: oddsSchema(),
                  books: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        book_name: { type: "string" },
                        odds: oddsSchema(),
                      },
                      required: ["book_name", "odds"],
                      additionalProperties: false,
                    },
                  },
                  notes: { type: "string" },
                  lineups: {
                    type: ["object", "null"],
                  },
                },
                required: ["kind", "home_team", "away_team", "league", "kickoff_time", "pinnacle", "books", "notes", "lineups"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "submit_screenshot" } },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Gemini API error: ${err}`);
    }

    const json = await res.json();
    const args = json.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) throw new Error("No data extracted from screenshot");

    const parsed = typeof args === "string"? JSON.parse(args) : args;
    return parsed as ImportedScreenshot;
  });
