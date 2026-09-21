import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"

export const Route = createFileRoute("/")({
  component: Home,
})

function Home() {
  const [files, setFiles] = useState<FileList | null>(null)
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  async function scan() {
    if(!files) return
    setLoading(true)
    const fd = new FormData()
    Array.from(files).forEach(f => fd.append("screenshots", f))
    try {
      const r = await fetch("/api/academy/scan-market", { method: "POST", body: fd })
      setResult(await r.json())
    } catch(e:any) {
      setResult({ error: e.message })
    }
    setLoading(false)
  }

  return (
    <div style={{ padding: 24, background: "#0a0a0a", color: "white", minHeight: "100vh", fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: 26, fontWeight: 800 }}>FairOdds Academy</h1>
      <p style={{ opacity: 0.6, marginTop: 6 }}>Educational Market Fair Value Scanner</p>
      <input type="file" multiple accept="image/*" onChange={e => setFiles(e.target.files)} style={{ marginTop: 20, display: "block" }} />
      <button onClick={scan} disabled={loading} style={{ marginTop: 14, padding: "10px 18px", background: "white", color: "black", borderRadius: 8, fontWeight: 700 }}>
        {loading ? "Analyzing..." : "Scan Screenshots"}
      </button>
      {result && <pre style={{ marginTop: 20, background: "#18181b", padding: 12, borderRadius: 8, fontSize: 11, overflow: "auto" }}>{JSON.stringify(result, null, 2)}</pre>}
    </div>
  )
}
