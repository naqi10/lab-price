"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Search, FileText, ChevronLeft, ChevronRight, X, Plus,
} from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { useRouter } from "next/navigation";
import { ExpandableEstimateRow } from "./expandable-estimate-row";

// ─── Types ───────────────────────────────────────────────

interface TestMappingEntry {
  id: string;
  localTestName?: string;
  laboratory?: { id: string; name: string; code?: string };
  laboratoryId?: string;
  laboratoryName?: string;
  laboratoryCode?: string;
  price?: number | null;
  customPrice?: number;
}

interface TestMappingDetail {
  id: string;
  canonicalName: string;
  entries: TestMappingEntry[];
}

interface Estimate {
  id: string;
  estimateNumber: string;
  totalPrice: number;
  status: string;
  createdAt: string;
  sentAt: string | null;
  validUntil: string | null;
  selectionMode?: string | null;
  customer: { name: string; email: string } | null;
  createdBy: { name: string };
  notes: string | null;
  testMappingIds: string[];
  selections?: Record<string, string> | null;
  customPrices?: Record<string, number>;
  testMappingDetails?: TestMappingDetail[];
  _count?: { emailLogs: number };
}

interface Meta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface EstimatesTableProps {
  onDownload: (id: string) => Promise<void>;
  downloadingId?: string | null;
  selectedEstimates?: Set<string>;
  onSelectEstimate?: (id: string) => void;
  onSelectAll?: (all: boolean) => void;
}

// ─── Helpers ─────────────────────────────────────────────

function transformEstimateForDisplay(estimate: Estimate): Estimate {
  if (!estimate.testMappingDetails) return estimate;

  let customPricesObj: Record<string, number> = {};
  if (estimate.customPrices) {
    try {
      customPricesObj = typeof estimate.customPrices === "string"
        ? JSON.parse(estimate.customPrices)
        : estimate.customPrices;
    } catch {
      customPricesObj = {};
    }
  }

  const transformedDetails = estimate.testMappingDetails.map((detail) => ({
    id: detail.id,
    canonicalName: detail.canonicalName,
    entries: detail.entries.map((entry) => {
      const labId = entry.laboratory?.id || entry.laboratoryId;
      const labName = entry.laboratory?.name || entry.laboratoryName;
      const labCode = entry.laboratory?.code || entry.laboratoryCode || "";
      const customPrice = entry.customPrice !== undefined
        ? entry.customPrice
        : customPricesObj[`${detail.id}-${labId}`];

      return {
        laboratoryId: labId,
        laboratoryName: labName,
        laboratoryCode: labCode,
        price: entry.price || 0,
        customPrice,
      };
    }),
  }));

  return { ...estimate, testMappingDetails: transformedDetails as any };
}

const getStatusBadge = (status: string) => {
  const variants: Record<string, "default" | "secondary" | "destructive"> = {
    DRAFT: "secondary",
    SENT: "default",
    ACCEPTED: "default",
    REJECTED: "destructive",
  };
  const labels: Record<string, string> = {
    DRAFT: "Brouillon",
    SENT: "Envoyé",
    ACCEPTED: "Accepté",
    REJECTED: "Rejeté",
  };
  return (
    <Badge variant={variants[status] || "secondary"}>
      {labels[status] || status}
    </Badge>
  );
};

const PAGE_SIZE = 20;

// ─── Component ───────────────────────────────────────────

