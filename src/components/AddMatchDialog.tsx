import { useState } from "react";
import { createWorker } from "tesseract.js";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AddMatchDialog() {
  const [open, setOpen] = useState(false);
  const [homeTeam, setHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");
  const [homeOdds, setHomeOdds] = useState("");
  const [drawOdds, setDrawOdds] = useState("");
  const [awayOdds, setAwayOdds] = useState("");
  const [status, setStatus] = useState("Drop Pinnacle screenshot - FREE, no AI key needed");
  const [isScanning, setIsScanning] = useState(false);

  const extractOdds = (text: string) => {
    // Find all decimal odds like 2.10, 3.45, 1.85
    const oddsRegex = /\b\d\.\d{1,3}\b/g;
    const matches = text.match(oddsRegex);
    if (!matches) return;

    // Clean and sort - Pinnacle odds are usually >1.5
    const valid = matches.map(m => parseFloat(m)).filter(n => n >= 1.2 && n <= 50).slice(0, 3);
    if (valid.length >= 2) {
      setHomeOdds(valid[0].toString());
      if (valid[1]) setDrawOdds(valid[1].toString());
      if (valid[2]) setAwayOdds(valid[2].toString());
      setStatus(`✅ Scanned ${valid.length} odds - check and save`);
    }
  };

  const handleImage = async (file: File) => {
    setIsScanning(true);
    setStatus("🔍 Scanning... free, no credits");
    try {
      const worker = await createWorker("eng");
      const { data: { text } } = await worker.recognize(file);
      await worker.terminate();
      console.log("OCR text:", text);
      extractOdds(text);

      // Try to extract team names (capitalized words)
      const lines = text.split("\n").filter(l => l.trim().length > 3);
      if (lines.length > 0 &&!homeTeam) {
        setStatus(status + " - Enter team names");
      }
    } catch (e) {
      console.error(e);
      setStatus("❌ Scan failed - type odds manually, safe");
    }
    setIsScanning(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleImage(file);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImage(file);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#8B5A2B]">+ Add Match</Button>
      </DialogTrigger>
      <DialogContent className="bg-black text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add & analyse match</DialogTitle>
          <p className="text-sm text-gray-400">Pinnacle prices are devigged into fair probabilities; retail prices are checked for +EV.</p>
        </DialogHeader>

        {/* SCREENSHOTS - FREE SCANNER */}
        <div className="border border-gray-700 rounded-lg p-4">
          <h3 className="font-bold mb-2">SCREENSHOTS</h3>
          <p className="text-xs text-gray-400 mb-3">{status}</p>
          <div
            onDrop={onDrop}
            onDragOver={(e) => e.preventDefault()}
            className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center"
          >
            <p className="text-sm mb-3">{isScanning? "Scanning..." : "Drag images here, paste with Ctrl+V, or choose files. Odds, stats and line-up screenshots can all go in together."}</p>
            <label className="bg-gray-800 px-4 py-2 rounded cursor-pointer">
              Choose screenshots
              <input type="file" accept="image/*" className="hidden" onChange={onFileChange} />
            </label>
          </div>
        </div>

        {/* FIXTURE */}
        <div className="border border-gray-700 rounded-lg p-4 space-y-3">
          <h3 className="font-bold">FIXTURE</h3>
          <div>
            <Label>Home team</Label>
            <Input value={homeTeam} onChange={(e) => setHomeTeam(e.target.value)} className="bg-gray-900 border-gray-700" placeholder="e.g. Man City" />
          </div>
          <div>
            <Label>Away team</Label>
            <Input value={awayTeam} onChange={(e) => setAwayTeam(e.target.value)} className="bg-gray-900 border-gray-700" placeholder="e.g. Arsenal" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label>Home odds (Pinnacle)</Label>
              <Input value={homeOdds} onChange={(e) => setHomeOdds(e.target.value)} className="bg-gray-900 border-gray-700" placeholder="2.10" />
            </div>
            <div>
              <Label>Draw odds</Label>
              <Input value={drawOdds} onChange={(e) => setDrawOdds(e.target.value)} className="bg-gray-900 border-gray-700" placeholder="3.40" />
            </div>
            <div>
              <Label>Away odds</Label>
              <Input value={awayOdds} onChange={(e) => setAwayOdds(e.target.value)} className="bg-gray-900 border-gray-700" placeholder="3.80" />
            </div>
          </div>
          <Button className="w-full bg-[#8B5A2B] mt-2">Calculate Fair Odds + EV</Button>
          <p className="text-[10px] text-gray-500 text-center">For analysis only. Don't gamble. Calculate.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
      }
