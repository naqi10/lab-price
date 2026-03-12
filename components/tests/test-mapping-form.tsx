"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, FlaskConical, DollarSign, Clock3 } from "lucide-react";
import { parseTubeColor } from "@/lib/tube-colors";
import { buildTurnaroundString, parseTurnaroundParts, type TurnaroundUnit } from "@/lib/turnaround";

interface MappingEntry {
  laboratoryId: string;
  laboratoryName: string;
  testName: string;
  price: string;
  code: string;
  durationValue: string;
  durationUnit: TurnaroundUnit;
}

const TUBE_OPTIONS = [
  { value: "red", label: "Rouge (sec)", dot: "🔴" },
  { value: "purple", label: "Violet (EDTA)", dot: "🟣" },
  { value: "blue", label: "Bleu (citrate)", dot: "🔵" },
  { value: "green", label: "Vert (héparine)", dot: "🟢" },
  { value: "gold", label: "Or (gel séparateur)", dot: "🟡" },
  { value: "gray", label: "Gris (fluorure)", dot: "⚪" },
];

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
    entries?: {
      laboratoryId: string;
      localTestName: string;
      price?: number | null;
      code?: string | null;
      duration?: string | null;
      tests?: { code?: string | null; turnaroundTime?: string | null }[];
      laboratory?: { id: string; name: string };
    }[];
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
      const entryByLab = new Map(
        (editData.entries || []).map((e) => [e.laboratoryId || e.laboratory?.id || "", e])
      );
      setEntries(
        laboratories.map((lab) => {
          const e = entryByLab.get(lab.id);
          const fallback = e?.tests?.[0];
          return {
            laboratoryId: lab.id,
            laboratoryName: lab.name,
            testName: e?.localTestName || "",
            price: e?.price != null ? String(e.price) : "",
            // Prefer explicit mapping fields, then fallback to seeded active tests.
            code: e?.code || fallback?.code || "",
            durationValue: parseTurnaroundParts(e?.duration || fallback?.turnaroundTime || "")?.value?.toString() || "",
            durationUnit: parseTurnaroundParts(e?.duration || fallback?.turnaroundTime || "")?.unit || "days",
          };
        })
      );
    } else {
      setCanonicalName("");
      setCode("");
      setCategory("");
      setDescription("");
      setTubeType("");
      setEntries(
        laboratories.map((lab) => ({
          laboratoryId: lab.id,
          laboratoryName: lab.name,
          testName: "",
          price: "",
          code: "",
          durationValue: "",
          durationUnit: "days",
        }))
      );
    }
  }, [editData, open, laboratories]);

  const handleSubmit = async () => {
    const validEntries = entries.filter((e) => e.testName.trim().length > 0);
    if (!canonicalName || validEntries.length === 0) return;
    setIsLoading(true);
    try {
      await onSubmit({
        canonicalName, code, category, description, tubeType,
        entries: validEntries.map((e) => ({
          ...e,
          price: e.price !== "" ? parseFloat(e.price) : null,
          code: e.code || null,
          duration: buildTurnaroundString(e.durationValue, e.durationUnit),
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
                {TUBE_OPTIONS.map((tube) => (
                  <option key={tube.value} value={tube.value}>
                    {tube.dot} {tube.label}
                  </option>
                ))}
              </select>
              {tubeType && (() => {
                const tube = parseTubeColor(tubeType);
                if (!tube) return null;
                return (
                  <div className="inline-flex items-center gap-2 rounded-md border border-border/60 bg-muted/30 px-2.5 py-1 text-xs text-foreground">
                    <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: tube.color }} />
                    <span>{tube.label}</span>
                  </div>
                );
              })()}
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
              <div key={entry.laboratoryId} className="rounded-lg border border-border/60 bg-card overflow-hidden">
                {/* Lab header strip */}
                <div className="flex items-center justify-between px-3 py-2 bg-primary/5 border-b border-primary/10">
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary/90">
                    <FlaskConical className="h-3.5 w-3.5 shrink-0" />
                    {entry.laboratoryName}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 hover:bg-destructive/10"
                    title="Effacer les champs"
                    onClick={() =>
                      setEntries((prev) =>
                        prev.map((row, idx) =>
                          idx === i
                            ? { ...row, testName: "", price: "", code: "", durationValue: "", durationUnit: "days" }
                            : row
                        )
                      )
                    }
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
                {/* Fields */}
                <div className="p-2.5 grid grid-cols-2 gap-2">
                  <Input
                    value={entry.testName}
                    onChange={(e) => updateEntry(i, "testName", e.target.value)}
                    placeholder="Nom du test dans ce labo"
                    autoComplete="off"
                  />
                  <div className="relative">
                    <DollarSign className="h-3.5 w-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={entry.price}
                      onChange={(e) => updateEntry(i, "price", e.target.value)}
                      placeholder="Prix"
                      className="pl-7"
                    />
                  </div>
                  <Input
                    value={entry.code}
                    onChange={(e) => updateEntry(i, "code", e.target.value)}
                    placeholder="Code labo (ex: CDL-GLU)"
                    autoComplete="off"
                  />
                  <div className="grid grid-cols-[1fr_88px] gap-2">
                    <div className="relative">
                      <Clock3 className="h-3.5 w-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <Input
                        type="number"
                        min="0"
                        step="0.5"
                        value={entry.durationValue}
                        onChange={(e) => updateEntry(i, "durationValue", e.target.value)}
                        placeholder="Délai"
                        autoComplete="off"
                        className="pl-7"
                      />
                    </div>
                    <select
                      value={entry.durationUnit}
                      onChange={(e) => updateEntry(i, "durationUnit", e.target.value as TurnaroundUnit)}
                      className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm font-medium text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
                    >
                      <option value="hours">heures</option>
                      <option value="days">jours</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
            <div className="flex flex-wrap gap-2 mt-2">
              {laboratories.map((lab) => {
                const existing = entries.find((e) => e.laboratoryId === lab.id);
                const isFilled = !!existing?.testName || !!existing?.price || !!existing?.code || !!existing?.durationValue;
                if (isFilled) return null;
                return (
                  <Button
                    key={lab.id}
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setEntries((prev) =>
                        prev.map((row) =>
                          row.laboratoryId === lab.id
                            ? { ...row, testName: row.testName || canonicalName }
                            : row
                        )
                      )
                    }
                  >
                    <Plus className="h-3 w-3 mr-1" /> {lab.name}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !canonicalName || entries.every((e) => e.testName.trim().length === 0)}
          >
            {isLoading ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
