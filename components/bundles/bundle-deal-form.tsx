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
  const [customCategory, setCustomCategory] = useState("");
  const [isCustomCategory, setIsCustomCategory] = useState(false);
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
      const custom = !CATEGORIES.includes(editData.category);
      setIsCustomCategory(custom);
      setCustomCategory(custom ? editData.category : "");
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
      setIsCustomCategory(false);
      setCustomCategory("");
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>{editData ? "Modifier l'offre groupée" : "Nouvelle offre groupée"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Row 1: Name */}
          <div className="space-y-2">
            <Label htmlFor="bundle-dealName">Nom de l&apos;offre *</Label>
            <Input
              id="bundle-dealName"
              name="dealName"
              value={dealName}
              onChange={(e) => setDealName(e.target.value)}
              placeholder="Bilan Lipidique"
              autoComplete="off"
            />
          </div>

          {/* Row 2: Category + Rate */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="bundle-category">Catégorie *</Label>
              <select
                id="bundle-category"
                name="category"
                value={isCustomCategory ? "__custom" : category}
                onChange={(e) => {
                  const nextValue = e.target.value;
                  if (nextValue === "__custom") {
                    setIsCustomCategory(true);
                    setCategory(customCategory.trim());
                    return;
                  }
                  setIsCustomCategory(false);
                  setCategory(nextValue);
                }}
                className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground transition-colors hover:border-border/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background cursor-pointer"
              >
                <option value="">Sélectionner une catégorie</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
                <option value="__custom">Autre...</option>
              </select>
              {isCustomCategory && (
                <Input
                  id="bundle-customCategory"
                  name="customCategory"
                  value={customCategory}
                  onChange={(e) => {
                    const value = e.target.value;
                    setCustomCategory(value);
                    setCategory(value.trim());
                  }}
                  placeholder="Nom de la catégorie"
                  autoComplete="off"
                />
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="bundle-customRate">Tarif personnalisé ($) *</Label>
              <Input
                id="bundle-customRate"
                name="customRate"
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
            <Label htmlFor="bundle-description">Description</Label>
            <Textarea
              id="bundle-description"
              name="description"
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
                id="bundle-popular"
                name="popular"
                type="checkbox"
                checked={popular}
                onChange={(e) => setPopular(e.target.checked)}
                className="rounded border-input"
              />
              <span className="text-sm">Populaire</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                id="bundle-isActive"
                name="isActive"
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded border-input"
              />
              <span className="text-sm">Actif</span>
            </label>
            <div className="space-y-1">
              <Label htmlFor="bundle-sortOrder" className="text-xs">Ordre de tri</Label>
              <Input
                id="bundle-sortOrder"
                name="sortOrder"
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
