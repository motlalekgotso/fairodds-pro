import { Link, useLocation } from "@tanstack/react-router"

export default function AppShell({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const pathname = location.pathname

  const navItems = [
    { path: "/", label: "Lab", icon: "🧪" },
    { path: "/academy", label: "Academy", icon: "🎓" },
    { path: "/ticket", label: "Ticket", icon: "🎟️" },
    { path: "/settings", label: "Settings", icon: "⚙️" },
  ]

  return (
    <div style={{ minHeight: "100vh", background: "#050A14", color: "#fff" }}>
      <header style={{ position: "sticky", top: 0, background: "rgba(5,10,20,0.9)", borderBottom: "1px solid rgba(255,255,255,0.1)", padding: 12, zIndex: 10 }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link to="/" style={{ display: "flex", gap: 8, alignItems: "center", textDecoration: "none", color: "#fff" }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "#FFD60A", color: "#000", fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center" }}>F</div>
            <div>
              <div style={{ fontWeight: 900, fontSize: 14, lineHeight: 1 }}>FAIRODDS</div>
              <div style={{ fontSize: 7, letterSpacing: 2, opacity: 0.4 }}>DON&apos;T GAMBLE. CALCULATE.</div>
            </div>
          </Link>
          <div style={{ fontSize: 9, padding: "4px 8px", borderRadius: 20, background: "rgba(255,214,10,0.15)", border: "1px solid rgba(255,214,10,0.2)", color: "#FFD60A" }}>UNIVERSITY</div>
        </div>
      </header>

      <main style={{ maxWidth: 1000, margin: "0 auto", padding: 24, paddingBottom: 100 }}>
        {children}
      </main>

      <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#0A0E1A", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr" }}>
          {navItems.map((item) => {
            const isActive = pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  padding: 12,
                  textDecoration: "none",
                  color: isActive ? "#FFD60A" : "rgba(255,255,255,0.4)",
                }}
              >
                <span style={{ fontSize: 18 }}>{item.icon}</span>
                <span style={{ fontSize: 10, marginTop: 4, fontWeight: 700 }}>{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
