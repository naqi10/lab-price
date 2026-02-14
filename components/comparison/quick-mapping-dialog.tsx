"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface QuickMappingDialogProps {
  open: boolean;
  onClose: () => void;
  testMappingId: string;
  laboratoryId: string;
  testName?: string;
  labName?: string;
  onCreated: () => void;
}

/**
 * Allows admin to quickly add a lab-specific test name to an existing mapping
 * directly from the comparison page (for missing or incorrect matches).
 */
export default function QuickMappingDialog({
  open,
  onClose,
  testMappingId,
  laboratoryId,
  testName,
  labName,
  onCreated,
}: QuickMappingDialogProps) {
  const [localTestName, setLocalTestName] = useState("");
  const [price, setPrice] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!localTestName.trim()) {
      setError("Le nom du test local est requis");
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      // Add a new entry to the existing test mapping
      const res = await fetch(`/api/tests/mappings/${testMappingId}/entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          laboratoryId,
          localTestName: localTestName.trim(),
          matchType: "MANUAL",
          similarity: 1.0,
          price: price ? parseFloat(price) : null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setLocalTestName("");
        setPrice("");
        onCreated();
        onClose();
      } else {
        setError(data.message || "Erreur lors de la création");
      }
    } catch {
      setError("Erreur réseau");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Créer une correspondance manuelle</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {testName && (
            <p className="text-sm text-muted-foreground">
              Test : <strong>{testName}</strong>
            </p>
          )}
          {labName && (
            <p className="text-sm text-muted-foreground">
              Laboratoire : <strong>{labName}</strong>
            </p>
          )}
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="localTestName">
              Nom du test dans ce laboratoire *
            </Label>
            <Input
              id="localTestName"
              value={localTestName}
              onChange={(e) => setLocalTestName(e.target.value)}
              placeholder="Nom exact du test chez ce labo"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="price">Prix (optionnel)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Prix en MAD"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || !localTestName.trim()}>
            {isLoading ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
