import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/lib/betting/store";
import type { Ticket } from "@/lib/betting/types";

export const Route = createFileRoute("/ledger")({
  head: () => ({
    meta: [
      { title: "Leg Tracker & Ledger — BetAnalyser Pro" },
      {
        name: "description",
        content:
          "Track every finalised ticket with stake, result, running ROI and a bankroll summary.",
      },
      { property: "og:title", content: "Leg Tracker & Ledger — BetAnalyser Pro" },
      {
        property: "og:description",
        content: "Stake, result, running ROI and bankroll summary for every ticket.",
      },
    ],
  }),
  component: Ledger,
});

const FILTERS = ["all", "pending", "won", "lost"] as const;

function Ledger() {
  const { tickets, setTicketStatus } = useStore();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const filtered = useMemo(
    () =>
      tickets.filter((t) => {
        if (filter !== "all" && t.status !== filter) return false;
        const d = t.created_at.slice(0, 10);
        if (from && d < from) return false;
        if (to && d > to) return false;
        return true;
      }),
    [tickets, filter, from, to],
  );

  const settled = filtered.filter((t) => t.status !== "pending");
  const staked = filtered.reduce((a, t) => a + t.stake, 0);
  const returned = filtered.reduce((a, t) => a + t.payout, 0);
  const settledStake = settled.reduce((a, t) => a + t.stake, 0);
  const net = returned - settledStake;
  const roi = settledStake ? (net / settledStake) * 100 : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Leg tracker &amp; ledger</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every finalised ticket, its legs and running return on investment.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <Metric label="Total staked" value={staked.toFixed(2)} />
        <Metric label="Total returned" value={returned.toFixed(2)} />
        <Metric label="Net" value={`${net >= 0 ? "+" : ""}${net.toFixed(2)}`} tone={net} />
        <Metric
          label="ROI (settled)"
          value={`${roi >= 0 ? "+" : ""}${roi.toFixed(1)}%`}
          tone={roi}
        />
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-edge bg-surface/60 p-4">
        <div className="flex gap-1">
          {FILTERS.map((f) => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? "default" : "secondary"}
              onClick={() => setFilter(f)}
              className="capitalize"
            >
              {f}
            </Button>
          ))}
        </div>
        <div className="space-y-1.5">
          <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
            From
          </Label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
            To
          </Label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-edge p-10 text-center text-sm text-muted-foreground">
          No tickets match this view.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((t) => (
            <TicketRow key={t.id} ticket={t} onStatus={setTicketStatus} />
          ))}
        </div>
      )}
    </div>
  );
}

function TicketRow({
  ticket,
  onStatus,
}: {
  ticket: Ticket;
  onStatus: (id: string, s: Ticket["status"]) => void;
}) {
  const tone =
    ticket.status === "won"
      ? "text-positive"
      : ticket.status === "lost"
        ? "text-danger"
        : "text-warning";
  return (
    <div className="rounded-lg border border-edge bg-card">
      <div className="flex flex-wrap items-center gap-4 border-b border-edge px-4 py-3">
        <div className="tabular text-xs text-muted-foreground">
          {new Date(ticket.created_at).toLocaleDateString()}
        </div>
        <div className="text-sm font-semibold">
          {ticket.legs.length} leg{ticket.legs.length > 1 ? "s" : ""}
        </div>
        <div className="tabular text-sm">
          @ {ticket.combined_odds.toFixed(2)}{" "}
          <span className="text-muted-foreground">
            ({(ticket.combined_probability * 100).toFixed(2)}%)
          </span>
        </div>
        <div className="tabular text-sm text-muted-foreground">
          stake {ticket.stake.toFixed(2)}
        </div>
        <div className={`tabular text-sm font-semibold uppercase ${tone}`}>
          {ticket.status}
          {ticket.status === "won" ? ` · +${ticket.payout.toFixed(2)}` : ""}
        </div>
        <div className="ml-auto flex gap-1">
          {(["pending", "won", "lost"] as const).map((s) => (
            <Button
              key={s}
              size="sm"
              variant={ticket.status === s ? "default" : "ghost"}
              onClick={() => onStatus(ticket.id, s)}
              className="capitalize"
            >
              {s}
            </Button>
          ))}
        </div>
      </div>
      <div className="divide-y divide-edge/60">
        {ticket.legs.map((l) => (
          <div
            key={l.id}
            className="flex flex-wrap items-center gap-3 px-4 py-2 text-sm"
          >
            <span className="min-w-0 flex-1 truncate text-muted-foreground">
              {l.label}
            </span>
            <span>{l.selection}</span>
            <span className="text-xs text-muted-foreground">{l.book}</span>
            <span className="tabular w-14 text-right">{l.odds.toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: number;
}) {
  const color =
    tone === undefined ? "" : tone > 0 ? "text-positive" : tone < 0 ? "text-danger" : "";
  return (
    <div className="rounded-lg border border-edge bg-surface/60 p-4">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className={`tabular mt-1 text-xl font-bold ${color}`}>{value}</div>
    </div>
  );
}
