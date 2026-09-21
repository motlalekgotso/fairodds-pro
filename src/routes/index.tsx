import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { scanMarketFn } from "@/lib/academy/scan-market.function";

export const Route = createFileRoute("/")({
  component: AcademyPage,
  head: () => ({
    meta: [
      { title: "FairOdds Academy - Global Business Education" },
      { name: "description", content: "Education only - Market analysis training academy. No real money." },
      { property: "og:title", content: "FairOdds Academy" },
      { property: "og:description", content: "Global business education platform - Education only" },
    ],
  }),
});

function AcademyPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (!files.length) return;
    const b64 = await Promise.all(files.map(f => new Promise<string>(r => {
      const fr = new FileReader(); fr.onload = () => r(fr.result as string); fr.readAsDataURL(f);
    })));
    setLoading(true);
    try {
      const data = await scanMarketFn({ data: { images: b64 } });
      setResult(data);
    } catch (err: any) { alert(err.message); }
    setLoading(false);
  };

  return (
    <div style={{ background: "#0A0E1A", minHeight: "100vh", color: "#fff", padding: 24 }}>
      <h1 style={{ color: "#FFD600" }}>FairOdds Academy</h1>
      <p style={{ opacity: 0.6 }}>Education Only • No Real Money • Global Business Academy</p>
      <div style={{ background: "#141A2A", padding: 20, borderRadius: 16, marginTop: 20 }}>
        <h3>Upload Market Screenshots Together</h3>
        <input type="file" multiple accept="image/*" onChange={upload} />
        {loading && <p style={{ color: "#FFD600" }}>🔍 Scanning all together...</p>}
        {result && <pre style={{ background: "#000", padding: 12, fontSize: 11, overflow: "auto" }}>{JSON.stringify(result, null, 2)}</pre>}
      </div>
    </div>
  );
}
