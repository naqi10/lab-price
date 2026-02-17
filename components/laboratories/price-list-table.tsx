"use client";

import React, { useState } from "react";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye, EyeOff, ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import PriceListActions from "@/components/laboratories/price-list-actions";

type TestRow = {
  id: string;
  name: string;
  code: string | null;
  price: number;
  category: string | null;
  isActive: boolean;
};

export default function PriceListTable({
  labId,
  priceLists,
  onDelete,
  onActivate,
}: {
  labId: string;
  priceLists: any[];
  onDelete?: (id: string) => void;
  onActivate?: () => void;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [testsByList, setTestsByList] = useState<Record<string, TestRow[]>>({});
  const [loadingListId, setLoadingListId] = useState<string | null>(null);
  const [savingTestId, setSavingTestId] = useState<string | null>(null);
  const [editingPriceTestId, setEditingPriceTestId] = useState<string | null>(null);
  const [editPriceValue, setEditPriceValue] = useState<string>("");

  const [searchByList, setSearchByList] = useState<Record<string, string>>({});
  const [categoryByList, setCategoryByList] = useState<Record<string, string>>({});
  const [hideInactiveByList, setHideInactiveByList] = useState<Record<string, boolean>>({});

  const fetchTests = async (listId: string) => {
    setLoadingListId(listId);
    try {
      const res = await fetch(
        `/api/laboratories/${labId}/price-lists/${listId}/tests`
      );
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setTestsByList((prev) => ({ ...prev, [listId]: data.data }));
      }
    } finally {
      setLoadingListId(null);
    }
  };

  const toggleExpand = (listId: string) => {
    setExpandedId((prev) => (prev === listId ? null : listId));
    if (expandedId !== listId && !testsByList[listId]) {
      fetchTests(listId);
    }
  };

  const patchTest = async (
    testId: string,
    payload: { price?: number; isActive?: boolean }
  ) => {
    setSavingTestId(testId);
    try {
      const res = await fetch(`/api/tests/${testId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success && data.data) {
        const listId = expandedId;
        if (listId && testsByList[listId]) {
          setTestsByList((prev) => ({
            ...prev,
            [listId]: prev[listId].map((t) =>
              t.id === testId ? { ...t, ...data.data } : t
            ),
          }));
        }
      }
    } finally {
      setSavingTestId(null);
    }
  };

  const startEditPrice = (test: TestRow) => {
    setEditingPriceTestId(test.id);
    setEditPriceValue(String(test.price));
  };

  const saveEditPrice = (testId: string) => {
    const num = parseFloat(editPriceValue);
    if (!Number.isNaN(num) && num >= 0) {
      patchTest(testId, { price: num });
    }
    setEditingPriceTestId(null);
    setEditPriceValue("");
  };

  const getFilteredTests = (listId: string): TestRow[] => {
    const tests = testsByList[listId] ?? [];
    const search = (searchByList[listId] ?? "").trim().toLowerCase();
    const category = categoryByList[listId] ?? "";
    const hideInactive = hideInactiveByList[listId] ?? false;

    return tests.filter((t) => {
      if (hideInactive && !t.isActive) return false;
      if (search && !t.name.toLowerCase().includes(search)) return false;
      if (category && (t.category ?? "") !== category) return false;
      return true;
    });
  };

  const getUniqueCategories = (listId: string): string[] => {
    const tests = testsByList[listId] ?? [];
    const set = new Set<string>();
    tests.forEach((t) => {
      if (t.category) set.add(t.category);
    });
    return Array.from(set).sort();
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-8" />
          <TableHead>Fichier</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Tests</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Statut</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {priceLists.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
              Aucune liste de prix
            </TableCell>
          </TableRow>
        ) : (
          priceLists.map((pl) => (
            <React.Fragment key={pl.id}>
              <TableRow
                key={pl.id}
                className="cursor-pointer"
                onClick={() => toggleExpand(pl.id)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleExpand(pl.id); } }}
                tabIndex={0}
                role="button"
                aria-expanded={expandedId === pl.id}
              >
                <TableCell className="w-8">
                  {expandedId === pl.id ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </TableCell>
                <TableCell className="font-medium">{pl.fileName}</TableCell>
                <TableCell>
                  <Badge variant="outline">{pl.fileType}</Badge>
                </TableCell>
                <TableCell>{pl._count?.tests ?? 0}</TableCell>
                <TableCell>{formatDate(new Date(pl.createdAt))}</TableCell>
                <TableCell>
                  <Badge variant={pl.isActive ? "success" : "secondary"}>
                    {pl.isActive ? "Actif" : "Inactif"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <PriceListActions
                    priceListId={pl.id}
                    laboratoryId={labId}
                    isActive={pl.isActive}
                    onDelete={onDelete}
                    onActivate={onActivate}
                  />
                </TableCell>
              </TableRow>
              {expandedId === pl.id && (
                <TableRow key={`${pl.id}-expanded`}>
                  <TableCell colSpan={7} className="bg-muted/30 p-4">
                    {loadingListId === pl.id ? (
                      <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground" role="status" aria-live="polite">
                        <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                        <span>Chargement des tests…</span>
                      </div>
                    ) : (
                      <ExpandedTestsSection
                        tests={getFilteredTests(pl.id)}
                        categories={getUniqueCategories(pl.id)}
                        search={searchByList[pl.id] ?? ""}
                        onSearchChange={(v) =>
                          setSearchByList((prev) => ({ ...prev, [pl.id]: v }))
                        }
                        categoryFilter={categoryByList[pl.id] ?? ""}
                        onCategoryChange={(v) =>
                          setCategoryByList((prev) => ({ ...prev, [pl.id]: v }))
                        }
                        hideInactive={hideInactiveByList[pl.id] ?? false}
                        onHideInactiveChange={(v) =>
                          setHideInactiveByList((prev) => ({ ...prev, [pl.id]: v }))
                        }
                        savingTestId={savingTestId}
                        editingPriceTestId={editingPriceTestId}
                        editPriceValue={editPriceValue}
                        onEditPriceValue={setEditPriceValue}
                        onStartEditPrice={startEditPrice}
                        onSaveEditPrice={saveEditPrice}
                        onCancelEditPrice={() => {
                          setEditingPriceTestId(null);
                          setEditPriceValue("");
                        }}
                        onToggleActive={patchTest}
                      />
                    )}
                  </TableCell>
                </TableRow>
              )}
            </React.Fragment>
          ))
        )}
      </TableBody>
    </Table>
  );
}

function ExpandedTestsSection({
  tests,
  categories,
  search,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
  hideInactive,
  onHideInactiveChange,
  savingTestId,
  editingPriceTestId,
  editPriceValue,
  onEditPriceValue,
  onStartEditPrice,
  onSaveEditPrice,
  onCancelEditPrice,
  onToggleActive,
}: {
  tests: TestRow[];
  categories: string[];
  search: string;
  onSearchChange: (v: string) => void;
  categoryFilter: string;
  onCategoryChange: (v: string) => void;
  hideInactive: boolean;
  onHideInactiveChange: (v: boolean) => void;
  savingTestId: string | null;
  editingPriceTestId: string | null;
  editPriceValue: string;
  onEditPriceValue: (v: string) => void;
  onStartEditPrice: (test: TestRow) => void;
  onSaveEditPrice: (testId: string) => void;
  onCancelEditPrice: () => void;
  onToggleActive: (testId: string, payload: { isActive?: boolean }) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Rechercher par nom…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="max-w-xs"
        />
        <select
          value={categoryFilter}
          onChange={(e) => onCategoryChange(e.target.value)}
          aria-label="Filtrer par catégorie"
          className="flex h-10 w-full max-w-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="">Toutes les catégories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={hideInactive}
            onChange={(e) => onHideInactiveChange(e.target.checked)}
            className="rounded border-input"
          />
          Masquer les tests inactifs
        </label>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>Code</TableHead>
            <TableHead>Prix</TableHead>
            <TableHead>Catégorie</TableHead>
            <TableHead className="text-center">Actif</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tests.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground py-4">
                Aucun test à afficher
              </TableCell>
            </TableRow>
          ) : (
            tests.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-medium">{t.name}</TableCell>
                <TableCell className="text-muted-foreground">{t.code ?? "—"}</TableCell>
                <TableCell className="w-32">
                  {editingPriceTestId === t.id ? (
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      value={editPriceValue}
                      onChange={(e) => onEditPriceValue(e.target.value)}
                      onBlur={() => onSaveEditPrice(t.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") onSaveEditPrice(t.id);
                        if (e.key === "Escape") onCancelEditPrice();
                      }}
                      autoFocus
                      className="h-8 w-24"
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (savingTestId !== t.id) onStartEditPrice(t);
                      }}
                      className="text-left w-full rounded px-2 py-1 hover:bg-muted min-h-8 flex items-center"
                    >
                      {savingTestId === t.id ? (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      ) : (
                        <span>{Number(t.price).toFixed(2)}</span>
                      )}
                    </button>
                  )}
                </TableCell>
                <TableCell>
                  {t.category ? (
                    <Badge variant="outline">{t.category}</Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleActive(t.id, { isActive: !t.isActive });
                    }}
                    aria-label={t.isActive ? "Désactiver" : "Activer"}
                  >
                    {t.isActive ? (
                      <Eye className="h-4 w-4 text-green-600" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
