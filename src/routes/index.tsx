import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
export const Route = createFileRoute("/")({ component: Home })

function Home(){
  const [files,setFiles]=useState<File[]>([])
  const [msg,setMsg]=useState("App is ready")
  const [scanning,setScanning]=useState(false)
  const [show,setShow]=useState(false)

  const onPick=(e:any)=>{
    const list = Array.from(e.target.files as FileList)
    setFiles(list.slice(0,4))
    setMsg(`${list.length} files selected ✅ Now tap SCAN`)
    setShow(false)
  }

  const scan=()=>{
    setScanning(true)
    setMsg("🔥 BUTTON WORKS! Scanning...")
    try{ navigator.vibrate([100,50,100]) }catch{}
    
    setTimeout(()=>{
      setScanning(false)
      setShow(true)
      setMsg(`✅ SUCCESS! Read ${files.length} files`)
    },1500)
  }

  return (
    <div style={{minHeight:"100vh", background:"black", color:"white", padding:20, fontFamily:"system-ui"}}>
      <h1 style={{fontSize:36, fontWeight:900}}>FairOdds Pro<br/><span style={{color:"#666"}}>ALIVE TEST</span></h1>
      
      <div style={{marginTop:20, background:"#222", padding:20, borderRadius:20}}>
        <input type="file" multiple accept="image/*" onChange={onPick} style={{width:"100%", marginBottom:12}} />
        <p style={{fontSize:14, color:"#0f0"}}>{msg}</p>
        
        <button onClick={scan} disabled={files.length===0} style={{
          marginTop:15, width:"100%", padding:16, borderRadius:12, 
          background: files.length===0 ? "#333" : "white", 
          color: files.length===0 ? "#666" : "black", 
          fontWeight:900, fontSize:16, border:"none"
        }}>
          {scanning ? "⏳ WORKING..." : files.length===0 ? "CHOOSE FILES FIRST" : `🔍 SCAN ${files.length} FILES (TAP ME)`}
        </button>
      </div>

      {show && (
        <div style={{marginTop:20, background:"white", color:"black", padding:20, borderRadius:20}}>
          <h2 style={{fontWeight:900}}>✅ APP IS ALIVE!</h2>
          <p style={{marginTop:8}}>Button works! Found {files.length} files:</p>
          <ul style={{marginTop:8}}>
            {files.map((f,i)=><li key={i}>📄 {f.name} - {(f.size/1024).toFixed(0)}KB</li>)}
          </ul>
          <p style={{marginTop:12, background:"black", color:"white", padding:10, borderRadius:8}}>Fair A: 2.05 | Fair B: 1.88 (example)</p>
        </div>
      )}
    </div>
  )
}
