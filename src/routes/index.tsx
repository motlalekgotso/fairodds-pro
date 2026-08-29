import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useStore } from "@/lib/betting/store";
import { analyzeMatch } from "@/lib/betting/analysis";
import { RiskBadge, EVBadge } from "@/components/RiskBadge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — BetAnalyser Pro" },
      {
        name: "description",
        content:
          "All analysed matches with devigged probabilities, +EV picks and risk scores at a glance.",
      },
      { property: "og:title", content: "Dashboard — BetAnalyser Pro" },
      {
        property: "og:description",
        content: "Analysed matches, +EV picks and risk scores at a glance.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { matches, slip, tickets, highProbMode, hydrated } = useStore();

  const rows = useMemo(() => {
    const list = matches.map((m) => ({ match: m, analysis: analyzeMatch(m, slip) }));
    return list.sort((a, b) =>
      highProbMode
        ? (b.analysis.safest_outcome?.probability ?? 0) -
          (a.analysis.safest_outcome?.probability ?? 0)
        : (b.analysis.value_outcome?.ev_percent ?? -999) -
          (a.analysis.value_outcome?.ev_percent ?? -999),
    );
  }, [matches, slip, highProbMode]);

  const evCount = rows.filter((r) => r.analysis.value_outcome).length;
  const pending = tickets.filter((t) => t.status === "pending").length;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {highProbMode
              ? "High-probability lens — sorted by safest devigged outcome."
              : "Value lens — sorted by best expected value."}
          </p>
        </div>
        <Button asChild>
          <Link to="/add">Add Match</Link>
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Matches analysed" value={hydrated ? String(matches.length) : "—"} />
        <Stat
          label="Live +EV picks"
          value={hydrated ? String(evCount) : "—"}
          accent={evCount > 0}
        />
        <Stat
          label="Banker ticket"
          value={
            hydrated
              ? slip.length
                ? `${slip.length} leg${slip.length > 1 ? "s" : ""} building`
                : pending
                  ? `${pending} pending`
                  : "empty"
              : "—"
          }
        />
      </div>

      {hydrated && rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-edge bg-surface/40 p-10 text-center">
          <p className="text-sm text-muted-foreground">
            No matches yet. Add Pinnacle and retail odds to devig your first market.
          </p>
          <Button asChild className="mt-4">
            <Link to="/add">Add your first match</Link>
          </Button>
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2">
        {rows.map(({ match, analysis }) => (
          <Link
            key={match.id}
            to="/match/$matchId"
            params={{ matchId: match.id }}
            className="group rounded-lg border border-edge bg-card p-4 transition-colors hover:border-primary/50"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold">
                  {match.home_team} <span className="text-muted-foreground">v</span>{" "}
                  {match.away_team}
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {match.league}
                  {match.kickoff_time
                    ? ` · ${new Date(match.kickoff_time).toLocaleString()}`
                    : ""}
                </div>
              </div>
              <RiskBadge score={analysis.risk_score} label={analysis.risk_label} />
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  Safest
                </dt>
                <dd className="mt-0.5">
                  {analysis.safest_outcome ? (
                    <>
                      {analysis.safest_outcome.selection}{" "}
                      <span className="tabular text-muted-foreground">
                        {(analysis.safest_outcome.probability * 100).toFixed(1)}%
                      </span>
                    </>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  Best value
                </dt>
                <dd className="mt-0.5">
                  {analysis.value_outcome ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <span>{analysis.value_outcome.selection}</span>
                      <EVBadge ev={analysis.value_outcome.ev_percent} />
                    </div>
                  ) : (
                    <span className="text-muted-foreground">No +EV found</span>
                  )}
                </dd>
              </div>
            </dl>
          </Link>
        ))}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-lg border border-edge bg-surface/60 p-4">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div
        className={`tabular mt-1 text-xl font-semibold ${accent ? "text-positive" : ""}`}
      >
        {value}
      </div>
    </div>
  );
}
