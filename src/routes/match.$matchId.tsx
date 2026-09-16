import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { RiskBadge, EVBadge } from "@/components/RiskBadge";
import { useStore } from "@/lib/betting/store";
import { analyzeMatch, bestRetail, MARKET_OF, selectionLabel } from "@/lib/betting/analysis";
import { lineupEdge, teamStrength } from "@/lib/betting/lineups";
import type { Leg, MarketKey } from "@/lib/betting/types";

export const Route = createFileRoute("/match/$matchId")({
  head: () => ({
    meta: [
      { title: "Match analysis — BetAnalyser Pro" },
      {
        name: "description",
        content:
          "Most probable, safest and best-value outcomes with a full risk-score breakdown.",
      },
      { property: "og:title", content: "Match analysis — BetAnalyser Pro" },
      {
        property: "og:description",
        content: "Probable, safest and best-value outcomes with risk breakdown.",
      },
    ],
  }),
  component: MatchView,
});

function MatchView() {
  const { matchId } = Route.useParams();
  const { matches, slip, addLeg, removeMatch, highProbMode } = useStore();
  const navigate = useNavigate();
  const [openFactors, setOpenFactors] = useState(true);

  const match = matches.find((m) => m.id === matchId);
  const analysis = useMemo(
    () => (match ? analyzeMatch(match, slip) : null),
    [match, slip],
  );
  const edge = lineupEdge(match?.lineups);

  if (!match || !analysis) {
    return (
      <div className="rounded-lg border border-dashed border-edge p-10 text-center">
        <p className="text-sm text-muted-foreground">This match no longer exists.</p>
        <Button asChild className="mt-4">
          <Link to="/">Back to dashboard</Link>
        </Button>
      </div>
    );
  }

  function add(key: MarketKey, selection: string, probability: number) {
    if (!match) return;
    const retail = bestRetail(match, key);
    const leg: Leg = {
      id: crypto.randomUUID(),
      match_id: match.id,
      label: `${match.home_team} v ${match.away_team}`,
      market: MARKET_OF[key],
      key,
      selection,
      probability,
      odds: retail?.odds ?? 1 / probability,
      book: retail?.book ?? "Fair price",
      risk_score: analysis!.risk_score,
    };
    addLeg(leg);
    toast.success(`${selection} added to banker ticket`);
  }

  const inSlip = (key: MarketKey) =>
    slip.some((l) => l.match_id === match.id && l.key === key);

  const cards = [
    {
      title: "Most probable",
      outcome: analysis.most_probable_outcome,
      body: analysis.most_probable_outcome
        ? `Highest devigged fair probability across all entered markets.`
        : "Not enough odds entered.",
      extra: null as React.ReactNode,
    },
    {
      title: "Safest",
      outcome: analysis.safest_outcome,
      body: analysis.safest_outcome?.reasoning ?? "Not enough odds entered.",
      extra: null as React.ReactNode,
    },
    {
      title: "Best value",
      outcome: analysis.value_outcome,
      body: analysis.value_outcome
        ? `${analysis.value_outcome.retail_book} at ${analysis.value_outcome.retail_odds.toFixed(2)} vs fair ${(analysis.value_outcome.fair_prob * 100).toFixed(1)}%.`
        : "No retail price clears the +2% EV threshold.",
      extra: analysis.value_outcome ? (
        <EVBadge ev={analysis.value_outcome.ev_percent} />
      ) : null,
    },
  ];

  const ordered = highProbMode ? cards : [...cards].reverse();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            {match.home_team} <span className="text-muted-foreground">v</span>{" "}
            {match.away_team}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {match.league}
            {match.kickoff_time
              ? ` · ${new Date(match.kickoff_time).toLocaleString()}`
              : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <RiskBadge score={analysis.risk_score} label={analysis.risk_label} />
          <Button
            variant="ghost"
            onClick={() => {
              removeMatch(match.id);
              navigate({ to: "/" });
            }}
          >
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        {ordered.map((c) => (
          <div key={c.title} className="flex flex-col rounded-lg border border-edge bg-card p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {c.title}
              </h2>
              {c.extra}
            </div>
            {c.outcome ? (
              <>
                <div className="mt-3 text-lg font-semibold">{c.outcome.selection}</div>
                <div className="tabular mt-1 text-3xl font-bold text-positive">
                  {(c.outcome.probability * 100).toFixed(1)}%
                </div>
                <p className="mt-3 flex-1 text-xs leading-relaxed text-muted-foreground">
                  {c.body}
                </p>
                <Button
                  className="mt-4"
                  variant={inSlip(c.outcome.key) ? "secondary" : "default"}
                  disabled={inSlip(c.outcome.key)}
                  onClick={() =>
                    add(c.outcome!.key, c.outcome!.selection, c.outcome!.probability)
                  }
                >
                  {inSlip(c.outcome.key) ? "In banker ticket" : "Add to banker ticket"}
                </Button>
              </>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">{c.body}</p>
            )}
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-edge bg-card p-5">
        <button
          type="button"
          onClick={() => setOpenFactors((v) => !v)}
          className="flex w-full items-center justify-between text-left"
        >
          <span className="text-sm font-semibold">
            Risk score {analysis.risk_score.toFixed(1)}/10 · {analysis.risk_label}
          </span>
          <span className="text-xs text-muted-foreground">
            {openFactors ? "Hide" : "Show"} breakdown
          </span>
        </button>
        {openFactors ? (
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            {analysis.risk_factors.map((f, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-muted-foreground/50">—</span>
                <span>{f}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="rounded-lg border border-edge bg-card p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider">
          All markets — safest to longest
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Every market the odds cover, including double chance and draw no bet derived
          from the sharp 1X2 book.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-edge text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="pb-2 pr-4 font-medium">Selection</th>
                <th className="pb-2 pr-4 font-medium">Fair %</th>
                <th className="pb-2 pr-4 font-medium">Fair odds</th>
                <th className="pb-2 pr-4 font-medium">Best retail</th>
                <th className="pb-2 pr-4 font-medium">EV</th>
                <th className="pb-2 font-medium sr-only">Add</th>
              </tr>
            </thead>
            <tbody>
              {(Object.keys(analysis.fair_probabilities) as MarketKey[])
                .sort(
                  (a, b) =>
                    (analysis.fair_probabilities[b] as number) -
                    (analysis.fair_probabilities[a] as number),
                )
                .map((k) => {
                  const p = analysis.fair_probabilities[k] as number;
                  const retail = bestRetail(match, k);
                  const ev = retail ? (p * retail.odds - 1) * 100 : null;
                  return (
                    <tr key={k} className="border-b border-edge/60 last:border-0">
                      <td className="py-2 pr-4">
                        {selectionLabel(k, match)}
                        <span className="ml-2 text-xs text-muted-foreground">
                          {MARKET_OF[k]}
                        </span>
                      </td>
                      <td className="tabular py-2 pr-4">{(p * 100).toFixed(1)}%</td>
                      <td className="tabular py-2 pr-4">{(1 / p).toFixed(2)}</td>
                      <td className="tabular py-2 pr-4">
                        {retail ? `${retail.odds.toFixed(2)} · ${retail.book}` : "—"}
                      </td>
                      <td
                        className={`tabular py-2 pr-4 ${ev !== null && ev > 2 ? "text-positive" : "text-muted-foreground"}`}
                      >
                        {ev === null ? "—" : `${ev > 0 ? "+" : ""}${ev.toFixed(2)}%`}
                      </td>
                      <td className="py-2 text-right">
                        <Button
                          size="sm"
                          variant={inSlip(k) ? "secondary" : "ghost"}
                          disabled={inSlip(k)}
                          onClick={() => add(k, selectionLabel(k, match), p)}
                        >
                          {inSlip(k) ? "Added" : "Add"}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>


      {match.lineups ? (
        <div className="rounded-lg border border-edge bg-card p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider">
              Line-ups & team quality
            </h2>
            {edge ? (
              <span className="tabular text-xs text-muted-foreground">
                {edge.diff >= 0 ? match.home_team : match.away_team} stronger by{" "}
                <span className="text-positive">{Math.abs(edge.pct).toFixed(1)}%</span>
              </span>
            ) : null}
          </div>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            {[match.lineups.home, match.lineups.away].map((side, idx) => {
              const strength = teamStrength(side);
              return (
                <div key={idx} className="min-w-0 flex-1 rounded-md border border-edge p-4">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="truncate text-sm font-semibold">
                      {side.team || (idx === 0 ? match.home_team : match.away_team)}
                    </h3>
                    {side.formation ? (
                      <span className="text-xs text-muted-foreground">
                        {side.formation}
                      </span>
                    ) : null}
                  </div>
                  {strength !== null ? (
                    <p className="tabular mt-1 text-xs text-muted-foreground">
                      Squad quality {strength.toFixed(2)}
                    </p>
                  ) : null}
                  <ul className="mt-3 space-y-1 text-xs">
                    {side.players.map((p, i) => (
                      <li key={i} className="flex items-baseline justify-between gap-3">
                        <span className="truncate">
                          {p.name}
                          {p.position ? (
                            <span className="ml-1 text-muted-foreground">
                              {p.position}
                            </span>
                          ) : null}
                        </span>
                        <span className="tabular shrink-0 text-muted-foreground">
                          {[
                            p.rating !== undefined ? p.rating.toFixed(2) : null,
                            p.goals !== undefined ? `${p.goals}G` : null,
                            p.assists !== undefined ? `${p.assists}A` : null,
                            p.xg !== undefined ? `${p.xg.toFixed(2)}xG` : null,
                            p.xa !== undefined ? `${p.xa.toFixed(2)}xA` : null,
                          ]
                            .filter(Boolean)
                            .join(" · ") || "—"}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {match.stats_notes.trim() ? (
        <div className="rounded-lg border border-edge bg-card p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider">Stats notes</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">
            {match.stats_notes}
          </p>
        </div>
      ) : null}
    </div>
  );
}
