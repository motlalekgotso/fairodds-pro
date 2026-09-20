import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { createWorker } from "tesseract.js";

export function AddMatchDialog({ open, onOpenChange, onSave }: any) {
  const [homeTeam, setHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");
  const [sharpOdds, setSharpOdds] = useState("");
  const [marketOdds, setMarketOdds] = useState("");
  const [isScanning, setIsScanning] = useState(false);

  const valueEdge = sharpOdds && marketOdds? ((parseFloat(marketOdds) / parseFloat(sharpOdds) - 1) * 100).toFixed(2) : "0";

  async function handleScreenshot(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsScanning(true);
    toast.info("Scanning... free, no key needed");
    try {
      const worker = await createWorker("eng");
      const { data: { text } } = await worker.recognize(file);
      await worker.terminate();
      const odds = text.match(/\b\d\.\d{1,3}\b/g) || [];
      const teams = text.match(/([A-Za-z ]+)\s+vs\.?\s+([A-Za-z ]+)/i);
      if (teams) { setHomeTeam(teams[1].trim()); setAwayTeam(teams[2].trim()); }
      if (odds[0]) setSharpOdds(odds[0]);
      if (odds[1]) setMarketOdds(odds[1]);
      if (odds.length === 1 &&!sharpOdds) setMarketOdds(odds[0]);
      toast.success(`Found odds: ${odds.join(", ")}`);
    } catch {
      toast.error("Could not read, type manually");
    }
    setIsScanning(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white text-black">
        <DialogHeader>
          <DialogTitle>Football Value Analytics - Add Analysis</DialogTitle>
          <p className="text-[11px] text-gray-500">Educational analytics only. No real-money gambling. For statistical research. 18+</p>
        </DialogHeader>
        <div className="border-2 border-dashed p-4 rounded-lg text-center">
          <Label>Drop Screenshots Here (FREE OCR)</Label>
          <Input type="file" accept="image/*" onChange={handleScreenshot} className="mt-2" />
          {isScanning && <p className="text-sm mt-2">Scanning... 5 sec...</p>}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><Label>Home Team</Label><Input value={homeTeam} onChange={e => setHomeTeam(e.target.value)} placeholder="Man City" /></div>
          <div><Label>Away Team</Label><Input value={awayTeam} onChange={e => setAwayTeam(e.target.value)} placeholder="Arsenal" /></div>
          <div><Label>Sharp Reference (True Prob)</Label><Input value={sharpOdds} onChange={e => setSharpOdds(e.target.value)} placeholder="2.10" /></div>
          <div><Label>Market Odds</Label><Input value={marketOdds} onChange={e => setMarketOdds(e.target.value)} placeholder="2.45" /></div>
        </div>
        <div className="bg-green-50 p-3 rounded"><p className="font-bold">Value Edge: {valueEdge}%</p><p className="text-xs text-gray-600">Formula: (Market / Sharp - 1) x 100</p></div>
        <Button onClick={() => {
          if (!homeTeam ||!awayTeam ||!sharpOdds ||!marketOdds) { toast.error("Fill all fields"); return; }
          onSave({ homeTeam, awayTeam, sharpOdds: parseFloat(sharpOdds), marketOdds: parseFloat(marketOdds), valueEdge: parseFloat(valueEdge) });
          setHomeTeam(""); setAwayTeam(""); setSharpOdds(""); setMarketOdds(""); onOpenChange(false);
        }} className="w-full">Save to Portfolio</Button>
      </DialogContent>
    </Dialog>
  );
        }
