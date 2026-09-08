import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  imageDataUrl: z.string().min(32).max(12_000_000),
});

const MARKETS = [
  "home_win",
  "draw",
  "away_win",
  "btts_yes",
  "btts_no",
  "over_2_5",
  "under_2_5",
] as const;

export interface ImportedBook {
  book_name: string;
  odds: Partial<Record<(typeof MARKETS)[number], number>>;
}

export interface ImportedOdds {
  home_team: string;
  away_team: string;
  league: string;
  kickoff_time: string;
  pinnacle: Partial<Record<(typeof MARKETS)[number], number>>;
  books: ImportedBook[];
  notes: string;
}

const SYSTEM = `You read screenshots of football betting odds pages and extract structured data.
Return decimal odds only (convert fractional or American odds to decimal). Use null for anything not visible.
Market keys: home_win, draw, away_win (1X2), btts_yes, btts_no (both teams to score), over_2_5, under_2_5 (total goals 2.5).
If a bookmaker column is named Pinnacle, put it in "pinnacle". All other bookmakers go into "books".
If only one set of odds is shown and no bookmaker name is visible, put it in "pinnacle" and name it accordingly.
Never invent odds that are not visible in the image.`;

export const importOddsFromScreenshot = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }): Promise<ImportedOdds> => {
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
                text: "Extract the fixture and every odds column you can read from this screenshot.",
              },
              { type: "image_url", image_url: { url: data.imageDataUrl } },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "submit_odds",
              description: "Submit the odds read from the screenshot.",
              parameters: {
                type: "object",
                properties: {
                  home_team: { type: "string" },
                  away_team: { type: "string" },
                  league: { type: "string" },
                  kickoff_time: {
                    type: "string",
                    description: "Kickoff as seen in the image, or empty string.",
                  },
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
                  notes: {
                    type: "string",
                    description: "Any form/stats text visible in the image.",
                  },
                },
                required: ["home_team", "away_team", "pinnacle", "books"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "submit_odds" } },
      }),
    });

    if (res.status === 429) throw new Error("Too many requests — try again in a moment.");
    if (res.status === 402) throw new Error("AI credits exhausted for this workspace.");
    if (!res.ok) throw new Error(`Could not read the screenshot (${res.status}).`);

    const json = (await res.json()) as {
      choices?: { message?: { tool_calls?: { function?: { arguments?: string } }[] } }[];
    };
    const raw = json.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!raw) throw new Error("No odds could be read from that image.");

    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return {
      home_team: str(parsed["home_team"]),
      away_team: str(parsed["away_team"]),
      league: str(parsed["league"]),
      kickoff_time: str(parsed["kickoff_time"]),
      pinnacle: cleanOdds(parsed["pinnacle"]),
      books: Array.isArray(parsed["books"])
        ? parsed["books"].map((b) => {
            const rec = (b ?? {}) as Record<string, unknown>;
            return {
              book_name: str(rec["book_name"]) || "Retail",
              odds: cleanOdds(rec["odds"]),
            };
          })
        : [],
      notes: str(parsed["notes"]),
    };
  });

function oddsSchema() {
  const props: Record<string, { type: string[] }> = {};
  for (const m of MARKETS) props[m] = { type: ["number", "null"] };
  return { type: "object", properties: props, additionalProperties: false };
}

function str(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

function cleanOdds(v: unknown) {
  const out: Partial<Record<(typeof MARKETS)[number], number>> = {};
  const rec = (v ?? {}) as Record<string, unknown>;
  for (const m of MARKETS) {
    const n = typeof rec[m] === "number" ? (rec[m] as number) : Number.NaN;
    if (Number.isFinite(n) && n > 1) out[m] = Math.round(n * 100) / 100;
  }
  return out;
}
