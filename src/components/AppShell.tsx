import { Link } from "@tanstack/react-router"

const nav = [
  { to: "/", label: "Dashboard" },
  { to: "/value", label: "Value Bets" },
  { to: "/ticket", label: "Banker Ticket" },
  { to: "/ledger", label: "Ledger" },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#05070A] text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0A0E1A]/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-[#0A0E1A] border-2 border-[#FFD600] flex items-center justify-center font-black text-[#FFD600] text-xs">FA</div>
            <div className="flex flex-col leading-none">
              <span className="font-bold text-white text-sm">FairOdds Academy</span>
              <span className="text-[7px] text-[#FFD600] tracking-widest uppercase">Worlds First Betting Academy</span>
            </div>
          </Link>
          <nav className="flex items-center gap-2">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="rounded px-2.5 py-1.5 text-sm text-white/70 hover:text-white"
                activeOptions={{ exact: n.to === "/" }}
                activeProps={{ className: "bg-white/10 text-white rounded px-2.5 py-1.5 text-sm" }}
              >
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
