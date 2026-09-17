import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  fixtures: z
    .array(
      z.object({
        id: z.string(),
        home_team: z.string(),
        away_team: z.string(),
        kickoff_time: z.string(),
      }),
    )
    .min(1)
    .max(40),
});

export interface FixtureResult {
  id: string;
  status: "finished" | "not_finished" | "not_found";
  home_goals: number | null;
  away_goals: number | null;
  matched: string | null;
}

function normalize(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\b(fc|cf|sc|ac|afc|club|deportivo|calcio|cd|ss|as|sv|bk|if)\b/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function similar(a: string, b: string) {
  const x = normalize(a);
  const y = normalize(b);
  if (!x || !y) return false;
  return x === y || x.includes(y) || y.includes(x);
}

function dayKey(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function addDays(day: string, n: number) {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

interface ApiMatch {
  status: string;
  homeTeam?: { name?: string; shortName?: string };
  awayTeam?: { name?: string; shortName?: string };
  score?: { fullTime?: { home?: number | null; away?: number | null } };
}

/** Look up real match results for the given fixtures. */
export const checkResults = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }): Promise<{ results: FixtureResult[] }> => {
    const token = process.env["FOOTBALL_DATA_API_KEY"];
    if (!token) {
      throw new Error(
        "Live results are not configured yet — add your results service key first.",
      );
    }

    // Collect the days we need (kickoff day plus a day either side for timezones).
    const days = new Set<string>();
    for (const f of data.fixtures) {
      const day = dayKey(f.kickoff_time);
      if (!day) continue;
      days.add(addDays(day, -1));
      days.add(day);
      days.add(addDays(day, 1));
    }

    const byDay = new Map<string, ApiMatch[]>();
    for (const day of days) {
      const res = await fetch(
        `https://api.football-data.org/v4/matches?date=${day}`,
        { headers: { "X-Auth-Token": token } },
      );
      if (res.status === 429) {
        throw new Error("Results service is rate limited — try again in a minute.");
      }
      if (res.status === 401 || res.status === 403) {
        throw new Error("Results service rejected the key — check it and try again.");
      }
      if (!res.ok) continue;
      const json = (await res.json()) as { matches?: ApiMatch[] };
      byDay.set(day, json.matches ?? []);
    }

    const all: ApiMatch[] = [];
    byDay.forEach((list) => all.push(...list));

    const results: FixtureResult[] = data.fixtures.map((f) => {
      const hit = all.find(
        (m) =>
          (similar(m.homeTeam?.name ?? "", f.home_team) ||
            similar(m.homeTeam?.shortName ?? "", f.home_team)) &&
          (similar(m.awayTeam?.name ?? "", f.away_team) ||
            similar(m.awayTeam?.shortName ?? "", f.away_team)),
      );
      if (!hit) {
        return {
          id: f.id,
          status: "not_found",
          home_goals: null,
          away_goals: null,
          matched: null,
        };
      }
      const finished = hit.status === "FINISHED";
      const home = hit.score?.fullTime?.home;
      const away = hit.score?.fullTime?.away;
      return {
        id: f.id,
        status:
          finished && typeof home === "number" && typeof away === "number"
            ? "finished"
            : "not_finished",
        home_goals: typeof home === "number" ? home : null,
        away_goals: typeof away === "number" ? away : null,
        matched: `${hit.homeTeam?.name ?? "?"} v ${hit.awayTeam?.name ?? "?"}`,
      };
    });

    return { results };
  });
