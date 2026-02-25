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
import { parseTubeColor } from "@/lib/tube-colors";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
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
  RotateCcw,
  Send,
  DollarSign,
  ClipboardList,
  FileText,
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
          labs: [] as { id: string; name: string; total: number; missingTests: number; isComplete: boolean; turnaroundTimes: { testName: string; tat: string }[] }[],
          bestLabId: "",
          tableData: null,
          missingTests: [] as { labName: string; tests: string[] }[],
          testNames: [] as string[],
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bestLab = labs.find((l: any) => l.id === bestLabId);
  const bestTotal = bestLab?.total ?? 0;
  const unselectedBundles = availableBundles.filter(
    (b) => !selectedBundleIds.has(b.id),
  );

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <DOMSafetyBoundary>
    <div className="w-full mt-2">
      {/* ── 3-column grid — always visible ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-[340px_minmax(0,1fr)_280px] gap-4">

        {/* ════════════════ LEFT: Test Search ════════════════ */}
        <div className="order-2 lg:order-1 rounded-2xl border border-border/60 bg-card flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
            <div>
              <h2 className="text-sm font-semibold">Recherche de tests</h2>
              <p className="text-[11px] text-muted-foreground/60">{"Recherchez et ajoutez des analyses"}</p>
            </div>
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Search className="h-4 w-4 text-primary" />
            </div>
          </div>

          {/* Search input */}
          <div className="px-4 pt-4 pb-2">
            <TestSearch
              cartItemIds={cartItemIds}
              onAddToCart={(test) => {
                if (!test.testMappingId) return;
                addItem({
                  id: test.testMappingId,
                  testMappingId: test.testMappingId,
                  canonicalName: test.canonicalName || test.name,
                  tubeType: test.tubeType,
                });
              }}
              onRemoveFromCart={(testMappingId) => removeItem(testMappingId)}
            />
          </div>

          {/* Bundle deals */}
          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
            <p className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-widest mt-2">
              Offres groupées
            </p>
            {bundlesLoading && (
              <div className="space-y-2">
                <Skeleton className="h-12 rounded-lg" />
                <Skeleton className="h-12 rounded-lg" />
              </div>
            )}
            {availableBundles.map((bundle) => {
              const isSelected = selectedBundleIds.has(bundle.id);
              return (
                <button
                  key={bundle.id}
                  onClick={() => toggleBundle(bundle)}
                  className={`w-full flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all group ${
                    isSelected
                      ? "border-primary/40 bg-primary/8"
                      : "border-border/30 hover:border-primary/30 hover:bg-muted/30"
                  }`}
                >
                  <span className="text-lg shrink-0">{bundle.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium truncate">{bundle.dealName}</p>
                    <p className="text-[10px] text-muted-foreground/60">
                      {`${bundle.testMappingIds.length} tests · ${formatCurrency(bundle.customRate)}`}
                    </p>
                  </div>
                  {isSelected ? (
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  ) : (
                    <Plus className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-primary shrink-0" />
                  )}
                </button>
              );
            })}

            {/* Nav links */}
            <div className="pt-3 mt-2 border-t border-border/30 space-y-1.5">
              <button
                onClick={() => router.push("/tests/deals")}
                className="w-full flex items-center gap-2 text-[11px] text-muted-foreground/60 hover:text-foreground/80 transition-colors px-1 py-1"
              >
                <Package className="h-3 w-3" />
                <span>Gérer les offres groupées</span>
              </button>
              <button
                onClick={() => router.push("/tests/mappings")}
                className="w-full flex items-center gap-2 text-[11px] text-muted-foreground/60 hover:text-foreground/80 transition-colors px-1 py-1"
              >
                <GitCompare className="h-3 w-3" />
                <span>Gérer les correspondances</span>
              </button>
            </div>

            {/* Draft manager */}
            <div className="pt-2">
              <DraftManager
                currentTestMappingIds={allTestMappingIds}
                onLoad={(ids) => loadFromMappingIds(ids)}
              />
            </div>
          </div>
        </div>

        {/* ════════════════ CENTER: Order Items + Comparison ════════════════ */}
        <div className="order-1 lg:order-2 rounded-2xl border border-border/60 bg-card flex flex-col overflow-hidden min-h-[500px]">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
            <div>
              <h2 className="text-sm font-semibold">Comparaison</h2>
              <p className="text-[11px] text-muted-foreground/60">
                {allTestMappingIds.length > 0
                  ? `${allTestMappingIds.length} test${allTestMappingIds.length > 1 ? "s" : ""} sélectionné${allTestMappingIds.length > 1 ? "s" : ""}`
                  : "Sélectionnez des tests pour comparer"}
              </p>
            </div>
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <ClipboardList className="h-4 w-4 text-primary" />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Selected items list */}
            {(items.length > 0 || selectedBundles.length > 0) && (
              <TooltipProvider>
              <div className="px-5 pt-4 pb-3 border-b border-border/30">
                {items.map((item) => {
                  const tube = parseTubeColor(item.tubeType);
                  return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-1.5 group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {tube ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span
                              className="inline-block h-2.5 w-2.5 rounded-full shrink-0 ring-1 ring-white/10"
                              style={{ backgroundColor: tube.color }}
                            />
                          </TooltipTrigger>
                          <TooltipContent side="top">{tube.label}</TooltipContent>
                        </Tooltip>
                      ) : (
                        <FlaskConical className="h-3 w-3 text-muted-foreground/40 shrink-0" />
                      )}
                      <span className="text-xs text-foreground/70 truncate">{item.canonicalName}</span>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="inline-flex h-5 w-5 items-center justify-center rounded-md border border-destructive/30 bg-destructive/10 text-destructive/80 hover:bg-destructive/20 transition-colors shrink-0 ml-2"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                  );
                })}
                {selectedBundles.map((bundle) => (
                  <div
                    key={bundle.id}
                    className="flex items-center justify-between py-1.5 group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Package className="h-3 w-3 text-primary/50 shrink-0" />
                      <span className="text-xs text-foreground/70 truncate">{bundle.icon} {bundle.dealName}</span>
                      <Badge variant="secondary" className="text-[9px] px-1.5 py-0 shrink-0">
                        {`${bundle.testMappingIds.length} tests`}
                      </Badge>
                    </div>
                    <button
                      onClick={() => toggleBundle(bundle)}
                      className="inline-flex h-5 w-5 items-center justify-center rounded-md border border-destructive/30 bg-destructive/10 text-destructive/80 hover:bg-destructive/20 transition-colors shrink-0 ml-2"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
              </TooltipProvider>
            )}

            {/* Empty state */}
            {allTestMappingIds.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                <div className="h-12 w-12 rounded-full bg-muted/30 flex items-center justify-center mb-4">
                  <ClipboardList className="h-5 w-5 text-muted-foreground/30" />
                </div>
                <p className="text-sm font-medium text-muted-foreground/70">Aucun test ajouté</p>
                <p className="text-xs text-muted-foreground/50 mt-1 max-w-xs">
                  {"Recherchez et sélectionnez des tests depuis le panneau de gauche"}
                </p>
              </div>
            )}

            {/* Loading */}
            {comparisonLoading && allTestMappingIds.length > 0 && !comparison && (
              <div className="p-5 space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Skeleton className="h-28 rounded-xl" />
                  <Skeleton className="h-28 rounded-xl" />
                </div>
                <Skeleton className="h-48 rounded-xl" />
              </div>
            )}

            {/* Error */}
            {comparisonError && !comparisonLoading && (
              <div className="p-5">
                <p className="text-red-500 text-sm">{comparisonError}</p>
              </div>
            )}

            {/* Comparison results */}
            {comparison && !comparisonError && allTestMappingIds.length > 0 && (
              <div className="p-3 sm:p-5 space-y-4 sm:space-y-5">
                {comparisonLoading && (
                  <div className="flex items-center gap-2 rounded-lg border border-border/40 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Mise a jour de la comparaison...
                  </div>
                )}

                {/* Missing tests alert */}
                {missingTests.length > 0 && (
                  <MissingTestsAlert missingTests={missingTests} />
                )}

                {/* Lab cost summary */}
                <LabCostSummary
                  labs={labs}
                  bestLabId={bestLabId}
                  selections={hasActiveSelections ? selections : undefined}
                  selectionTotal={selectionTotal}
                  testNames={testNames}
                  testMappingIds={allTestMappingIds}
                  laboratories={tableData?.laboratories}
                />

                {/* Comparison table */}
                {tableData && (
                  <div className="-mx-3 sm:mx-0">
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
                      onRemoveTest={(testMappingId) => removeItem(testMappingId)}
                      selectionMode={selectionMode}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ════════════════ RIGHT: Summary ════════════════ */}
        <div className="order-3 lg:order-3 lg:col-span-2 xl:col-span-1 space-y-4 xl:sticky xl:top-4 xl:self-start">
          {/* Summary card */}
          <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
              <div>
                <h2 className="text-sm font-semibold">Résumé</h2>
                <p className="text-[11px] text-muted-foreground/60">Total de la commande</p>
              </div>
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-emerald-500" />
              </div>
            </div>

            {/* Price display */}
            <div className="px-5 py-6">
              <div className="rounded-xl bg-muted/30 border border-border/30 p-4 text-center">
                <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider">
                  {hasActiveSelections ? "Sélection optimisée" : "Meilleur prix"}
                </p>
                <p className="text-3xl font-bold tabular-nums mt-1 text-foreground">
                  {formatCurrency(hasActiveSelections ? selectionTotal : bestTotal)}
                </p>
                <p className="text-[10px] text-muted-foreground/50 mt-0.5">
                  {bestLab ? bestLab.name : "—"}
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="px-5 pb-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-3.5 w-3.5 text-muted-foreground/50" />
                  <span className="text-xs text-muted-foreground/70">Tests sélectionnés</span>
                </div>
                <span className="text-sm font-bold tabular-nums">{allTestMappingIds.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-3.5 w-3.5 text-muted-foreground/50" />
                  <span className="text-xs text-muted-foreground/70">Offres incluses</span>
                </div>
                <span className="text-sm font-bold tabular-nums">{selectedBundles.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FlaskConical className="h-3.5 w-3.5 text-muted-foreground/50" />
                  <span className="text-xs text-muted-foreground/70">Laboratoires</span>
                </div>
                <span className="text-sm font-bold tabular-nums">{labs.length}</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-2">
            <Button
              className="w-full"
              disabled={allTestMappingIds.length === 0}
              onClick={() => setEmailDialogOpen(true)}
            >
              <Send className="mr-2 h-4 w-4" />
              <span>{"Envoyer au client"}</span>
            </Button>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                disabled={allTestMappingIds.length === 0}
                onClick={handleDownloadPdf}
              >
                <Loader2 className={`mr-1.5 h-3.5 w-3.5 animate-spin${!isDownloadingPdf ? " hidden" : ""}`} />
                <FileText className={`mr-1.5 h-3.5 w-3.5${isDownloadingPdf ? " hidden" : ""}`} />
                <span>PDF</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                disabled={allTestMappingIds.length === 0}
                onClick={() => setSaveDialogOpen(true)}
              >
                <Save className="mr-1.5 h-3.5 w-3.5" />
                <span>Sauvegarder</span>
              </Button>
            </div>

            <button
              onClick={handleClearAll}
              disabled={allTestMappingIds.length === 0}
              className="w-full flex items-center justify-center gap-2 py-2 text-xs text-muted-foreground/50 hover:text-destructive disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Tout effacer</span>
            </button>
          </div>
        </div>
      </div>

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
    </DOMSafetyBoundary>
  );
}
