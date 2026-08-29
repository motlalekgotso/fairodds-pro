import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useStore } from "@/lib/betting/store";
import type { MarketKey, Match, RetailBook } from "@/lib/betting/types";

export const Route = createFileRoute("/add")({
  head: () => ({
    meta: [
      { title: "Add Match — BetAnalyser Pro" },
      {
        name: "description",
        content:
          "Enter Pinnacle and retail book odds, opening lines and stats notes to devig a new match.",
      },
      { property: "og:title", content: "Add Match — BetAnalyser Pro" },
      {
        property: "og:description",
        content: "Enter sharp and retail odds to devig a new match.",
      },
    ],
  }),
  component: AddMatch,
});

const ODDS_FIELDS: { key: MarketKey; label: string }[] = [
  { key: "home_win", label: "Home" },
  { key: "draw", label: "Draw" },
  { key: "away_win", label: "Away" },
  { key: "btts_yes", label: "BTTS Yes" },
  { key: "btts_no", label: "BTTS No" },
  { key: "over_2_5", label: "Over 2.5" },
  { key: "under_2_5", label: "Under 2.5" },
];

type OddsForm = Partial<Record<MarketKey, string>>;

function toNumbers(form: OddsForm) {
  const out: Partial<Record<MarketKey, number>> = {};
  for (const { key } of ODDS_FIELDS) {
    const v = parseFloat(form[key] ?? "");
    if (!Number.isNaN(v) && v > 1) out[key] = v;
  }
  return out;
}

function OddsRow({
  values,
  onChange,
}: {
  values: OddsForm;
  onChange: (key: MarketKey, value: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
      {ODDS_FIELDS.map((f) => (
        <div key={f.key} className="space-y-1.5">
          <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
            {f.label}
          </Label>
          <Input
            className="tabular"
            inputMode="decimal"
            placeholder="0.00"
            value={values[f.key] ?? ""}
            onChange={(e) => onChange(f.key, e.target.value)}
          />
        </div>
      ))}
    </div>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-edge bg-card p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wider">{title}</h2>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function AddMatch() {
  const { addMatch } = useStore();
  const navigate = useNavigate();

  const [home, setHome] = useState("");
  const [away, setAway] = useState("");
  const [league, setLeague] = useState("");
  const [kickoff, setKickoff] = useState("");
  const [pinnacle, setPinnacle] = useState<OddsForm>({});
  const [opening, setOpening] = useState<OddsForm>({});
  const [books, setBooks] = useState<{ name: string; odds: OddsForm }[]>([
    { name: "", odds: {} },
  ]);
  const [notes, setNotes] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!home.trim() || !away.trim()) {
      toast.error("Both team names are required");
      return;
    }
    const pin = toNumbers(pinnacle);
    if (Object.keys(pin).length < 2) {
      toast.error("Enter at least one complete Pinnacle market to devig");
      return;
    }
    const retail_odds: RetailBook[] = books
      .filter((b) => b.name.trim() || Object.keys(toNumbers(b.odds)).length)
      .map((b) => ({ book_name: b.name.trim() || "Retail", ...toNumbers(b.odds) }));

    const match: Match = {
      id: crypto.randomUUID(),
      home_team: home.trim(),
      away_team: away.trim(),
      league: league.trim() || "Unspecified league",
      kickoff_time: kickoff,
      pinnacle_odds: pin,
      opening_odds: toNumbers(opening),
      retail_odds,
      stats_notes: notes,
      created_at: new Date().toISOString(),
    };
    addMatch(match);
    toast.success("Match analysed");
    navigate({ to: "/match/$matchId", params: { matchId: match.id } });
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Add & analyse match</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pinnacle prices are devigged into fair probabilities; retail prices are checked
          for +EV.
        </p>
      </div>

      <Section title="Fixture">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label>Home team</Label>
            <Input value={home} onChange={(e) => setHome(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Away team</Label>
            <Input value={away} onChange={(e) => setAway(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>League</Label>
            <Input value={league} onChange={(e) => setLeague(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Kickoff</Label>
            <Input
              type="datetime-local"
              value={kickoff}
              onChange={(e) => setKickoff(e.target.value)}
            />
          </div>
        </div>
      </Section>

      <Section title="Pinnacle odds" hint="Sharp reference prices — used for devigging.">
        <OddsRow
          values={pinnacle}
          onChange={(k, v) => setPinnacle((s) => ({ ...s, [k]: v }))}
        />
      </Section>

      <Section
        title="Opening odds (optional)"
        hint="Pinnacle opener — enables line-movement risk detection."
      >
        <OddsRow
          values={opening}
          onChange={(k, v) => setOpening((s) => ({ ...s, [k]: v }))}
        />
      </Section>

      <Section title="Retail books" hint="Where you'd actually place the bet.">
        <div className="space-y-5">
          {books.map((b, i) => (
            <div key={i} className="space-y-3 border-l-2 border-edge pl-4">
              <div className="flex items-end gap-3">
                <div className="w-full max-w-xs space-y-1.5">
                  <Label>Book name</Label>
                  <Input
                    value={b.name}
                    placeholder="Bet365"
                    onChange={(e) =>
                      setBooks((s) =>
                        s.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)),
                      )
                    }
                  />
                </div>
                {books.length > 1 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setBooks((s) => s.filter((_, j) => j !== i))}
                  >
                    Remove
                  </Button>
                ) : null}
              </div>
              <OddsRow
                values={b.odds}
                onChange={(k, v) =>
                  setBooks((s) =>
                    s.map((x, j) => (j === i ? { ...x, odds: { ...x.odds, [k]: v } } : x)),
                  )
                }
              />
            </div>
          ))}
          <Button
            type="button"
            variant="secondary"
            onClick={() => setBooks((s) => [...s, { name: "", odds: {} }])}
          >
            Add another book
          </Button>
        </div>
      </Section>

      <Section
        title="Stats notes"
        hint="Form, injuries, head-to-head. Leaving this empty raises the risk score."
      >
        <Textarea
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Paste form / xG / injury notes from FBref or Understat…"
        />
      </Section>

      <Button type="submit" size="lg">
        Analyze
      </Button>
    </form>
  );
}
