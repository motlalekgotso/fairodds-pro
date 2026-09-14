import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  imageDataUrl: z.string().min(32).max(12_000_000),
});

const SYSTEM = `You read screenshots of football statistics pages (form tables, xG, head-to-head, injuries, line-ups, standings).
Summarise ONLY what is visible in the image as concise plain-text bullet lines suitable for a betting notes field.
Include team names, recent form, goals/xG numbers, head-to-head results, injuries and suspensions when visible.
Never invent numbers or facts that are not in the image. If the image contains no useful football statistics, return an empty string.`;

export const importStatsFromScreenshot = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }): Promise<{ notes: string }> => {
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
                text: "Summarise the football stats visible in this screenshot as short bullet lines.",
              },
              { type: "image_url", image_url: { url: data.imageDataUrl } },
            ],
          },
        ],
      }),
    });

    if (res.status === 429) throw new Error("Too many requests — try again in a moment.");
    if (res.status === 402) throw new Error("AI credits exhausted for this workspace.");
    if (!res.ok) throw new Error(`Could not read the screenshot (${res.status}).`);

    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = json.choices?.[0]?.message?.content;
    return { notes: typeof content === "string" ? content.trim() : "" };
  });
