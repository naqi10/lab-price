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
}

interface TestMappingFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<any>;
  laboratories: { id: string; name: string }[];
  /** If set, the form is in edit mode and pre-fills values. */
  editData?: {
    canonicalName: string;
    category?: string;
    description?: string;
    entries?: { laboratoryId: string; localTestName: string; laboratory?: { id: string; name: string } }[];
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
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [entries, setEntries] = useState<MappingEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Pre-fill when editing
  useEffect(() => {
    if (editData) {
      setCanonicalName(editData.canonicalName || "");
      setCategory(editData.category || "");
      setDescription(editData.description || "");
      setEntries(
        (editData.entries || []).map((e) => ({
          laboratoryId: e.laboratoryId || e.laboratory?.id || "",
          laboratoryName: e.laboratory?.name || "",
          testName: e.localTestName || "",
        }))
      );
    } else {
      setCanonicalName("");
      setCategory("");
      setDescription("");
      setEntries([]);
    }
  }, [editData, open]);

  const handleSubmit = async () => {
    if (!canonicalName || entries.length === 0) return;
    setIsLoading(true);
    try {
      await onSubmit({ canonicalName, category, description, entries });
      setCanonicalName("");
      setCategory("");
      setDescription("");
      setEntries([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
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
              />
            </div>
            <div className="space-y-2">
              <Label>Catégorie</Label>
              <Input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Biochimie, Hématologie..."
              />
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
              <div key={i} className="flex items-center gap-2">
                <span className="text-sm font-medium min-w-[150px] truncate">
                  {entry.laboratoryName}
                </span>
                <Input
                  value={entry.testName}
                  onChange={(e) => {
                    const updated = [...entries];
                    updated[i].testName = e.target.value;
                    setEntries(updated);
                  }}
                  placeholder="Nom du test dans ce labo"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setEntries(entries.filter((_, idx) => idx !== i))}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
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
                        { laboratoryId: lab.id, laboratoryName: lab.name, testName: "" },
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
