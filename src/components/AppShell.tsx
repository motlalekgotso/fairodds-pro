import { Link, useLocation } from "@tanstack/react-router"
import type { ReactNode } from "react"

export function AppShell({ children }: { children: ReactNode }) {
  const loc = useLocation()
  const pathname = loc.pathname

  const items = [
    { to: "/", label: "Lab", icon: "🧪" },
    { to: "/academy", label: "Academy", icon: "🎓" },
    { to: "/ticket", label: "Ticket", icon: "🎟️" },
    { to: "/settings", label: "Settings", icon: "⚙️" },
  ]

  return (
    <div style={{ minHeight: "100vh", background: "#050A14", color: "#fff" }}>
      <header style={{ position: "sticky", top: 0, zIndex: 10, background: "#050A14", borderBottom: "1px solid rgba(255,255,255,0.1)", padding: 12 }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link to="/" style={{ color: "#fff", textDecoration: "none", display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ width: 32, height: 32, background: "#FFD60A", color: "#000", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900 }}>F</div>
            <div>
              <div style={{ fontWeight: 900, fontSize: 14 }}>FAIRODDS</div>
              <div style={{ fontSize: 7, opacity: 0.5, letterSpacing: 1 }}>DONT GAMBLE. CALCULATE.</div>
            </div>
          </Link>
          <div style={{ fontSize: 9, color: "#FFD60A", border: "1px solid rgba(255,214,10,0.3)", padding: "4px 8px", borderRadius: 20 }}>UNIVERSITY</div>
        </div>
      </header>

      <main style={{ maxWidth: 1000, margin: "0 auto", padding: 20, paddingBottom: 100 }}>
        {children}
      </main>

      <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#0A0E1A", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr" }}>
          {items.map((it) => {
            const active = pathname === it.to
            return (
              <Link
                key={it.to}
                to={it.to}
                style={{
                  padding: 12,
                  textAlign: "center",
                  textDecoration: "none",
                  color: active ? "#FFD60A" : "rgba(255,255,255,0.4)",
                  fontSize: 12,
                  fontWeight: active ? 900 : 400,
                }}
              >
                <div style={{ fontSize: 18 }}>{it.icon}</div>
                <div style={{ fontSize: 10, marginTop: 2 }}>{it.label}</div>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}

export default AppShell
