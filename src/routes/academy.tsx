import { useState } from "react"
export default function AcademyPage() {
  const [pro]=useState(()=>{try{return localStorage.getItem("fairodds_pro")==="true"}catch{return false}})
  const lessons=[
    {title:"FAIRODDS.ACADEMY • Global Education",desc:"We Teach You To Fish • Founded by Langson Halahala",img:"/IMG-20260919-WA1926.jpg",free:true,id:0},
    {title:"Rule #1: Patience Rule",desc:"Don't eat while cooking",img:"/IMG-20260919-WA2203.jpg",free:true,id:1},
    {title:"Rule #2: Kitchen Rule",desc:"One ingredient per pot",img:"/IMG-20260919-WA4075.jpg",free:false,id:2},
    {title:"Rule #3: Exam Rule • Less = More",desc:"Choose few questions",img:"/IMG-20260919-WA4207.jpg",free:false,id:3},
    {title:"Rule #4: Mountain Rule",desc:"Don't carry a mountain",img:"/IMG-20260919-WA5606.jpg",free:false,id:4},
    {title:"Rule #5: Trap Rule",desc:"Small odds = Bait",img:"/IMG-20260919-WA9057.jpg",free:false,id:5},
  ]
  return(
    <div style={{display:"flex",flexDirection:"column",gap:20,paddingBottom:40}}>
      {lessons.map(l=>{
        const locked=!pro&&!l.free&&l.id!==0
        return(
          <div key={l.id} style={{borderRadius:20,overflow:"hidden",border:"1px solid rgba(255,214,10,0.25)",background:"#0E1628"}}>
            <div style={{position:"relative",background:"#000"}}>
              <img src={l.img} alt={l.title} style={{width:"100%",height:l.id===0?320:520,objectFit:"cover",display:"block"}}/>
              <div style={{position:"absolute",inset:0,background:"linear-gradient(to top, rgba(0,0,0,0.9), transparent 55%)"}}/>
              <div style={{position:"absolute",bottom:14,left:14,right:14}}>
                <div style={{fontWeight:900,fontSize:16,color:"#FFD60A"}}>{l.title}</div>
                <div style={{fontSize:13,color:"#fff",marginTop:4}}>{l.desc}</div>
              </div>
              {locked&&<div style={{position:"absolute",top:12,right:12,background:"rgba(0,0,0,0.85)",border:"1px solid #FFD60A",padding:"6px 12px",borderRadius:20,fontSize:10,fontWeight:800}}>🔒 PRO $6.99</div>}
            </div>
          </div>
        )
      })}
    </div>
  )
      }
