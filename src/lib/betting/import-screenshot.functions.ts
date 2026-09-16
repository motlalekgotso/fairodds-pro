import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { LineupPlayer, Lineups, MarketKey, TeamLineup } from "./types";

const InputSchema = z.object({
  imageDataUrl: z.string().min(32).max(12_000_000),
});

const MARKETS: MarketKey[] = [
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
];

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
  lineups: Lineups | null;
}

const SYSTEM = `You read screenshots related to a football match and extract whatever is visible.
First classify the screenshot with "kind":
- "odds": a sportsbook page showing one book's prices (e.g. Pinnacle).
- "comparison": an odds comparison table across several bookmakers (e.g. OddsPortal).
- "stats": form tables, xG, head-to-head, standings, injuries (e.g. FBref, Understat).
- "lineup": starting XI / line-up / squad or player-statistics tables (e.g. FBref player tables).
- "other": anything else.

Odds: decimal only (convert fractional/American). Market keys: home_win, draw, away_win (1X2),
btts_yes, btts_no, over_2_5, under_2_5. A column named Pinnacle goes into "pinnacle"; other
bookmakers go into "books". If a single unlabelled set of prices is shown, treat it as "pinnacle".

Stats: put a concise plain-text bullet summary of any visible statistics into "notes"
(form, goals, xG, head-to-head, injuries, suspensions). Never invent numbers.

Line-ups / player tables: fill "lineups" with the home and away teams, formation if shown, and each
player with the numeric per-player stats visible (FBref style: minutes, goals, assists, xG, xA,
match rating). Omit any field that is not visible. If only one team is shown, fill just that side and
leave the other side's players empty.

Never invent anything that is not readable in the image.`;

export const importScreenshot = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }): Promise<ImportedScreenshot> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("AI is not configured for this project.");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.7-flash",
        messages: [
          { role: "system", content: SYSTEM },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Classify this screenshot and extract everything readable from it.",
              },
              { type: "image_url", image_url: { url: data.imageDataUrl } },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "submit_screenshot",
              description: "Submit everything read from the screenshot.",
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
                    properties: {
                      home: teamSchema(),
                      away: teamSchema(),
                    },
                    additionalProperties: false,
                  },
                },
                required: ["kind"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "submit_screenshot" } },
      }),
    });

    if (res.status === 429) throw new Error("Too many requests — try again in a moment.");
    if (res.status === 402) throw new Error("AI credits exhausted for this workspace.");
    if (!res.ok) throw new Error(`Could not read the screenshot (${res.status}).`);

    const json = (await res.json()) as {
      choices?: { message?: { tool_calls?: { function?: { arguments?: string } }[] } }[];
    };
    const raw = json.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!raw) throw new Error("Nothing could be read from that image.");

    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const kinds: ScreenshotKind[] = ["odds", "comparison", "stats", "lineup", "other"];
    const kindRaw = str(parsed["kind"]) as ScreenshotKind;

    return {
      kind: kinds.includes(kindRaw) ? kindRaw : "other",
      home_team: str(parsed["home_team"]),
      away_team: str(parsed["away_team"]),
      league: str(parsed["league"]),
      kickoff_time: str(parsed["kickoff_time"]),
      pinnacle: cleanOdds(parsed["pinnacle"]),
      books: Array.isArray(parsed["books"])
        ? parsed["books"]
            .map((b) => {
              const rec = (b ?? {}) as Record<string, unknown>;
              return {
                book_name: str(rec["book_name"]) || "Retail",
                odds: cleanOdds(rec["odds"]),
              };
            })
            .filter((b) => Object.keys(b.odds).length > 0)
        : [],
      notes: str(parsed["notes"]),
      lineups: cleanLineups(parsed["lineups"]),
    };
  });

function oddsSchema() {
  const props: Record<string, { type: string[] }> = {};
  for (const m of MARKETS) props[m] = { type: ["number", "null"] };
  return { type: "object", properties: props, additionalProperties: false };
}

function teamSchema() {
  return {
    type: "object",
    properties: {
      team: { type: "string" },
      formation: { type: "string" },
      players: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            position: { type: "string" },
            minutes: { type: ["number", "null"] },
            goals: { type: ["number", "null"] },
            assists: { type: ["number", "null"] },
            xg: { type: ["number", "null"] },
            xa: { type: ["number", "null"] },
            rating: { type: ["number", "null"] },
          },
          required: ["name"],
          additionalProperties: false,
        },
      },
    },
    required: ["team", "players"],
    additionalProperties: false,
  };
}

function str(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

function num(v: unknown): number | undefined {
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

function cleanOdds(v: unknown) {
  const out: Partial<Record<MarketKey, number>> = {};
  const rec = (v ?? {}) as Record<string, unknown>;
  for (const m of MARKETS) {
    const n = typeof rec[m] === "number" ? (rec[m] as number) : Number.NaN;
    if (Number.isFinite(n) && n > 1) out[m] = Math.round(n * 100) / 100;
  }
  return out;
}

function cleanTeam(v: unknown): TeamLineup {
  const rec = (v ?? {}) as Record<string, unknown>;
  const players: LineupPlayer[] = Array.isArray(rec["players"])
    ? rec["players"]
        .map((p) => {
          const r = (p ?? {}) as Record<string, unknown>;
          const player: LineupPlayer = { name: str(r["name"]) };
          const position = str(r["position"]);
          if (position) player.position = position;
          const fields = ["minutes", "goals", "assists", "xg", "xa", "rating"] as const;
          for (const f of fields) {
            const n = num(r[f]);
            if (n !== undefined) player[f] = n;
          }
          return player;
        })
        .filter((p) => p.name.length > 0)
    : [];
  const team: TeamLineup = { team: str(rec["team"]), players };
  const formation = str(rec["formation"]);
  if (formation) team.formation = formation;
  return team;
}

function cleanLineups(v: unknown): Lineups | null {
  if (!v || typeof v !== "object") return null;
  const rec = v as Record<string, unknown>;
  const home = cleanTeam(rec["home"]);
  const away = cleanTeam(rec["away"]);
  if (!home.players.length && !away.players.length) return null;
  return { home, away };
}
