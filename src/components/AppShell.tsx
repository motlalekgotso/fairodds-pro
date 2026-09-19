import { Link } from "@tanstack/react-router"

const nav = [
  { to: "/", label: "Dashboard" },
  { to: "/value", label: "Value Studies" },
  { to: "/ticket", label: "Study Ticket" },
  { to: "/ledger", label: "Learning Log" },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#05070A] text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0A0E1A]/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-[#0A0E1A] border-[2.5px] border-[#FFD600] flex items-center justify-center font-black text-[#FFD600] text-xl shadow-[0_0_15px_rgba(255,214,0,0.3)]">FA</div>
            <div className="flex flex-col leading-none">
              <span className="font-black text-white text-[17px] tracking-wide">FairOdds Academy</span>
              <span className="text-[8px] text-[#FFD600] tracking-[0.2em] uppercase font-bold mt-1">DON'T GAMBLE. CALCULATE.</span>
            </div>
          </Link>
          <nav className="flex items-center gap-3 ml-4">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="rounded px-3 py-2 text-sm text-white/70 hover:text-white"
                activeOptions={{ exact: n.to === "/" }}
                activeProps={{ className: "bg-white/10 text-white rounded px-3 py-2 text-sm" }}
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
