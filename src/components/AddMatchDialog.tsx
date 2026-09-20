import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AddMatchDialog() {
  const [open, setOpen] = useState(false);
  const [homeTeam, setHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");
  const [homePrice, setHomePrice] = useState("");
  const [drawPrice, setDrawPrice] = useState("");
  const [awayPrice, setAwayPrice] = useState("");
  const [status, setStatus] = useState("Drop reference screenshot - free analysis");
  const [isScanning, setIsScanning] = useState(false);

  const extractPricesFromText = (text: string) => {
    const priceRegex = /\b\d\.\d{1,3}\b/g;
    const matches = text.match(priceRegex);
    if (!matches) return false;
    const valid = matches.map(m => parseFloat(m)).filter(n => n >= 1.2 && n <= 50).slice(0, 3);
    if (valid.length >= 2) {
      setHomePrice(String(valid[0]));
      if (valid[1]) setDrawPrice(String(valid[1]));
      if (valid[2]) setAwayPrice(String(valid[2]));
      return true;
    }
    return false;
  };

  const handleImage = async (file: File) => {
    setIsScanning(true);
    setStatus("Analysing reference image...");
    try {
      const Tesseract = await import("tesseract.js");
      const worker: any = await (Tesseract as any).createWorker("eng");
      const ret = await worker.recognize(file);
      const text = ret.data.text as string;
      await worker.terminate();
      const ok = extractPricesFromText(text);
      setStatus(ok? "Reference data loaded - review values" : "No values detected - please enter manually");
    } catch (e) {
      setStatus("Manual entry required - analysis will still calculate");
    }
    setIsScanning(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button className="bg-[#8B5A2B]">+ Add Fixture</Button></DialogTrigger>
      <DialogContent className="bg-black text-white">
        <DialogHeader>
          <DialogTitle>Fixture Market Analysis</DialogTitle>
          <p className="text-xs text-gray-400">{status}</p>
        </DialogHeader>
        <div onDragOver={(e)=>e.preventDefault()} onDrop={(e)=>{e.preventDefault(); const f=e.dataTransfer.files[0]; if(f) handleImage(f);}} className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
          <p className="text-sm mb-3">{isScanning?"Analysing...":"Drag sports reference screenshot here"}</p>
          <label className="bg-gray-800 px-4 py-2 rounded cursor-pointer text-sm">Choose image<input type="file" accept="image/*" className="hidden" onChange={(e)=>{const f=e.target.files?.[0]; if(f) handleImage(f);}} /></label>
        </div>
        <div className="space-y-3">
          <div><Label>Home side</Label><Input value={homeTeam} onChange={(e)=>setHomeTeam(e.target.value)} placeholder="Team A" className="bg-gray-900" /></div>
          <div><Label>Away side</Label><Input value={awayTeam} onChange={(e)=>setAwayTeam(e.target.value)} placeholder="Team B" className="bg-gray-900" /></div>
          <div className="grid grid-cols-3 gap-2">
            <div><Label>Home price</Label><Input value={homePrice} onChange={(e)=>setHomePrice(e.target.value)} placeholder="2.10" className="bg-gray-900" /></div>
            <div><Label>Draw price</Label><Input value={drawPrice} onChange={(e)=>setDrawPrice(e.target.value)} placeholder="3.20" className="bg-gray-900" /></div>
            <div><Label>Away price</Label><Input value={awayPrice} onChange={(e)=>setAwayPrice(e.target.value)} placeholder="1.85" className="bg-gray-900" /></div>
          </div>
          <p className="text-[10px] text-gray-500 text-center pt-2">For statistical analysis only. Educational tool.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
        }
