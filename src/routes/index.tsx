import { useState } from "react";

type Match = {
  id: string;
  home: string;
  away: string;
  risk: string;
  safest: string;
  safestPct: string;
  value: string;
};

export default function BetAnalyserPRO() {
  const [tab, setTab] = useState("Dashboard");
  const [matches] = useState<Match[]>([
    { id: "1", home: "Juventus", away: "NEC Nijmegen", risk: "6.5 MEDIUM RISK", safest: "Juventus or draw", safestPct: "91.8%", value: "No +EV found" },
    { id: "2", home: "Manchester City", away: "Norwich City", risk: "6.1 MEDIUM RISK", safest: "Manchester City win", safestPct: "83.9%", value: "No +EV found" },
    { id: "3", home: "Besiktas", away: "Marseille", risk: "6.3 MEDIUM RISK", safest: "Besiktas or draw", safestPct: "77.3%", value: "Best Value +1.2% EV" },
  ]);

  return (
    <div style={{ background: "#0a0a0a", minHeight: "100vh", color: "white", fontFamily: "sans-serif", padding: "16px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontWeight: 900, fontSize: 20 }}>BetAnalyser <span style={{ background: "#22c55e", color: "black", padding: "2px 8px", borderRadius: 6, fontSize: 12, marginLeft: 6 }}>PRO</span></div>
        <div style={{ background: "#1a1a1a", borderRadius: 20, padding: "4px 12px", fontSize: 12, border: "1px solid #333" }}>High-prob <span style={{ background: "#22c55e", padding: "2px 8px", borderRadius: 10, marginLeft: 6, color: "black" }}>ON</span></div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, overflowX: "auto", marginBottom: 16 }}>
        {["Dashboard", "Add Match", "Final Slip", "Banker Ticket", "Ledger"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ background: tab === t? "#333" : "#1a1a1a", color: "white", border: "1px solid #333", borderRadius: 20, padding: "8px 14px", fontSize: 13, whiteSpace: "nowrap" }}>{t}</button>
        ))}
      </div>

      {tab === "Dashboard" && (
        <>
          <div style={{ color: "#888", fontSize: 12, marginBottom: 12 }}>Dashboard — High-probability lens • sorted by safest devigged outcome</div>
          <button onClick={() => setTab("Add Match")} style={{ background: "#22c55e", color: "black", fontWeight: 700, border: 0, borderRadius: 20, padding: "10px 18px", marginBottom: 16 }}>+ Add Match</button>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
            <div style={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 12, padding: 12 }}><div style={{ fontSize: 11, color: "#888" }}>MATCHES ANALYSED</div><div style={{ fontSize: 22, fontWeight: 800 }}>12</div></div>
            <div style={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 12, padding: 12 }}><div style={{ fontSize: 11, color: "#888" }}>LIVE +EV PICKS</div><div style={{ fontSize: 22, fontWeight: 800, color: "#22c55e" }}>4</div></div>
            <div style={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 12, padding: 12 }}><div style={{ fontSize: 11, color: "#888" }}>BANKER TICKET</div><div style={{ fontSize: 12 }}>— empty —</div></div>
          </div>

          {matches.map(m => (
            <div key={m.id} style={{ background: "#151515", border: "1px solid #2a2a2a", borderRadius: 14, padding: 14, marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div style={{ fontWeight: 700 }}>{m.home} v {m.away}</div>
                <div style={{ fontSize: 11, background: "#ff8c00", color: "black", padding: "2px 8px", borderRadius: 10, fontWeight: 700 }}>{m.risk}</div>
              </div>
              <div style={{ marginTop: 8, fontSize: 13, color: "#ccc" }}>SAFEST: {m.safest} {m.safestPct}</div>
              <div style={{ fontSize: 13, color: m.value.includes("No")? "#888" : "#22c55e" }}>BEST VALUE: {m.value}</div>
              <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                <button style={{ flex: 1, background: "#22c55e", color: "black", border: 0, borderRadius: 20, padding: 8, fontWeight: 700, fontSize: 12 }}>Add to banker ticket</button>
                <button style={{ flex: 1, background: "#222", color: "white", border: "1px solid #333", borderRadius: 20, padding: 8, fontSize: 12 }}>View</button>
              </div>
            </div>
          ))}
        </>
      )}

      {tab === "Add Match" && (
        <div>
          <div style={{ fontWeight: 800, marginBottom: 12 }}>Add & Analyse Match</div>
          <div style={{ background: "#151515", border: "1px dashed #444", borderRadius: 14, padding: 20, textAlign: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: "#ccc", marginBottom: 8 }}>Drop everything here — sharp odds, comparison tables, FBref stats and line-ups.</div>
            <input type="file" multiple accept="image/*" />
            <div style={{ marginTop: 10, fontSize: 12, color: "#888" }}>Drag / paste / Choose screenshots — works on phone</div>
          </div>
          <div style={{ background: "#151515", border: "1px solid #2a2a2a", borderRadius: 14, padding: 14 }}>
            <div style={{ fontSize: 12, color: "#888", marginBottom: 8 }}>FIXTURE</div>
            <input placeholder="Home Team" style={{ width: "100%", background: "#0a0a0a", border: "1px solid #333", borderRadius: 8, padding: 10, color: "white", marginBottom: 10 }} />
            <input placeholder="Away Team" style={{ width: "100%", background: "#0a0a0a", border: "1px solid #333", borderRadius: 8, padding: 10, color: "white" }} />
            <div style={{ fontSize: 12, color: "#888", margin: "14px 0 8px" }}>OPENING ODDS (OPTIONAL)</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <input placeholder="Home 0.00" style={{ background: "#0a0a0a", border: "1px solid #333", borderRadius: 8, padding: 10, color: "white" }} />
              <input placeholder="Away 0.00" style={{ background: "#0a0a0a", border: "1px solid #333", borderRadius: 8, padding: 10, color: "white" }} />
            </div>
            <button style={{ marginTop: 14, width: "100%", background: "#22c55e", color: "black", border: 0, borderRadius: 20, padding: 12, fontWeight: 800 }}>Analyse Match</button>
          </div>
        </div>
      )}

      {tab!== "Dashboard" && tab!== "Add Match" && (
        <div style={{ background: "#151515", border: "1px solid #2a2a2a", borderRadius: 14, padding: 20, textAlign: "center", color: "#888" }}>{tab} — coming next</div>
      )}
    </div>
  );
}