export default function EstimatesTable({
  onDownload,
  downloadingId,
  selectedEstimates,
  onSelectEstimate,
  onSelectAll,
}: EstimatesTableProps) {
  const router = useRouter();

  // Data
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [meta, setMeta] = useState<Meta>({ page: 1, limit: PAGE_SIZE, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const debouncedQ = useDebounce(q, 350);
  const abortRef = useRef<AbortController | null>(null);

  const fetchEstimates = useCallback(async (p: number) => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(p),
        limit: String(PAGE_SIZE),
      });
      if (debouncedQ) params.set("search", debouncedQ);

      const res = await fetch(`/api/estimates?${params}`, { signal: abortRef.current.signal });
      const data = await res.json();
      if (data.success) {
        setEstimates(data.data.estimates);
        setMeta(data.data.pagination);
      } else {
        setError(data.message || "Erreur de chargement");
      }
    } catch (err: any) {
      if (err.name !== "AbortError") setError("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  }, [debouncedQ]);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [debouncedQ]);
  useEffect(() => { fetchEstimates(page); }, [fetchEstimates, page]);

  const hasActiveFilters = !!debouncedQ;

  const clearFilters = () => {
    setQ("");
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const res = await fetch(`/api/estimates/${deleteTarget}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Erreur lors de la suppression");
    setDeleteTarget(null);
    fetchEstimates(page);
  };

  return (
    <TooltipProvider>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Estimations
              {!loading && (
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  ({meta.total.toLocaleString("fr-FR")} au total)
                </span>
              )}
            </CardTitle>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 text-xs gap-1">
                <X className="h-3 w-3" />
                Effacer
              </Button>
            )}
          </div>

          {/* Search */}
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher par numéro, client, email..."
              className="pl-9 h-9"
            />
            {q && (
              <button
                onClick={() => setQ("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

        </CardHeader>

        <CardContent className="p-0">
          {error && <p className="text-sm text-destructive px-6 py-4">{error}</p>}

          {loading ? (
            <div className="px-6 pb-6 space-y-2">
              {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : estimates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="h-12 w-12 rounded-full bg-muted/40 border border-border/50 flex items-center justify-center">
                <FileText className="h-5 w-5 text-muted-foreground/60" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground/70">Aucune estimation trouvée</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {hasActiveFilters ? "Essayez de modifier vos filtres" : "Créez une estimation depuis la page de comparaison"}
                </p>
              </div>
              {hasActiveFilters ? (
                <Button size="sm" variant="outline" onClick={clearFilters} className="mt-1">
                  Effacer les filtres
                </Button>
              ) : (
                <Button size="sm" variant="outline" onClick={() => router.push("/comparison")} className="mt-1">
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Nouvelle estimation
                </Button>
              )}
            </div>
          ) : (
            <>
              <Table className="w-full">
                <TableHeader>
                  <TableRow>
                    {onSelectEstimate && (
                      <TableHead className="w-10">
                        <input
                          type="checkbox"
                          checked={estimates.length > 0 && selectedEstimates?.size === estimates.length}
                          onChange={(e) => onSelectAll?.(e.target.checked)}
                          className="rounded"
                        />
                      </TableHead>
                    )}
                    <TableHead>Numéro</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead className="w-px whitespace-nowrap">Tests</TableHead>
                    <TableHead className="w-px whitespace-nowrap">Mode</TableHead>
                    <TableHead>Créé le</TableHead>
                    <TableHead>Validité</TableHead>
                    <TableHead>Prix</TableHead>
                    <TableHead className="w-px whitespace-nowrap">Statut</TableHead>
                    <TableHead className="w-px whitespace-nowrap">Emails</TableHead>
                    <TableHead className="w-10 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {estimates.map((estimate) => (
                    <ExpandableEstimateRow
                      key={estimate.id}
                      estimate={transformEstimateForDisplay(estimate) as any}
                      getStatusBadge={getStatusBadge}
                      onRowClick={() => router.push(`/estimates/${estimate.id}`)}
                      onDownload={onDownload}
                      onDelete={(id) => setDeleteTarget(id)}
                      downloadingId={downloadingId}
                      isSelected={selectedEstimates?.has(estimate.id) || false}
                      onSelect={onSelectEstimate}
                    />
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between border-t border-border/40 px-4 py-3">
                <p className="text-xs text-muted-foreground">
                  {((meta.page - 1) * meta.limit) + 1}–{Math.min(meta.page * meta.limit, meta.total)} sur{" "}
                  {meta.total.toLocaleString("fr-FR")} estimations
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline" size="sm" className="h-7 w-7 p-0"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={meta.page <= 1 || loading}
                    aria-label="Page précédente"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>

                  {Array.from({ length: Math.min(meta.pages, 5) }, (_, i) => {
                    let pageNum: number;
                    if (meta.pages <= 5)                        pageNum = i + 1;
                    else if (meta.page <= 3)                    pageNum = i + 1;
                    else if (meta.page >= meta.pages - 2)       pageNum = meta.pages - 4 + i;
                    else                                        pageNum = meta.page - 2 + i;
                    return (
                      <Button
                        key={pageNum}
                        variant={pageNum === meta.page ? "default" : "ghost"}
                        size="sm"
                        className="h-7 w-7 p-0 text-xs"
                        onClick={() => setPage(pageNum)}
                        disabled={loading}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}

                  <Button
                    variant="outline" size="sm" className="h-7 w-7 p-0"
                    onClick={() => setPage((p) => Math.min(meta.pages, p + 1))}
                    disabled={meta.page >= meta.pages || loading}
                    aria-label="Page suivante"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Supprimer l'estimation"
        description="Cette estimation sera définitivement supprimée. Cette action est irréversible."
        confirmLabel="Supprimer"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </TooltipProvider>
  );
}
