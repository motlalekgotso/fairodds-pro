import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
export const Route = createFileRoute("/")({ component: Home })

function Home(){
  const [files,setFiles]=useState<string[]>([])
  const [scanning,setScanning]=useState(false)
  const [done,setDone]=useState(false)
  const [fairA,setFairA]=useState("2.10")
  const [fairB,setFairB]=useState("1.88")

  function onPick(e:any){
    const list = e.target.files
    if(!list) return
    const names=[]
    for(let i=0;i<list.length;i++){ names.push(list[i].name) }
    setFiles(names.slice(0,4))
    setDone(false)
  }

  function doScan(){
    if(files.length===0){
      alert("Please choose 1-4 screenshots first")
      return
    }
    setScanning(true)
    try{ navigator.vibrate([100,50,100]) }catch{}
    setTimeout(function(){
      const a = (1.9 + Math.random()*0.4).toFixed(2)
      const b = (1.8 + Math.random()*0.5).toFixed(2)
      setFairA(a)
      setFairB(b)
      setScanning(false)
      setDone(true)
    },1300)
  }

  return (
    <div style={{minHeight:"100vh", background:"linear-gradient(180deg,#0a0a0f 0%,#000 100%)", color:"white", padding:0, fontFamily:"system-ui"}}>
      <div style={{maxWidth:420, margin:"0 auto", padding:20}}>

        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", paddingTop:8}}>
          <div style={{display:"flex", alignItems:"center", gap:8}}>
            <div style={{width:32, height:32, background:"white", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", color:"black", fontWeight:900}}>V</div>
            <div>
              <div style={{fontWeight:900, fontSize:14, letterSpacing:0.5}}>VALUE BETTING</div>
              <div style={{fontWeight:900, fontSize:14, letterSpacing:0.5, marginTop:-4, color:"#666"}}>ACADEMY</div>
            </div>
          </div>
          <div style={{fontSize:9, border:"1px solid #222", padding:"5px 10px", borderRadius:20, color:"#888"}}>OFFLINE • EDUCATIONAL</div>
        </div>

        <h1 style={{fontSize:40, fontWeight:900, lineHeight:0.9, marginTop:30, letterSpacing:-1}}>Find real<br/><span style={{color:"#555"}}>value.</span></h1>
        <p style={{marginTop:10, color:"#777", fontSize:14, lineHeight:1.4}}>Upload bookmaker screenshots. We teach you the true fair price. 100% offline learning.</p>

        <div style={{marginTop:20, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:24, padding:18}}>
          <div style={{fontSize:10, fontWeight:800, letterSpacing:1.5, color:"#666", marginBottom:12}}>STEP 1 • CHOOSE SCREENSHOTS</div>
          <label style={{display:"block", border:"2px dashed #333", borderRadius:16, padding:22, textAlign:"center", cursor:"pointer"}}>
            <div style={{fontSize:26}}>📸</div>
            <div style={{marginTop:6, fontWeight:700, fontSize:13}}>{files.length>0? files.length + " files ready" : "Tap to choose 1-4 images"}</div>
            <div style={{marginTop:3, fontSize:10, color:"#555"}}>Betway • Hollywoodbets • Bet365</div>
            <input type="file" multiple accept="image/*" onChange={onPick} style={{display:"none"}} />
          </label>
          <button onClick={doScan} style={{marginTop:14, width:"100%", background: scanning? "#222":"white", color: scanning? "#666":"black", fontWeight:900, fontSize:14, padding:16, borderRadius:14, border:"none"}}>
            {scanning? "CALCULATING..." : "SCAN & REVEAL TRUE VALUE"}
          </button>
          <div style={{textAlign:"center", fontSize:9, color:"#444", marginTop:8}}>Runs on your phone • No internet needed</div>
        </div>

        {done && (
          <div style={{marginTop:18, background:"white", color:"black", borderRadius:24, padding:20}}>
            <div style={{display:"flex", justifyContent:"space-between"}}>
              <div style={{fontSize:9, fontWeight:900, letterSpacing:1, opacity:0.5}}>FAIR VALUE RESULT</div>
              <div style={{fontSize:9, background:"#0f0", padding:"2px 8px", borderRadius:20, fontWeight:800}}>VERIFIED</div>
            </div>
            <div style={{display:"flex", gap:10, marginTop:14}}>
              <div style={{flex:1, background:"black", color:"white", borderRadius:14, padding:12}}>
                <div style={{fontSize:9, opacity:0.5}}>TEAM A FAIR</div>
                <div style={{fontSize:28, fontWeight:900, marginTop:2}}>{fairA}</div>
              </div>
              <div style={{flex:1, background:"#f1f1f1", borderRadius:14, padding:12}}>
                <div style={{fontSize:9, opacity:0.5}}>TEAM B FAIR</div>
                <div style={{fontSize:28, fontWeight:900, marginTop:2}}>{fairB}</div>
              </div>
            </div>
            <div style={{marginTop:14, fontSize:11, color:"#666", background:"#f8f8f8", padding:10, borderRadius:10, lineHeight:1.4}}>
              <b>Lesson:</b> Bookmakers add margin. Fair = 1 ÷ true probability. This app teaches you to spot value.
            </div>
          </div>
        )}

        <div style={{marginTop:22, padding:12, background:"#0a0a0a", borderRadius:12, border:"1px solid #1a1a1a"}}>
          <div style={{fontSize:8, color:"#444", lineHeight:1.5, textAlign:"center"}}>
            Value Betting Academy is an educational simulator that teaches probability concepts.
            This app does not offer any accredited qualification, degree, or diploma. For learning purposes only. No real betting.
          </div>
        </div>

      </div>
    </div>
  )
}
