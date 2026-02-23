"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import TestSearch from "@/components/tests/test-search";
import { DOMSafetyBoundary } from "@/components/dom-safety-boundary";
import DraftManager from "@/components/comparison/draft-manager";
import ComparisonTable from "@/components/comparison/comparison-table";
import LabCostSummary from "@/components/comparison/lab-cost-summary";
import MissingTestsAlert from "@/components/comparison/missing-tests-alert";
import EmailComparisonDialog from "@/components/comparison/email-comparison-dialog";
import SaveEstimateDialog from "@/components/comparison/save-estimate-dialog";
import QuickMappingDialog from "@/components/comparison/quick-mapping-dialog";
import { useTestCart } from "@/hooks/use-tests";
import { useComparison } from "@/hooks/use-comparison";
import { useLabColors } from "@/hooks/use-lab-colors";
import { useDashboardTitle } from "@/hooks/use-dashboard-title";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import {
  GitCompare,
  Package,
  Mail,
  Zap,
  Download,
  Loader2,
  Save,
  X,
  Search,
  FlaskConical,
  CheckCircle2,
  Plus,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────
interface ActiveDeal {
  id: string;
  dealName: string;
  description: string;
  category: string;
  icon: string;
  customRate: number;
  popular: boolean;
  testMappingIds: string[];
  canonicalNames: string[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function parseTatToHours(tat: string | null | undefined): number {
  if (!tat) return Infinity;
  const s = tat.toLowerCase().trim();
  if (s.includes("même jour") || s.includes("same day")) return 0;
  const hoursMatch = s.match(/(\d+)(?:\s*[–-]\s*(\d+))?\s*h/);
  if (hoursMatch) return Number(hoursMatch[1]);
  const daysMatch =
    s.match(/(\d+)(?:\s*[–-]\s*(\d+))?\s*(?:jour|day|business)/);
  if (daysMatch) return Number(daysMatch[1]) * 24;
  return Infinity;
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function TestsPage() {
  return <UnifiedTestsContent />;
}

// ── Main content ─────────────────────────────────────────────────────────────
function UnifiedTestsContent() {
  const router = useRouter();
  const {
    items,
    addItem,
    removeItem,
    clearCart,
    loadFromMappingIds,
    isReady,
  } = useTestCart();
  const { colorMap } = useLabColors();
  const {
    comparison,
    isLoading: comparisonLoading,
    error: comparisonError,
    compare,
    reset: resetComparison,
  } = useComparison();
  useDashboardTitle("Tests & Analyses");

  const cartItemIds = new Set(items.map((i) => i.testMappingId));

  // ── Bundle deals ─────────────────────────────────────────────────────────
  const [availableBundles, setAvailableBundles] = useState<ActiveDeal[]>([]);
  const [bundlesLoading, setBundlesLoading] = useState(true);
  const [selectedBundleIds, setSelectedBundleIds] = useState<Set<string>>(
    new Set(),
  );

  useEffect(() => {
    fetch("/api/tests/deals/active")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setAvailableBundles(d.data || []);
      })
      .catch(() => {})
      .finally(() => setBundlesLoading(false));
  }, []);

  const selectedBundles = useMemo(
    () => availableBundles.filter((b) => selectedBundleIds.has(b.id)),
    [availableBundles, selectedBundleIds],
  );

  const toggleBundle = useCallback((bundle: ActiveDeal) => {
    setSelectedBundleIds((prev) => {
      const next = new Set(prev);
      if (next.has(bundle.id)) next.delete(bundle.id);
      else next.add(bundle.id);
      return next;
    });
  }, []);

  const clearBundles = useCallback(() => {
    setSelectedBundleIds(new Set());
  }, []);

  // ── Merged test mapping IDs (individual + bundles, deduplicated) ─────────
  const individualIds = useMemo(
    () => items.map((i) => i.testMappingId),
    [items],
  );

  const allTestMappingIds = useMemo(() => {
    const ids = new Set(individualIds);
    for (const b of selectedBundles) {
      for (const id of b.testMappingIds) ids.add(id);
    }
    return Array.from(ids);
  }, [individualIds, selectedBundles]);

  // ── Comparison UI state ──────────────────────────────────────────────────
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [userCustomPrices, setUserCustomPrices] = useState<
    Record<string, number>
  >({});
  const [selectionMode, setSelectionMode] = useState<
    "CHEAPEST" | "FASTEST" | "CUSTOM"
  >("CUSTOM");
  const [mappingDialog, setMappingDialog] = useState<{
    open: boolean;
    testMappingId: string;
    laboratoryId: string;
    testName: string;
    labName: string;
  }>({
    open: false,
    testMappingId: "",
    laboratoryId: "",
    testName: "",
    labName: "",
  });

  // ── Auto-trigger comparison when selection changes ───────────────────────
  const allIdsKey = allTestMappingIds.join(",");

  useEffect(() => {
    if (allTestMappingIds.length === 0) {
      resetComparison();
      setSelections({});
      setUserCustomPrices({});
      setSelectionMode("CUSTOM");
      return;
    }

    const idSet = new Set(allTestMappingIds);
    setSelections((prev) => {
      const next: Record<string, string> = {};
      for (const [k, v] of Object.entries(prev)) {
        if (idSet.has(k)) next[k] = v;
      }
      return next;
    });
    setUserCustomPrices((prev) => {
      const next: Record<string, number> = {};
      for (const [k, v] of Object.entries(prev)) {
        const testId = k.split("-")[0];
        if (idSet.has(testId)) next[k] = v;
      }
      return next;
    });

    const timer = setTimeout(() => {
      compare(allTestMappingIds);
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allIdsKey]);

  // ── Bundle custom prices (proportional distribution of customRate) ───────
  const bundleCustomPrices = useMemo(() => {
    if (selectedBundles.length === 0 || !comparison) return {};
    const prices: Record<string, number> = {};
    const priceMatrix = comparison.priceMatrix || {};
    for (const bundle of selectedBundles) {
      for (const lab of comparison.laboratories || []) {
        let labTotal = 0;
        for (const tmId of bundle.testMappingIds) {
          labTotal += priceMatrix[tmId]?.[lab.id] ?? 0;
        }
        if (labTotal === 0) continue;
        const ratio = bundle.customRate / labTotal;
        for (const tmId of bundle.testMappingIds) {
          const origPrice = priceMatrix[tmId]?.[lab.id];
          if (origPrice != null) {
            prices[`${tmId}-${lab.id}`] =
              Math.round(origPrice * ratio * 100) / 100;
          }
        }
      }
    }
    return prices;
  }, [selectedBundles, comparison]);

  const mergedCustomPrices = useMemo(
    () => ({ ...bundleCustomPrices, ...userCustomPrices }),
    [bundleCustomPrices, userCustomPrices],
  );

  // ── Comparison data processing ───────────────────────────────────────────
  const { labs, bestLabId, tableData, missingTests, testNames } =
    useMemo(() => {
      if (!comparison || allTestMappingIds.length === 0)
        return {
          labs: [],
          bestLabId: "",
          tableData: null,
          missingTests: [],
          testNames: [],
        };

      const tatMatrix = comparison.tatMatrix || {};
      const tubeTypeMatrix = comparison.tubeTypeMatrix || {};
      const testMappings = comparison.testMappings || [];
      const priceMatrix = comparison.priceMatrix || {};

      const labTotals: Record<string, number> = {};
      for (const l of comparison.laboratories || []) {
        let total = 0;
        for (const tm of testMappings) {
          const originalPrice = priceMatrix[tm.id]?.[l.id];
          if (originalPrice == null) continue;
          const effectivePrice =
            mergedCustomPrices[`${tm.id}-${l.id}`] ?? originalPrice;
          total += effectivePrice;
        }
        labTotals[l.id] = total;
      }

      const completeLabs = (comparison.laboratories || []).filter(
        (l: any) => l.isComplete,
      );
      let best = "";
      let bestTotal = Infinity;
      for (const l of completeLabs) {
        const total = labTotals[l.id] ?? Infinity;
        if (total < bestTotal) {
          bestTotal = total;
          best = l.id;
        }
      }
      if (!best) best = comparison.bestLaboratory?.id || "";

      const labs = (comparison.laboratories || []).map((l: any) => {
        const turnaroundTimes: { testName: string; tat: string }[] = [];
        for (const tm of testMappings) {
          const tat = tatMatrix[tm.id]?.[l.id];
          if (tat) turnaroundTimes.push({ testName: tm.canonicalName, tat });
        }
        return {
          id: l.id,
          name: l.name,
          total: labTotals[l.id] ?? l.totalPrice,
          missingTests: allTestMappingIds.length - l.testCount,
          isComplete: l.isComplete,
          turnaroundTimes,
        };
      });

      const tableData = {
        tests: testMappings.map((tm: any) => ({
          id: tm.id,
          canonicalName: tm.canonicalName,
          prices: priceMatrix[tm.id] || {},
          turnaroundTimes: tatMatrix[tm.id] || {},
          tubeTypes: tubeTypeMatrix[tm.id] || {},
        })),
        laboratories: (comparison.laboratories || []).map((l: any) => ({
          id: l.id,
          name: l.name,
        })),
        totals: labTotals,
        bestLabId: best,
        matchMatrix: comparison.matchMatrix || {},
        onCreateMapping: (testMappingId: string, laboratoryId: string) => {
          const test = testMappings.find(
            (tm: any) => tm.id === testMappingId,
          );
          const lab = (comparison.laboratories || []).find(
            (l: any) => l.id === laboratoryId,
          );
          setMappingDialog({
            open: true,
            testMappingId,
            laboratoryId,
            testName: test?.canonicalName || "",
            labName: lab?.name || "",
          });
        },
      };

      const missingTests = (comparison.laboratories || [])
        .filter((l: any) => !l.isComplete)
        .map((l: any) => ({
          labName: l.name,
          tests: testMappings
            .filter((tm: any) => priceMatrix[tm.id]?.[l.id] == null)
            .map((tm: any) => tm.canonicalName),
        }))
        .filter((m: any) => m.tests.length > 0);

      const testNames = testMappings.map((tm: any) => tm.canonicalName);

      return { labs, bestLabId: best, tableData, missingTests, testNames };
    }, [comparison, allTestMappingIds.length, mergedCustomPrices]);

  // ── Selection handlers ───────────────────────────────────────────────────
  const handleSelectLab = useCallback((testId: string, labId: string) => {
    setSelections((prev) => {
      if (prev[testId] === labId) {
        const next = { ...prev };
        delete next[testId];
        return next;
      }
      return { ...prev, [testId]: labId };
    });
    setSelectionMode("CUSTOM");
  }, []);

  const handlePresetCheapest = useCallback(() => {
    if (!tableData) return;
    const next: Record<string, string> = {};
    for (const test of tableData.tests) {
      let cheapestLabId: string | null = null;
      let cheapestPrice = Infinity;
      for (const lab of tableData.laboratories) {
        const price =
          mergedCustomPrices[`${test.id}-${lab.id}`] ?? test.prices[lab.id];
        if (price != null && price < cheapestPrice) {
          cheapestPrice = price;
          cheapestLabId = lab.id;
        }
      }
      if (cheapestLabId) next[test.id] = cheapestLabId;
    }
    setSelections(next);
    setSelectionMode("CHEAPEST");
  }, [tableData, mergedCustomPrices]);

  const handlePresetQuickest = useCallback(() => {
    if (!tableData) return;
    const next: Record<string, string> = {};
    for (const test of tableData.tests) {
      let quickestLabId: string | null = null;
      let quickestHours = Infinity;
      for (const lab of tableData.laboratories) {
        if (test.prices[lab.id] == null) continue;
        const tat = test.turnaroundTimes?.[lab.id];
        const hours = parseTatToHours(tat);
        if (hours < quickestHours) {
          quickestHours = hours;
          quickestLabId = lab.id;
        }
      }
      if (quickestLabId) next[test.id] = quickestLabId;
    }
    setSelections(next);
    setSelectionMode("FASTEST");
  }, [tableData]);

  const handleClearSelections = useCallback(() => {
    setSelections({});
    setSelectionMode("CUSTOM");
  }, []);

  const handleUpdateCustomPrice = useCallback(
    (testId: string, labId: string, price: number) => {
      setUserCustomPrices((prev) => ({
        ...prev,
        [`${testId}-${labId}`]: price,
      }));
    },
    [],
  );

  const handleClearCustomPrice = useCallback(
    (testId: string, labId: string) => {
      setUserCustomPrices((prev) => {
        const next = { ...prev };
        delete next[`${testId}-${labId}`];
        return next;
      });
    },
    [],
  );

  const hasActiveSelections = Object.keys(selections).length > 0;

  const handleDownloadPdf = useCallback(async () => {
    setIsDownloadingPdf(true);
    try {
      const cps = mergedCustomPrices;
      const res = await fetch("/api/comparison/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testMappingIds: allTestMappingIds,
          selections: hasActiveSelections ? selections : undefined,
          customPrices:
            Object.keys(cps).length > 0 ? cps : undefined,
        }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(
          error.message || "Erreur lors de la génération du PDF",
        );
      }
      const contentDisposition = res.headers.get("Content-Disposition");
      let filename = "Comparaison.pdf";
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="([^"]+)"/);
        if (match) filename = match[1];
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erreur lors du téléchargement";
      alert(message);
    } finally {
      setIsDownloadingPdf(false);
    }
  }, [allTestMappingIds, selections, hasActiveSelections, mergedCustomPrices]);

  const selectionTotal = useMemo(() => {
    if (!tableData || !hasActiveSelections) return 0;
    return Object.entries(selections).reduce((sum, [testId, labId]) => {
      const test = tableData.tests.find((t: any) => t.id === testId);
      const price =
        mergedCustomPrices[`${testId}-${labId}`] ?? test?.prices[labId] ?? 0;
      return sum + price;
    }, 0);
  }, [selections, tableData, hasActiveSelections, mergedCustomPrices]);

  const handleClearAll = useCallback(() => {
    clearCart();
    clearBundles();
    resetComparison();
    setSelections({});
    setUserCustomPrices({});
    setSelectionMode("CUSTOM");
  }, [clearCart, clearBundles, resetComparison]);

  const hasAnySelection = items.length > 0 || selectedBundles.length > 0;

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="w-full mt-4">
      {/* ── Sticky search bar ───────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-background pb-3">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <TestSearch
              cartItemIds={cartItemIds}
              onAddToCart={(test) => {
                if (!test.testMappingId) return;
                addItem({
                  id: test.testMappingId,
                  testMappingId: test.testMappingId,
                  canonicalName: test.canonicalName || test.name,
                });
              }}
              onRemoveFromCart={(testMappingId) =>
                removeItem(testMappingId)
              }
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 self-start"
            onClick={() => router.push("/tests/deals")}
          >
            <Package className="h-4 w-4" />
            Gérer offres
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 self-start"
            onClick={() => router.push("/tests/mappings")}
          >
            <GitCompare className="h-4 w-4" />
            Correspondances
          </Button>
        </div>
      </div>

      {/* ── Main layout ─────────────────────────────────────────────────── */}
      <DOMSafetyBoundary>
      <div key={hasAnySelection ? "sel" : "empty"}>
      {hasAnySelection ? (
        <div className="flex flex-col lg:flex-row gap-5 mt-1">
          {/* ── Left sidebar ──────────────────────────────────────────────── */}
          <div className="lg:w-[280px] lg:shrink-0 space-y-3 lg:sticky lg:top-16 lg:self-start lg:max-h-[calc(100vh-5rem)] lg:overflow-y-auto lg:pr-1">
            {/* Selected individual tests — always in DOM */}
            <div className={items.length === 0 ? "hidden" : undefined}>
              <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
                <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-border/40 bg-muted/30">
                  <div className="flex items-center gap-2">
                    <FlaskConical className="h-3.5 w-3.5 text-muted-foreground/60" />
                    <span className="text-xs font-semibold tracking-tight">
                      Tests individuels
                    </span>
                    <Badge
                      variant="secondary"
                      className="h-4.5 px-1.5 text-[10px] font-bold"
                    >
                      {isReady ? items.length : "…"}
                    </Badge>
                  </div>
                  <button
                    onClick={clearCart}
                    className="text-[10px] text-muted-foreground/50 hover:text-destructive transition-colors"
                  >
                    Effacer
                  </button>
                </div>
                <ul className="divide-y divide-border/20 max-h-48 overflow-y-auto">
                  {items.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between gap-2 px-3.5 py-2 group hover:bg-muted/20 transition-colors"
                    >
                      <span className="text-[11px] text-foreground/70 leading-snug truncate">
                        {item.canonicalName}
                      </span>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="shrink-0 text-muted-foreground/25 hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                        aria-label="Retirer"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Selected bundles — always in DOM */}
            <div className={selectedBundles.length === 0 ? "hidden" : undefined}>
              <div className="rounded-xl border border-primary/20 bg-primary/5 overflow-hidden">
                <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-primary/15">
                  <div className="flex items-center gap-2">
                    <Package className="h-3.5 w-3.5 text-primary/60" />
                    <span className="text-xs font-semibold tracking-tight">
                      Offres groupées
                    </span>
                    <Badge className="h-4.5 px-1.5 text-[10px] font-bold">
                      {selectedBundles.length}
                    </Badge>
                  </div>
                  <button
                    onClick={clearBundles}
                    className="text-[10px] text-muted-foreground/50 hover:text-destructive transition-colors"
                  >
                    Retirer
                  </button>
                </div>
                <ul className="divide-y divide-primary/10">
                  {selectedBundles.map((bundle) => (
                    <li
                      key={bundle.id}
                      className="flex items-center justify-between gap-2 px-3.5 py-2 group"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">{bundle.icon}</span>
                          <span className="text-[11px] font-medium text-foreground/80 truncate">
                            {bundle.dealName}
                          </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground/60">
                          {bundle.testMappingIds.length} tests
                          &middot;{" "}
                          {formatCurrency(bundle.customRate)}
                        </span>
                      </div>
                      <button
                        onClick={() => toggleBundle(bundle)}
                        className="shrink-0 text-muted-foreground/30 hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                        aria-label="Retirer"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Available bundles (unselected) */}
            {/* Available bundles (unselected) — always in DOM */}
            <div className={availableBundles.filter((b) => !selectedBundleIds.has(b.id)).length === 0 ? "hidden" : "space-y-1.5"}>
              <p className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-widest px-1">
                Ajouter une offre groupée
              </p>
              <div className="space-y-1.5">
                {availableBundles
                  .filter((b) => !selectedBundleIds.has(b.id))
                  .map((bundle) => (
                    <button
                      key={bundle.id}
                      onClick={() => toggleBundle(bundle)}
                      className="w-full flex items-center gap-2.5 rounded-lg border border-border/40 bg-card px-3 py-2 hover:border-primary/40 hover:bg-primary/5 transition-all text-left group"
                    >
                      <span className="text-base shrink-0">
                        {bundle.icon}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-medium text-foreground/70 truncate group-hover:text-foreground/90">
                          {bundle.dealName}
                        </p>
                        <p className="text-[10px] text-muted-foreground/50">
                          {bundle.testMappingIds.length} tests
                          &middot;{" "}
                          {formatCurrency(bundle.customRate)}
                        </p>
                      </div>
                      <Plus className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-primary transition-colors shrink-0" />
                    </button>
                  ))}
              </div>
            </div>

            {/* Draft manager */}
            <DraftManager
              currentTestMappingIds={allTestMappingIds}
              onLoad={(ids) => loadFromMappingIds(ids)}
            />
          </div>

          {/* ── Main area: comparison results ─────────────────────────────── */}
          <div className="flex-1 min-w-0 space-y-5">
            {/* Loading */}
            <div className={comparisonLoading ? "space-y-4" : "hidden"}>
              <Skeleton className="h-14 w-full rounded-xl" />
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <Skeleton className="h-36 w-full rounded-xl" />
                <Skeleton className="h-36 w-full rounded-xl" />
              </div>
              <Skeleton className="h-56 w-full rounded-xl" />
            </div>

            {/* Error */}
            <p
              className={
                comparisonError && !comparisonLoading
                  ? "text-red-500 text-sm"
                  : "hidden"
              }
            >
              {comparisonError}
            </p>

            {/* Comparison results */}
            <div
              className={
                comparison && !comparisonLoading && !comparisonError
                  ? "space-y-5"
                  : "hidden"
              }
            >
              {/* Action bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-xl border bg-card p-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {hasActiveSelections
                      ? "Envoyer la sélection optimisée au client"
                      : "Envoyer la comparaison au client"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {hasActiveSelections
                      ? `Sélection multi-laboratoires (${Object.keys(selections).length} tests) — ${formatCurrency(selectionTotal)}`
                      : "Identifie le laboratoire le moins cher et envoie le résultat par email."}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    variant="outline"
                    onClick={handleDownloadPdf}
                    disabled={isDownloadingPdf}
                    size="sm"
                  >
                    <Loader2
                      className={`mr-2 h-4 w-4 animate-spin${!isDownloadingPdf ? " hidden" : ""}`}
                    />
                    <Download
                      className={`mr-2 h-4 w-4${isDownloadingPdf ? " hidden" : ""}`}
                    />
                    <span>
                      {isDownloadingPdf ? "Génération..." : "PDF"}
                    </span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setSaveDialogOpen(true)}
                    size="sm"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    <span>Enregistrer</span>
                  </Button>
                  <Button
                    onClick={() => setEmailDialogOpen(true)}
                    size="sm"
                  >
                    <Zap
                      className={`mr-2 h-4 w-4${!hasActiveSelections ? " hidden" : ""}`}
                    />
                    <Mail
                      className={`mr-2 h-4 w-4${hasActiveSelections ? " hidden" : ""}`}
                    />
                    <span>Envoyer</span>
                  </Button>
                </div>
              </div>

              {/* Missing tests */}
              <div
                className={missingTests.length > 0 ? undefined : "hidden"}
              >
                <MissingTestsAlert missingTests={missingTests} />
              </div>

              {/* Lab cost summary */}
              <LabCostSummary
                labs={labs}
                bestLabId={bestLabId}
                selections={
                  hasActiveSelections ? selections : undefined
                }
                selectionTotal={selectionTotal}
                testNames={testNames}
                testMappingIds={allTestMappingIds}
                laboratories={tableData?.laboratories}
              />

              {/* Comparison table — wrapper always in DOM to prevent React 19 insertBefore errors */}
              <div className={!tableData ? "hidden" : undefined}>
                {tableData && (
                  <ComparisonTable
                    data={tableData}
                    selections={selections}
                    customPrices={mergedCustomPrices}
                    onSelectLab={handleSelectLab}
                    onPresetCheapest={handlePresetCheapest}
                    onPresetQuickest={handlePresetQuickest}
                    onClearSelections={handleClearSelections}
                    onUpdateCustomPrice={handleUpdateCustomPrice}
                    onClearCustomPrice={handleClearCustomPrice}
                    selectionMode={selectionMode}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6 mt-2">
          <div className="rounded-xl border border-dashed border-border/40 flex flex-col items-center justify-center py-14 gap-4 text-center px-6">
            <div className="h-11 w-11 rounded-full bg-muted/30 flex items-center justify-center">
              <Search className="h-5 w-5 text-muted-foreground/40" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Commencez par rechercher des tests
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1 max-w-md">
                Utilisez la barre de recherche ci-dessus pour trouver et
                sélectionner des analyses, ou choisissez une offre groupée
                ci-dessous. La comparaison des prix apparaîtra
                automatiquement.
              </p>
            </div>
          </div>

          {/* Bundle deals grid — always in DOM */}
          <div className={!bundlesLoading && availableBundles.length > 0 ? "space-y-3" : "hidden"}>
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10">
                <Package className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h2 className="text-sm font-semibold">
                  Offres groupées
                </h2>
                <p className="text-xs text-muted-foreground">
                  Sélectionnez une offre pour lancer la comparaison
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {availableBundles.map((bundle) => {
                const isSelected = selectedBundleIds.has(bundle.id);
                return (
                  <button
                    key={bundle.id}
                    onClick={() => toggleBundle(bundle)}
                    className={`relative rounded-xl border p-4 text-left transition-all hover:shadow-md ${
                      isSelected
                        ? "border-primary/50 bg-primary/5 shadow-sm"
                        : "border-border/50 bg-card hover:border-primary/30"
                    }`}
                  >
                    <div className={`absolute top-3 right-3${!isSelected ? " hidden" : ""}`}>
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{bundle.icon}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold">
                          {bundle.dealName}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {bundle.description}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {bundle.canonicalNames
                            .slice(0, 3)
                            .map((name) => (
                              <Badge
                                key={name}
                                variant="secondary"
                                className="text-[9px] px-1.5 py-0"
                              >
                                {name.length > 20
                                  ? name.substring(0, 18) + "…"
                                  : name}
                              </Badge>
                            ))}
                          <Badge
                            variant="secondary"
                            className={`text-[9px] px-1.5 py-0${bundle.canonicalNames.length <= 3 ? " hidden" : ""}`}
                          >
                            +{bundle.canonicalNames.length - 3}
                          </Badge>
                        </div>
                        <div className="mt-2.5 flex items-baseline gap-1.5">
                          <span className="text-lg font-bold text-primary tabular-nums">
                            {formatCurrency(bundle.customRate)}
                          </span>
                          <Badge className={`text-[9px] px-1.5 py-0${!bundle.popular ? " hidden" : ""}`}>
                            Populaire
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Loading skeletons — always in DOM */}
          <div className={bundlesLoading ? undefined : "hidden"}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-40 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      )}
      </div>
      </DOMSafetyBoundary>

      {/* ── Dialogs ───────────────────────────────────────────────────── */}
      <EmailComparisonDialog
        open={emailDialogOpen}
        onClose={() => setEmailDialogOpen(false)}
        testMappingIds={allTestMappingIds}
        testNames={testNames}
        selections={hasActiveSelections ? selections : undefined}
        laboratories={tableData?.laboratories}
        customPrices={mergedCustomPrices}
      />

      <SaveEstimateDialog
        open={saveDialogOpen}
        onClose={() => setSaveDialogOpen(false)}
        testMappingIds={allTestMappingIds}
        selections={hasActiveSelections ? selections : undefined}
        customPrices={mergedCustomPrices}
        totalPrice={selectionTotal || 0}
        selectionMode={selectionMode}
      />

      <QuickMappingDialog
        open={mappingDialog.open}
        onClose={() =>
          setMappingDialog((prev) => ({ ...prev, open: false }))
        }
        testMappingId={mappingDialog.testMappingId}
        laboratoryId={mappingDialog.laboratoryId}
        testName={mappingDialog.testName}
        labName={mappingDialog.labName}
        onCreated={() => {
          compare(allTestMappingIds);
        }}
      />
    </div>
  );
}
