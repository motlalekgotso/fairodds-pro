import { createServerFn } from "@tanstack/react-start";

type ImportInput = {
  images: string[];
};

export const importScreenshotsFn = createServerFn({ method: "POST" })
.inputValidator((data: ImportInput) => data)
.handler(async ({ data }) => {
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) throw new Error("Missing GEMINI_API_KEY");

    const imageParts = data.images.map((base64) => ({
      type: "image_url" as const,
      image_url: { url: base64 },
    }));

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gemini-2.0-flash",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Extract matches from screenshots. Return ONLY JSON array: [{"homeTeam":"A","awayTeam":"B","homeOdds":2.1,"drawOdds":3.2,"awayOdds":2.8,"league":"Premier League"}]. Return [] if none.`,
                },
               ...imageParts,
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Gemini error ${response.status}: ${err}`);
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || "[]";
    const clean = content.replace(/```json|```/g, "").trim();
    try { return JSON.parse(clean); } catch { return []; }
  });
