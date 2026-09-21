import { createServerFn } from "@tanstack/react-start";
type Input = { images: string[] };
export const scanMarketFn = createServerFn({ method: "POST" })
.inputValidator((d: Input) => d)
.handler(async ({ data }) => {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("Add OPENROUTER_API_KEY in Vercel env vars");
  const parts = data.images.map(b => ({ type: "image_url" as const, image_url: { url: b } }));
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}`, "HTTP-Referer": "https://fairodds.app", "X-Title": "FairOdds Academy" },
    body: JSON.stringify({
      model: "qwen/qwen2.5-vl-72b-instruct:free",
      messages: [{ role: "user", content: [{ type: "text", text: `Scan all screenshots TOGETHER. Return ONLY JSON: {"fixtures":[{"homeTeam":"","awayTeam":"","league":""}],"sharpPrices":[],"marketPrices":[],"analytics":[],"lineups":[]}` },...parts] }]
    })
  });
  if (!res.ok) throw new Error(await res.text());
  const j = await res.json();
  const raw = j.choices?.[0]?.message?.content || "{}";
  const clean = raw.replace(/```json|```/g, "").trim();
  try { return JSON.parse(clean); } catch { return { fixtures: [], sharpPrices: [], marketPrices: [], analytics: [], lineups: [] }; }
});
