import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Lineups, MarketKey } from "./types";

const InputSchema = z.object({
  imageDataUrl: z.string().min(32).max(12_000_000),
});

const MARKETS: MarketKey[] = [
  "home_win","draw","away_win",
  "dc_1x","dc_12","dc_x2",
  "dnb_home","dnb_away",
  "btts_yes","btts_no",
  "over_1_5","under_1_5",
  "over_2_5","under_2_5",
  "over_3_5","under_3_5"
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
Classify kind: "odds"=one book, "comparison"=many books, "stats"=xG/form, "lineup"=XI, "other".
Odds decimal only. Keys: home_win,draw,away_win,dc_1x,dc_12,dc_x2,dnb_home,dnb_away,btts_yes,btts_no,over_1_5,under_1_5,over_2_5,under_2_5,over_3_5,under_3_5.
If Pinnacle column visible -> pinnacle, others -> books. If single unlabelled -> pinnacle. Never invent numbers.`;

export const importScreenshot = createServerFn({ method: "POST" })
 .inputValidator((d: unknown) => InputSchema.parse(d))
 .handler(async ({ data }): Promise<ImportedScreenshot> => {
    const apiKey = process.env["GEMINI_API_KEY"];
    if (!apiKey) throw new Error("GEMINI_API_KEY missing - add it in Vercel");

    const res = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: [
            { type: "text", text: "Extract this screenshot as JSON ImportedScreenshot" },
            { type: "image_url", image_url: { url: (data as any).imageDataUrl } }
          ]}
        ],
        response_format: { type: "json_object" }
      })
    });

    if (!res.ok) {
      const t = await res.text();
      throw new Error(`Gemini error ${res.status}: ${t.slice(0,500)}`);
    }
    const j = await res.json();
    const content = j.choices?.[0]?.message?.content;
    if (!content) throw new Error("Empty AI response");
    try { return JSON.parse(content); } catch {
      const m = content.match(/\{[\s\S]*\}/);
      if (!m) throw new Error("Failed to parse JSON");
      return JSON.parse(m[0]);
    }
  });
