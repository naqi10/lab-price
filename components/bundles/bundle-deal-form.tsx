"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import TestMappingPicker from "./test-mapping-picker";
import { CATEGORY_COLORS } from "@/lib/data/bundles";

interface BundleDealFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<any>;
  editData?: {
    id: string;
    dealName: string;
    description: string;
    category: string;
    icon: string;
    customRate: number;
    popular: boolean;
    testMappingIds: string[];
    isActive: boolean;
    sortOrder: number;
  };
}

const CATEGORIES = Object.keys(CATEGORY_COLORS);

export default function BundleDealForm({ open, onClose, onSubmit, editData }: BundleDealFormProps) {
  const [dealName, setDealName] = useState("");
  const [icon, setIcon] = useState("");
  const [category, setCategory] = useState("");
  const [customRate, setCustomRate] = useState("");
  const [description, setDescription] = useState("");
  const [popular, setPopular] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState("0");
  const [testMappingIds, setTestMappingIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (editData) {
      setDealName(editData.dealName);
      setIcon(editData.icon);
      setCategory(editData.category);
      setCustomRate(String(editData.customRate));
      setDescription(editData.description);
      setPopular(editData.popular);
      setIsActive(editData.isActive);
      setSortOrder(String(editData.sortOrder));
      setTestMappingIds(editData.testMappingIds);
    } else {
      setDealName("");
      setIcon("");
      setCategory("");
      setCustomRate("");
      setDescription("");
      setPopular(false);
      setIsActive(true);
      setSortOrder("0");
      setTestMappingIds([]);
    }
  }, [editData, open]);

  const handleSubmit = async () => {
    if (!dealName || !category || !customRate) return;
    setIsLoading(true);
    try {
      const result = await onSubmit({
        dealName,
        icon,
        category,
        customRate: parseFloat(customRate),
        description,
        popular,
        isActive,
        sortOrder: parseInt(sortOrder, 10) || 0,
        testMappingIds,
      });
      if (result?.success) {
        onClose();
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editData ? "Modifier l'offre groupée" : "Nouvelle offre groupée"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Row 1: Name + Icon */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Nom de l&apos;offre *</Label>
              <Input
                value={dealName}
                onChange={(e) => setDealName(e.target.value)}
                placeholder="Bilan Lipidique"
              />
            </div>
            <div className="space-y-2">
              <Label>Icône (emoji)</Label>
              <Input
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="🩸"
              />
            </div>
          </div>

          {/* Row 2: Category + Rate */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Catégorie *</Label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground transition-colors hover:border-border/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background cursor-pointer"
              >
                <option value="">Sélectionner une catégorie</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
                <option value="__custom">Autre...</option>
              </select>
              {category === "__custom" && (
                <Input
                  value=""
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Nom de la catégorie"
                  autoFocus
                />
              )}
            </div>
            <div className="space-y-2">
              <Label>Tarif personnalisé (MAD) *</Label>
              <Input
                type="number"
                value={customRate}
                onChange={(e) => setCustomRate(e.target.value)}
                placeholder="150"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          {/* Row 3: Description */}
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description de l'offre..."
              rows={2}
            />
          </div>

          {/* Row 4: Options */}
          <div className="grid gap-4 md:grid-cols-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={popular}
                onChange={(e) => setPopular(e.target.checked)}
                className="rounded border-input"
              />
              <span className="text-sm">Populaire</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded border-input"
              />
              <span className="text-sm">Actif</span>
            </label>
            <div className="space-y-1">
              <Label className="text-xs">Ordre de tri</Label>
              <Input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                min="0"
                className="h-8"
              />
            </div>
          </div>

          {/* Row 5: Test picker */}
          <div className="space-y-2">
            <Label>Tests inclus</Label>
            <TestMappingPicker
              selectedIds={testMappingIds}
              onChange={setTestMappingIds}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !dealName || !category || !customRate}
          >
            {isLoading ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
