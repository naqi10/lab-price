"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface QuotationFormProps {
  onSubmit: (data: {
    title: string;
    laboratoryId: string;
    testMappingIds: string[];
    clientName?: string;
    clientEmail?: string;
    clientReference?: string;
    notes?: string;
    taxRate?: number;
  }) => Promise<any>;
  isLoading?: boolean;
  laboratoryId?: string;
  testMappingIds?: string[];
  onPreview?: (data: any) => void;
}

export default function QuotationForm({
  onSubmit,
  isLoading,
  laboratoryId: initialLabId,
  testMappingIds: initialTestIds,
}: QuotationFormProps) {
  const [title, setTitle] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientReference, setClientReference] = useState("");
  const [notes, setNotes] = useState("");
  const [taxRate, setTaxRate] = useState<number>(20);
  const [laboratoryId, setLaboratoryId] = useState(initialLabId || "");
  const [testMappingIds, setTestMappingIds] = useState<string[]>(initialTestIds || []);
  const [error, setError] = useState<string | null>(null);

  // Lab & test data for selection
  const [laboratories, setLaboratories] = useState<{ id: string; name: string }[]>([]);
  const [testMappings, setTestMappings] = useState<{ id: string; canonicalName: string }[]>([]);

  useEffect(() => {
    // Only load labs/tests if not pre-filled from comparison
    if (!initialLabId) {
      fetch("/api/laboratories").then((r) => r.json()).then((d) => {
        if (d.success) setLaboratories(d.data || []);
      });
    }
    fetch("/api/tests/mappings").then((r) => r.json()).then((d) => {
      if (d.success) setTestMappings(d.data || []);
    });
  }, [initialLabId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) { setError("Le titre est requis"); return; }
    if (!laboratoryId) { setError("Le laboratoire est requis"); return; }
    if (testMappingIds.length === 0) { setError("Sélectionnez au moins un test"); return; }

    const result = await onSubmit({
      title: title.trim(),
      laboratoryId,
      testMappingIds,
      clientName: clientName.trim() || undefined,
      clientEmail: clientEmail.trim() || undefined,
      clientReference: clientReference.trim() || undefined,
      notes: notes.trim() || undefined,
      taxRate: taxRate ?? 20,
    });

    if (result && !result.success) {
      setError(result.message || "Erreur lors de la création");
    }
  };

  const toggleTest = (id: string) => {
    setTestMappingIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      <div className="space-y-2">
        <Label htmlFor="title">Titre du devis *</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex: Devis analyses biochimiques"
        />
      </div>

      {/* Laboratory selector - only show if not pre-filled */}
      {!initialLabId ? (
        <div className="space-y-2">
          <Label htmlFor="laboratoryId">Laboratoire *</Label>
          <select
            id="laboratoryId"
            value={laboratoryId}
            onChange={(e) => setLaboratoryId(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">Sélectionner un laboratoire</option>
            {laboratories.map((lab) => (
              <option key={lab.id} value={lab.id}>{lab.name}</option>
            ))}
          </select>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Laboratoire sélectionné depuis la comparaison.
        </p>
      )}

      {/* Test selection */}
      <div className="space-y-2">
        <Label>Tests sélectionnés ({testMappingIds.length}) *</Label>
        {initialTestIds && initialTestIds.length > 0 ? (
          <p className="text-sm text-muted-foreground">
            {testMappingIds.length} test(s) sélectionné(s) depuis la comparaison.
          </p>
        ) : (
          <div className="max-h-[200px] overflow-auto rounded-md border p-2 space-y-1">
            {testMappings.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-2">Aucun test disponible</p>
            ) : (
              testMappings.map((tm) => (
                <label key={tm.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-accent cursor-pointer">
                  <input
                    type="checkbox"
                    checked={testMappingIds.includes(tm.id)}
                    onChange={() => toggleTest(tm.id)}
                    className="rounded"
                  />
                  <span className="text-sm">{tm.canonicalName}</span>
                </label>
              ))
            )}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="clientName">Nom du client</Label>
        <Input
          id="clientName"
          type="text"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          placeholder="Nom du client"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="clientEmail">Email du client</Label>
        <Input
          id="clientEmail"
          type="email"
          value={clientEmail}
          onChange={(e) => setClientEmail(e.target.value)}
          placeholder="email@exemple.com"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="taxRate">Taux de TVA (%)</Label>
        <Input
          id="taxRate"
          type="number"
          min={0}
          max={100}
          step={0.01}
          value={taxRate}
          onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
          placeholder="20"
        />
        <p className="text-xs text-muted-foreground">0 pour aucun impôt</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="clientReference">Référence client (optionnel)</Label>
        <Input
          id="clientReference"
          value={clientReference}
          onChange={(e) => setClientReference(e.target.value)}
          placeholder="Réf. client, N° dossier..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes (optionnel)</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes supplémentaires..."
        />
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? "Génération en cours..." : "Générer le devis"}
      </Button>
    </form>
  );
}
