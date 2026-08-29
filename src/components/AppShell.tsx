import { Link } from "@tanstack/react-router";
import { Switch } from "@/components/ui/switch";
import { useStore } from "@/lib/betting/store";
import type { ReactNode } from "react";

const nav = [
  { to: "/", label: "Dashboard" },
  { to: "/add", label: "Add Match" },
  { to: "/ticket", label: "Banker Ticket" },
  { to: "/ledger", label: "Ledger" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { highProbMode, setHighProbMode, slip } = useStore();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-edge bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3">
          <Link to="/" className="flex items-baseline gap-2">
            <span className="text-base font-bold tracking-tight">BetAnalyser</span>
            <span className="tabular rounded border border-positive/40 bg-positive/12 px-1.5 text-[10px] font-bold uppercase text-positive">
              Pro
            </span>
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="rounded px-2.5 py-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                activeOptions={{ exact: n.to === "/" }}
                activeProps={{ className: "bg-secondary text-foreground" }}
              >
                {n.label}
                {n.to === "/ticket" && slip.length > 0 ? (
                  <span className="tabular ml-1.5 text-positive">{slip.length}</span>
                ) : null}
              </Link>
            ))}
          </nav>
          <label className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
            <span className="hidden sm:inline">High-probability mode</span>
            <span className="sm:hidden">High-prob</span>
            <Switch checked={highProbMode} onCheckedChange={setHighProbMode} />
          </label>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
