import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import { FlaskConical, GraduationCap, Ticket, Settings, Lock, Play, Clock } from "lucide-react";

// === FAIRODDS $6.99 GLOBAL TRIAL MODEL ===
const TRIAL_DAYS = 7;
const PRICE = "$6.99/mo";
function getTrial(){
  const k="fairodds_trial_start";
  let s=localStorage.getItem(k);
  if(!s){ s=Date.now().toString(); localStorage.setItem(k,s); }
  const used=Math.floor((Date.now()-parseInt(s!))/(1000*60*60*24));
  const left=Math.max(0,TRIAL_DAYS-used);
  return {left, active:left>0, expired:left<=0};
}

// === ADS - MAKE MONEY DURING TRIAL ===
function AdBanner(){
  const pro=localStorage.getItem("fairodds_pro")==="true";
  if(pro) return null;
  return (
    <div className="rounded-xl bg-[#0E1628] border border-[#FFD60A]/20 p-3">
      <div className="text-[8px] text-white/30 tracking-[0.3em] text-center">ADVERTISEMENT • SUPPORTS ACADEMY • 15s</div>
      <div className="mt-2 h-[70px] rounded-lg bg-gradient-to-r from-white/5 to-white/10 flex flex-col items-center justify-center">
        <div className="text-[11px] text-white/40">AdMob Banner Here</div>
        <div className="text-[9px] text-white/20 mt-1">You earn $0.10 per view during trial</div>
      </div>
      <div className="mt-2 flex justify-center">
        <button className="text-[10px] bg-[#FFD60A] text-black px-4 py-1.5 rounded-full font-black">Watch 15s Ad = Unlock 1 Lesson</button>
      </div>
    </div>
  );
}

// === LAB - 15 STUDIES FULL DURING TRIAL + ALIVE PICTURE ===
function LabPage(){
  const t=getTrial();
  const studies=Array.from({length:15},(_,i)=>({
    id:i+1,
    m:`Study ${i+1}: Analysis ${String.fromCharCode(65+i)} vs ${String.fromCharCode(90-i)}`,
    p:i%3==0?"Home Win +EV 4.2%":i%3==1?"BTTS Yes +EV 3.8%":"Under 2.5 +EV 5.1%",
    c:84+Math.floor(Math.random()*12)
  }));
  return (
    <div className="space-y-4 pb-28">
      <div className="rounded-2xl overflow-hidden border border-[#FFD60A]/30">
        <img src="/images/cover.jpg" className="w-full h-36 object-cover" alt="FairOdds Academy" />
        <div className="p-3 bg-[#0E1628] flex justify-between items-center">
          <div><div className="font-black text-sm">FAIRODDS.ACADEMY</div><div className="text-[10px] text-white/50">GLOBAL EDUCATION • 15 daily studies</div></div>
          <div className="text-[10px] px-2 py-1 rounded-full bg-[#FFD60A] text-black font-black">{t.active?`${t.left}D TRIAL`:"EXPIRED"}</div>
        </div>
      </div>
      <AdBanner/>
      <div className="grid gap-3">
        {studies.map(s=><div key={s.id} className="rounded-xl border border-white/10 bg-[#0E1628] p-4 flex justify-between items-center">
          <div><div className="font-bold text-sm">{s.m}</div><div className="text-[11px] text-[#1A8C2E] mt-1">{s.p}</div></div>
          <div className="text-right"><div className="font-black text-xs">{s.c}%</div><div className="text-[9px] text-white/30">CONF</div></div>
        </div>)}
      </div>
      <div className="rounded-xl border border-dashed border-[#FFD60A]/20 bg-[#0E1628] p-3 text-[11px] text-white/60 text-center">🎓 School Note: Don't carry a mountain. Don't take all 15 = Needle in haystack. Pick 2-3 only for 10R→30R discipline.</div>
      <AdBanner/>
    </div>
  );
}

// === ACADEMY - YOUR POSTERS ALIVE + 2 FREE DURING TRIAL ===
function AcademyPage(){
  const t=getTrial();
  const pro=localStorage.getItem("fairodds_pro")==="true";
  const LESSONS=[
    {id:1, title:"Rule #1: Patience Rule", desc:"Don't eat while cooking", img:"/images/patience.jpg", free:true},
    {id:2, title:"Rule #2: Kitchen Rule", desc:"One ingredient per pot", img:"/images/kitchen.jpg", free:true},
    {id:3, title:"Rule #3: Exam Rule", desc:"Choose few questions, master them", img:"/images/exam.jpg", free:false},
    {id:4, title:"Rule #4: Mountain Rule", desc:"Don't carry a mountain, carry few stones", img:"/images/mountain.jpg", free:false},
    {id:5, title:"Rule #5: Trap Rule", desc:"Small odds = Bait", img:"/images/trap.jpg", free:false},
    {id:6, title:"Diploma: We Teach You To Fish", desc:"Global Education", img:"/images/cover.jpg", free:false},
  ];
  return (
    <div className="space-y-5 pb-28">
      <div className="rounded-2xl overflow-hidden border border-[#FFD60A]/30">
        <img src="/images/cover.jpg" className="w-full h-44 object-cover"/>
        <div className="p-4 bg-[#0E1628]">
          <h1 className="text-2xl font-black">FAIRODDS.ACADEMY</h1>
          <p className="text-[11px] text-white/60 mt-1 flex items-center gap-1"><Clock className="w-3 h-3"/>{t.active?`TRIAL: ${t.left} days left • 2 Rules FREE • 15 Daily Studies FULL ACCESS`:`TRIAL ENDED • Unlock for ${PRICE}`}</p>
        </div>
      </div>
      {LESSONS.map(l=>{
        const locked=!pro && (t.expired ||!l.free);
        return (
          <div key={l.id} className={`rounded-2xl overflow-hidden border ${locked?"border-white/10 opacity-70":"border-[#FFD60A]/30"} bg-[#0E1628]`}>
            <div className="relative">
              <img src={l.img} className="w-full h-[420px] object-cover object-top" alt={l.title}/>
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"/>
              <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
                <div><div className="font-black text-[15px] text-[#FFD60A] drop-shadow">{l.title}</div><div className="text-[12px] text-white/90">{l.desc}</div></div>
                <div className={`w-11 h-11 rounded-full flex items-center justify-center ${locked?"bg-white/20 text-white":"bg-[#FFD60A] text-black"}`}>{locked?<Lock className="w-5 h-5"/>:<Play className="w-5 h-5"/>}</div>
              </div>
              {locked && <div className="absolute top-3 right-3 text-[10px] bg-black/80 px-3 py-1.5 rounded-full border border-white/20 font-bold">PRO • Watch 15s to Unlock</div>}
            </div>
            <div className="p-3 flex justify-between items-center bg-[#0A0E1A]">
              <span className="text-[10px] text-white/40">Founded by Langson Halahala • fairodds.academy</span>
              <button className={`text-xs font-black px-5 py-2 rounded-lg ${locked?"border border-white/20 text-white/60":"bg-[#FFD60A] text-black"}`}>{locked?"LOCKED":"START"}</button>
            </div>
          </div>
        );
      })}
      {t.expired &&!pro && (
        <div className="rounded-xl bg-[#FFD60A] text-black p-5 text-center">
          <div className="font-black text-lg">Trial Ended. You saw 15 daily studies for 7 days.</div>
          <div className="text-sm mt-1">Discipline = Pick 2-3 only. Don't carry mountain. Unlock to
