"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";

interface MappingEntry {
  laboratoryId: string;
  laboratoryName: string;
  testName: string;
  price: string;
  code: string;
  duration: string;
}

interface TestMappingFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<any>;
  laboratories: { id: string; name: string }[];
  /** If set, the form is in edit mode and pre-fills values. */
  editData?: {
    canonicalName: string;
    code?: string;
    category?: string;
    description?: string;
    tubeType?: string;
    entries?: { laboratoryId: string; localTestName: string; price?: number | null; code?: string | null; duration?: string | null; laboratory?: { id: string; name: string } }[];
  };
}

export default function TestMappingForm({
  open,
  onClose,
  onSubmit,
  laboratories,
  editData,
}: TestMappingFormProps) {
  const [canonicalName, setCanonicalName] = useState("");
  const [code, setCode] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [tubeType, setTubeType] = useState("");
  const [entries, setEntries] = useState<MappingEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Pre-fill when editing
  useEffect(() => {
    if (editData) {
      setCanonicalName(editData.canonicalName || "");
      setCode(editData.code || "");
      setCategory(editData.category || "");
      setDescription(editData.description || "");
      setTubeType(editData.tubeType || "");
      setEntries(
        (editData.entries || []).map((e) => ({
          laboratoryId: e.laboratoryId || e.laboratory?.id || "",
          laboratoryName: e.laboratory?.name || "",
          testName: e.localTestName || "",
          price: e.price != null ? String(e.price) : "",
          code: e.code || "",
          duration: e.duration || "",
        }))
      );
    } else {
      setCanonicalName("");
      setCode("");
      setCategory("");
      setDescription("");
      setTubeType("");
      setEntries([]);
    }
  }, [editData, open]);

  const handleSubmit = async () => {
    if (!canonicalName || entries.length === 0) return;
    setIsLoading(true);
    try {
      await onSubmit({
        canonicalName, code, category, description, tubeType,
        entries: entries.map((e) => ({
          ...e,
          price: e.price !== "" ? parseFloat(e.price) : null,
          code: e.code || null,
          duration: e.duration || null,
        })),
      });
      setCanonicalName("");
      setCode("");
      setCategory("");
      setDescription("");
      setTubeType("");
      setEntries([]);
    } finally {
      setIsLoading(false);
    }
  };

  const updateEntry = (i: number, field: keyof MappingEntry, value: string) => {
    const updated = [...entries];
    updated[i] = { ...updated[i], [field]: value };
    setEntries(updated);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>
            {editData ? "Modifier la correspondance" : "Nouvelle correspondance de test"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Nom canonique (Master Test Name) *</Label>
              <Input
                value={canonicalName}
                onChange={(e) => setCanonicalName(e.target.value)}
                placeholder="Nom standard du test"
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label>Code</Label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Code du test (ex: GLU, HBA1C...)"
                autoComplete="off"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Catégorie</Label>
              <Input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Biochimie, Hématologie..."
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label>Type de tube</Label>
              <select
                value={tubeType}
                onChange={(e) => setTubeType(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground transition-colors hover:border-border/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background cursor-pointer"
              >
                <option value="">Sélectionner un type de tube</option>
                <option value="red">Rouge (sec)</option>
                <option value="purple">Violet (EDTA)</option>
                <option value="blue">Bleu (citrate)</option>
                <option value="green">Vert (héparine)</option>
                <option value="gold">Or (gel séparateur)</option>
                <option value="gray">Gris (fluorure)</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes / Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description ou notes sur cette correspondance..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Correspondances par laboratoire *</Label>
            {entries.map((entry, i) => (
              <div key={i} className="flex flex-col gap-1.5 rounded-md border border-border/50 bg-muted/20 p-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium truncate">{entry.laboratoryName}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={() => setEntries(entries.filter((_, idx) => idx !== i))}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    value={entry.testName}
                    onChange={(e) => updateEntry(i, "testName", e.target.value)}
                    placeholder="Nom du test dans ce labo"
                    autoComplete="off"
                  />
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={entry.price}
                    onChange={(e) => updateEntry(i, "price", e.target.value)}
                    placeholder="Prix ($)"
                  />
                  <Input
                    value={entry.code}
                    onChange={(e) => updateEntry(i, "code", e.target.value)}
                    placeholder="Code labo (ex: CDL-GLU)"
                    autoComplete="off"
                  />
                  <Input
                    value={entry.duration}
                    onChange={(e) => updateEntry(i, "duration", e.target.value)}
                    placeholder="Délai (ex: Même jour, 24h)"
                    autoComplete="off"
                  />
                </div>
              </div>
            ))}
            <div className="flex flex-wrap gap-2 mt-2">
              {laboratories
                .filter((lab) => !entries.find((e) => e.laboratoryId === lab.id))
                .map((lab) => (
                  <Button
                    key={lab.id}
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setEntries([
                        ...entries,
                        { laboratoryId: lab.id, laboratoryName: lab.name, testName: "", price: "", code: "", duration: "" },
                      ])
                    }
                  >
                    <Plus className="h-3 w-3 mr-1" /> {lab.name}
                  </Button>
                ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !canonicalName || entries.length === 0}
          >
            {isLoading ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
