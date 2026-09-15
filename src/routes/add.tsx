import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useStore } from "@/lib/betting/store";
import { importScreenshot } from "@/lib/betting/import-screenshot.functions";
import { teamStrength } from "@/lib/betting/lineups";
import type { Lineups, MarketKey, Match, RetailBook, TeamLineup } from "@/lib/betting/types";

export const Route = createFileRoute("/add")({
  head: () => ({
    meta: [
      { title: "Add Match — BetAnalyser Pro" },
      {
        name: "description",
        content:
          "Drop any screenshots — odds, comparisons, stats or line-ups — and devig a new match.",
      },
      { property: "og:title", content: "Add Match — BetAnalyser Pro" },
      {
        property: "og:description",
        content: "Drop odds, stats and line-up screenshots to devig a new match.",
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

function Dropzone({
  busy,
  idle,
  busyLabel,
  buttonLabel,
  onFiles,
}: {
  busy: boolean;
  idle: string;
  busyLabel: string;
  buttonLabel: string;
  onFiles: (files: File[]) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const fs = Array.from(e.dataTransfer.files);
        if (fs.length) onFiles(fs);
      }}
      className="flex flex-col items-start gap-3 rounded-md border border-dashed border-edge p-6"
    >
      <p className="text-sm text-muted-foreground">{busy ? busyLabel : idle}</p>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          const fs = Array.from(e.target.files ?? []);
          if (fs.length) onFiles(fs);
          e.target.value = "";
        }}
      />
      <Button
        type="button"
        variant="secondary"
        disabled={busy}
        onClick={() => fileRef.current?.click()}
      >
        {busy ? "Reading…" : buttonLabel}
      </Button>
    </div>
  );
}

function mergeTeam(prev: TeamLineup | undefined, next: TeamLineup): TeamLineup {
  if (!prev || !prev.players.length) return next;
  if (!next.players.length) return prev;
  const players = [...prev.players];
  for (const p of next.players) {
    const i = players.findIndex(
      (x) => x.name.trim().toLowerCase() === p.name.trim().toLowerCase(),
    );
    if (i >= 0) players[i] = { ...p, ...players[i] };
    else players.push(p);
  }
  return {
    team: prev.team || next.team,
    ...(prev.formation || next.formation
      ? { formation: prev.formation || next.formation }
      : {}),
    players,
  };
}

function LineupTable({ side }: { side: TeamLineup }) {
  const strength = teamStrength(side);
  return (
    <div className="min-w-0 flex-1 rounded-md border border-edge p-4">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="truncate text-sm font-semibold">{side.team || "Team"}</h3>
        {side.formation ? (
          <span className="text-xs text-muted-foreground">{side.formation}</span>
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
                <span className="ml-1 text-muted-foreground">{p.position}</span>
              ) : null}
            </span>
            <span className="tabular shrink-0 text-muted-foreground">
              {[
                p.rating !== undefined ? `${p.rating.toFixed(2)}` : null,
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
  const [lineups, setLineups] = useState<Lineups | null>(null);
  const [reading, setReading] = useState(false);
  const runImport = useServerFn(importScreenshot);

  function toForm(odds: Partial<Record<MarketKey, number>>): OddsForm {
    const out: OddsForm = {};
    for (const { key } of ODDS_FIELDS) {
      const v = odds[key];
      if (typeof v === "number") out[key] = String(v);
    }
    return out;
  }

  function validImages(input: File[]) {
    const files = input.filter((f) => f.type.startsWith("image/"));
    if (!files.length) {
      toast.error("Those files aren't images");
      return null;
    }
    if (files.some((f) => f.size > 8_000_000)) {
      toast.error("Each image must be under 8MB");
      return null;
    }
    return files;
  }

  function readDataUrl(file: File) {
    return new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = () => reject(new Error("Could not read that file"));
      r.readAsDataURL(file);
    });
  }

  function mergeBooks(
    imported: { book_name: string; odds: Partial<Record<MarketKey, number>> }[],
  ) {
    setBooks((s) => {
      const next = s.filter((b) => b.name.trim() || Object.keys(b.odds).length);
      for (const b of imported) {
        const i = next.findIndex(
          (x) => x.name.trim().toLowerCase() === b.book_name.trim().toLowerCase(),
        );
        const odds = toForm(b.odds);
        if (i >= 0) {
          const prev = next[i]!;
          next[i] = { ...prev, odds: { ...odds, ...prev.odds } };
        } else {
          next.push({ name: b.book_name, odds });
        }
      }
      return next.length ? next : [{ name: "", odds: {} }];
    });
  }

  async function handleScreenshots(input: File[]) {
    const files = validImages(input);
    if (!files) return;
    setReading(true);
    let prices = 0;
    let statShots = 0;
    let lineupShots = 0;
    try {
      for (const file of files) {
        const dataUrl = await readDataUrl(file);
        const r = await runImport({ data: { imageDataUrl: dataUrl } });

        if (r.home_team) setHome((v) => v || r.home_team);
        if (r.away_team) setAway((v) => v || r.away_team);
        if (r.league) setLeague((v) => v || r.league);

        if (Object.keys(r.pinnacle).length) {
          prices += Object.keys(r.pinnacle).length;
          if (r.kind === "comparison") {
            mergeBooks([{ book_name: "Pinnacle", odds: r.pinnacle }]);
          } else {
            setPinnacle((s) => ({ ...toForm(r.pinnacle), ...s }));
          }
        }

        if (r.books.length) {
          prices += r.books.reduce((a, b) => a + Object.keys(b.odds).length, 0);
          mergeBooks(r.books);
        }

        if (r.notes) {
          statShots += 1;
          setNotes((n) => (n.includes(r.notes) ? n : [n.trim(), r.notes].filter(Boolean).join("\n\n")));
        }

        if (r.lineups) {
          lineupShots += 1;
          const incoming = r.lineups;
          setLineups((s) => ({
            home: mergeTeam(s?.home, incoming.home),
            away: mergeTeam(s?.away, incoming.away),
          }));
        }
      }

      const parts = [
        prices ? `${prices} prices` : null,
        statShots ? `${statShots} stats screenshot${statShots > 1 ? "s" : ""}` : null,
        lineupShots ? `${lineupShots} line-up${lineupShots > 1 ? "s" : ""}` : null,
      ].filter(Boolean);

      if (!parts.length) toast.error("Nothing readable was found in those screenshots");
      else toast.success(`Read ${parts.join(", ")} — check them before analysing`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not read that screenshot");
    } finally {
      setReading(false);
    }
  }

  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      const files = Array.from(e.clipboardData?.items ?? [])
        .filter((i) => i.type.startsWith("image/"))
        .map((i) => i.getAsFile())
        .filter((f): f is File => !!f);
      if (files.length) void handleScreenshots(files);
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      lineups,
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

      <Section
        title="Screenshots"
        hint="Drop everything here — sharp odds, comparison tables, FBref stats and line-ups. Each image is sorted into the right section below."
      >
        <Dropzone
          busy={reading}
          busyLabel="Reading and sorting the screenshots…"
          idle="Drag images here, paste with Ctrl+V, or choose files. Odds, stats and line-up screenshots can all go in together."
          buttonLabel="Choose screenshots"
          onFiles={(fs) => void handleScreenshots(fs)}
        />
      </Section>

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
        title="Line-ups & player quality"
        hint="Read from line-up or FBref player screenshots — used to compare squad quality."
      >
        {lineups ? (
          <div className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row">
              <LineupTable side={lineups.home} />
              <LineupTable side={lineups.away} />
            </div>
            <Button type="button" variant="ghost" onClick={() => setLineups(null)}>
              Clear line-ups
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No line-ups read yet — drop a starting XI or FBref player table above.
          </p>
        )}
      </Section>

      <Section
        title="Stats notes"
        hint="Form, injuries, head-to-head. Leaving this empty raises the risk score."
      >
        <Textarea
          rows={6}
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
