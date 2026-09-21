import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
export const Route = createFileRoute("/")({ component: Home })

function Home(){
  const [files,setFiles]=useState<File[]>([])
  const [log,setLog]=useState<string>("")
  const [results,setResults]=useState<{name:string,text:string,odds:number[]}[]>([])
  const [scanning,setScanning]=useState(false)

  const onPick=(e:any)=>{
    setFiles(Array.from(e.target.files as FileList).slice(0,4))
    setResults([])
    setLog("")
  }

  const extractOdds=(text:string):number[]=>{
    // finds all 1.20 - 100.00
    const matches = text.match(/\d+\.\d{1,2}/g) || []
    return matches.map(n=>parseFloat(n)).filter(n=> n>=1.01 && n<=100).slice(0,10)
  }

  const scan=async()=>{
    if(files.length===0) return
    setScanning(true)
    setResults([])
    setLog("Starting offline OCR...")
    const Tesseract = (await import("tesseract.js")).default
    const out:any[]=[]
    for(let i=0;i<files.length;i++){
      const f=files[i]
      setLog(`Reading ${f.name}... (${i+1}/${files.length})`)
      try{
        const {data:{text}} = await Tesseract.recognize(f, "eng")
        const odds = extractOdds(text)
        out.push({name:f.name.slice(0,18), text: text.slice(0,200), odds})
      }catch(err){
        out.push({name:f.name.slice(0,18), text:"OCR failed", odds:[]})
      }
    }
    setResults(out)
    setLog(`Done - found odds in ${out.length} images`)
    setScanning(false)
    try{ navigator.vibrate(100)}catch{}
  }

  // Fair calc from all found odds (takes first 2 odds per image as Market A/B)
  const markets = results.map(r=> ({ name:r.name, a:r.odds[0], b:r.odds[1] })).filter(m=> m.a && m.b)
  const avgA = markets.length? markets.reduce((s,m)=>s+1/m.a!,0)/markets.length : 0
  const avgB = markets.length? markets.reduce((s,m)=>s+1/m.b!,0)/markets.length : 0
  const total = avgA+avgB
  const fairA = total? (1/(avgA/total)).toFixed(2) : "-"
  const fairB = total? (1/(avgB/total)).toFixed(2) : "-"

  return (
    <div style={{minHeight:"100vh", background:"#08080a", color:"white", fontFamily:"system-ui", padding:16}}>
      <div style={{maxWidth:440, margin:"0 auto"}}>
        <div style={{display:"flex", justifyContent:"space-between"}}><b>FairOdds Pro</b><span style={{fontSize:10, border:"1px solid #333", borderRadius:20, padding:"2px 8px", opacity:0.5}}>OFFLINE ACADEMY</span></div>
        <h1 style={{fontSize:32, fontWeight:900, marginTop:20, lineHeight:0.9}}>Find the<br/><span style={{color:"#666"}}>true price.</span></h1>
        <p style={{fontSize:13, color:"#777", marginTop:8}}>Upload 1-4 bookmaker screenshots. OCR runs ON YOUR PHONE, no internet, no server. We extract real odds.</p>

        <div style={{marginTop:18, background:"#121215", border:"1px solid #222", borderRadius:20, padding:14}}>
          <input type="file" multiple accept="image/*" onChange={onPick} style={{width:"100%"}} />
          <div style={{fontSize:11, color:"#666", marginTop:6}}>{files.length} selected • First 2 numbers per image = Market A/B</div>
          <button onClick={scan} disabled={scanning || files.length===0} style={{marginTop:12, width:"100%", background: scanning? "#222" : "white", color: scanning? "#666" : "black", fontWeight:900, padding:14, borderRadius:12, border:"none"}}>
            {scanning? "⏳ READING REAL TEXT..." : `🔍 SCAN ${files.length} REAL SCREENSHOTS`}
          </button>
          {log && <div style={{marginTop:10, fontSize:11, color:"#0f0", fontFamily:"monospace"}}>{log}</div>}
        </div>

        {markets.length>0 && (
          <div style={{marginTop:18}}>
            <div style={{background:"white", color:"black", borderRadius:20, padding:16}}>
              <div style={{fontSize:10, fontWeight:800, opacity:0.5, letterSpacing:1}}>REAL FAIR VALUE (from your images)</div>
              <div style={{display:"flex", gap:10, marginTop:10}}>
                <div style={{flex:1, background:"black", color:"white", padding:12, borderRadius:12}}><div style={{fontSize:10, opacity:0.6}}>TEAM A FAIR</div><div style={{fontSize:26, fontWeight:900}}>{fairA}</div></div>
                <div style={{flex:1, background:"#eee", padding:12, borderRadius:12}}><div style={{fontSize:10, opacity:0.6}}>TEAM B FAIR</div><div style={{fontSize:26, fontWeight:900}}>{fairB}</div></div>
              </div>
              <div style={{fontSize:11, marginTop:8, color:"#666"}}>Calculated from {markets.length} real screenshots • De-vigged</div>
            </div>

            <div style={{marginTop:12, background:"#111", border:"1px solid #222", borderRadius:16, padding:12}}>
              <div style={{fontSize:10, fontWeight:700, opacity:0.5, marginBottom:8}}>EXTRACTED (proof it's real)</div>
              {results.map((r,i)=>(
                <div key={i} style={{padding:"8px 0", borderBottom:"1px solid #222"}}>
                  <div style={{display:"flex", justifyContent:"space-between", fontSize:13}}><span style={{opacity:0.6}}>{r.name}</span><b>{r.odds.slice(0,4).join(", ") || "No odds found"}</b></div>
                  <div style={{fontSize:10, color:"#555", marginTop:2, whiteSpace:"pre-wrap"}}>{r.text.slice(0,120)}...</div>
                </div>
              ))}
            </div>

            <div style={{marginTop:12, background:"#1a1a00", border:"1px solid #332", borderRadius:12, padding:12}}>
              <div style={{fontSize:11, color:"#ff0", fontWeight:700}}>📚 LESSON</div>
              <div style={{fontSize:12, color:"#cc9", marginTop:4}}>Fair = 1 ÷ (prob ÷ totalProb). Example: If avg is 1.90 & 1.90, total prob=105%, fair = 2.00 each. Margin removed.</div>
            </div>
          </div>
        )}

        <div style={{textAlign:"center", fontSize:10, color:"#444", marginTop:24}}>EDUCATIONAL ONLY • OFFLINE OCR • NO BETTING</div>
      </div>
    </div>
  )
    }
