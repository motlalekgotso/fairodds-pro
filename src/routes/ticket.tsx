import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/lib/betting/store";
import { combineLegs } from "@/lib/betting/analysis";

export const Route = createFileRoute("/ticket")({
  head: () => ({
    meta: [
      { title: "Banker Ticket — BetAnalyser Pro" },
      {
        name: "description",
        content:
          "Combine trusted legs into a banker ticket with correlation-adjusted probability and combined odds.",
      },
      { property: "og:title", content: "Banker Ticket — BetAnalyser Pro" },
      {
        property: "og:description",
        content: "Correlation-aware combined probability and odds for your slip.",
      },
    ],
  }),
  component: TicketBuilder;
});

function TicketBuilder() {
  const { slip, removeLeg, clearSlip, finalizeTicket } = useStore();
  const [stake, setStake] = useState("10");

  const { combined_probability, combined_odds, correlated } = useMemo(
    () => combineLegs(slip),
    [slip],
  );

  if (!slip.length) {
    return (
      <div className="rounded-lg border border-dashed border-edge p-10 text-center">
        <h1 className="text-lg font-semibold">Banker ticket is empty</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Add outcomes from a match analysis to start building.
        </p>
        <Button asChild className="mt-4">
          <Link to="/">Browse matches</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Banker ticket</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {slip.length} leg{slip.length > 1 ? "s" : ""} · correlation-adjusted
          </p>
        </div>
        <Button variant="ghost" onClick={clearSlip}>
          Clear all
        </Button>
      </div>

      {correlated.length ? (
        <div className="rounded-lg border border-warning/40 bg-warning/10 p-4 text-sm text-warning">
          <div className="font-semibold">Correlated legs detected</div>
          <ul className="mt-2 space-y-1">
            {correlated.map(([a, b], i) => (
              <li key={i}>
                “{a.selection}” and “{b.selection}” on {a.label} overlap in outcome logic —
                treated with a 15% probability discount, not as independent events.
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="divide-y divide-edge rounded-lg border border-edge bg-card">
        {slip.map((l) => (
          <div key={l.id} className="flex flex-wrap items-center gap-3 p-4">
            <div className="min-w-0 flex-1">
              <div className="font-medium">{l.selection}</div>
              <div className="text-xs text-muted-foreground">
                {l.label} · {l.market} · {l.book}
              </div>
            </div>
            <div className="tabular text-sm text-muted-foreground">
              {(l.probability * 100).toFixed(1)}%
            </div>
            <div className="tabular w-16 text-right font-semibold">{l.odds.toFixed(2)}</div>
            <Button variant="ghost" size="sm" onClick={() => removeLeg(l.id)}>
              Remove
            </Button>
          </div>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Metric
          label="Combined probability"
          value={`${(combined_probability * 100).toFixed(2)}%`}
        />
        <Metric label="Combined odds" value={combined_odds.toFixed(2)} accent />
        <Metric
          label="Potential return"
          value={(combined_odds * (parseFloat(stake) || 0)).toFixed(2)}
        />
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-edge bg-surface/60 p-5">
        <div className="w-32 space-y-1.5">
          <Label>Stake</Label>
          <Input
            className="tabular"
            inputMode="decimal"
            value={stake}
            onChange={(e) => setStake(e.target.value)}
          />
        </div>
        <Button
          size="lg"
          onClick={() => {
            finalizeTicket(parseFloat(stake) || 0);
            toast.success("Ticket finalised as pending");
          }}
        >
          Finalize ticket
        </Button>
      </div>
    </div>
  );
}

function Metric({
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
        className={`tabular mt-1 text-2xl font-bold ${accent ? "text-positive" : ""}`}
      >
        {value}
      </div>
    </div>
  );
}
