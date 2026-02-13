"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";

interface MappingEntry { laboratoryId: string; laboratoryName: string; testName: string; }

export default function TestMappingForm({ open, onClose, onSubmit, laboratories }: { open: boolean; onClose: () => void; onSubmit: (data: any) => Promise<void>; laboratories: { id: string; name: string }[] }) {
  const [canonicalName, setCanonicalName] = useState("");
  const [category, setCategory] = useState("");
  const [entries, setEntries] = useState<MappingEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!canonicalName || entries.length === 0) return;
    setIsLoading(true);
    try { await onSubmit({ canonicalName, category, entries }); setCanonicalName(""); setCategory(""); setEntries([]); onClose(); }
    finally { setIsLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Nouvelle correspondance de test</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2"><Label>Nom canonique *</Label><Input value={canonicalName} onChange={e => setCanonicalName(e.target.value)} placeholder="Nom standard du test" /></div>
            <div className="space-y-2"><Label>Catégorie</Label><Input value={category} onChange={e => setCategory(e.target.value)} placeholder="Biochimie, Hématologie..." /></div>
          </div>
          <div className="space-y-2">
            <Label>Correspondances par laboratoire</Label>
            {entries.map((entry, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-sm font-medium min-w-[150px]">{entry.laboratoryName}</span>
                <Input value={entry.testName} onChange={e => { const u = [...entries]; u[i].testName = e.target.value; setEntries(u); }} placeholder="Nom du test dans ce labo" />
                <Button variant="ghost" size="icon" onClick={() => setEntries(entries.filter((_, idx) => idx !== i))}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            ))}
            <div className="flex flex-wrap gap-2 mt-2">
              {laboratories.filter(lab => !entries.find(e => e.laboratoryId === lab.id)).map(lab => (
                <Button key={lab.id} variant="outline" size="sm" onClick={() => setEntries([...entries, { laboratoryId: lab.id, laboratoryName: lab.name, testName: "" }])}><Plus className="h-3 w-3 mr-1" /> {lab.name}</Button>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter><Button variant="outline" onClick={onClose}>Annuler</Button><Button onClick={handleSubmit} disabled={isLoading || !canonicalName}>{isLoading ? "Enregistrement..." : "Enregistrer"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
