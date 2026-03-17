"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import TestSearch from "@/components/tests/test-search";
import { DOMSafetyBoundary } from "@/components/dom-safety-boundary";
import DraftManager from "@/components/comparison/draft-manager";
import ComparisonTable from "@/components/comparison/comparison-table";
import MissingTestsAlert from "@/components/comparison/missing-tests-alert";
import EmailComparisonDialog from "@/components/comparison/email-comparison-dialog";
import SaveEstimateDialog from "@/components/comparison/save-estimate-dialog";
import QuickMappingDialog from "@/components/comparison/quick-mapping-dialog";
import { useTestCart } from "@/hooks/use-tests";
import { useComparison } from "@/hooks/use-comparison";
import { useLabColors } from "@/hooks/use-lab-colors";
import { useDashboardTitle } from "@/hooks/use-dashboard-title";
import BulkSearchPanel, {
  type BulkPreviewState,
  type BulkTestResult,
} from "@/components/tests/bulk-search-panel";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { TubeDot } from "@/components/ui/tube-dot";
import { formatCurrency } from "@/lib/utils";
import { parseTubeColor } from "@/lib/tube-colors";
import { parseTurnaroundToHours } from "@/lib/turnaround";
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
  List,
  ListFilter,
  ListPlus,
  Sparkles,
  Undo2,
  Receipt,
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
  componentTests?: { id: string; name: string; code: string | null; tubeType: string | null }[];
  profileComponentNames?: string[];
  profileTube?: string | null;
  profileTurnaround?: string | null;
  profileNotes?: string | null;
  sourceLabCode?: string | null;
  profileCode?: string | null;
  selfTestMappingId?: string | null;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function parseTatToHours(tat: string | null | undefined): number {
  return parseTurnaroundToHours(tat);
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
  const [storedBundleCount, setStoredBundleCount] = useState<number | null>(null);
  const [selectedBundleIds, setSelectedBundleIds] = useState<Set<string>>(
    new Set(),
  );

  useEffect(() => {
    fetch("/api/tests/deals/active")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setAvailableBundles(d.data || []);
          setStoredBundleCount(
            typeof d.meta?.storedActiveBundleCount === "number"
              ? d.meta.storedActiveBundleCount
              : null
          );
        }
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
      // Use the profile's own test mapping ID (single entry), not its component IDs.
      const id = b.selfTestMappingId ?? b.testMappingIds[0];
      if (id) ids.add(id);
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
  // Only apply the bundle discount ratio when a lab offers ALL tests in the bundle.
  // Partial-coverage labs show their individual prices without bundle adjustment.
  const bundleCustomPrices = useMemo(() => {
    if (selectedBundles.length === 0 || !comparison) return {};
    const prices: Record<string, number> = {};
    const priceMatrix = comparison.priceMatrix || {};
    for (const bundle of selectedBundles) {
      // Single-entry mode: the profile appears as one row with its customRate.
      const selfId = bundle.selfTestMappingId ?? bundle.testMappingIds[0];
      if (!selfId) continue;
      for (const lab of comparison.laboratories || []) {
        if ((priceMatrix[selfId]?.[lab.id] ?? null) != null) {
          prices[`${selfId}-${lab.id}`] = bundle.customRate;
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
    // Find best lab: prefer most coverage, then lowest total among equal-coverage labs
    let bestLabId: string | null = null;
    let bestCoverage = -1;
    let bestTotal = Infinity;
    for (const lab of tableData.laboratories) {
      let total = 0;
      let coverage = 0;
      for (const test of tableData.tests) {
        const price = mergedCustomPrices[`${test.id}-${lab.id}`] ?? test.prices[lab.id];
        if (price != null) { total += price; coverage++; }
      }
      if (coverage === 0) continue;
      if (coverage > bestCoverage || (coverage === bestCoverage && total < bestTotal)) {
        bestCoverage = coverage; bestTotal = total; bestLabId = lab.id;
      }
    }
    if (!bestLabId) return;
    const next: Record<string, string> = {};
    for (const test of tableData.tests) {
      const price = mergedCustomPrices[`${test.id}-${bestLabId}`] ?? test.prices[bestLabId];
      if (price != null) next[test.id] = bestLabId;
    }
    // Strict lab mode: never auto-assign missing tests from another lab.
    setSelections(next);
    setSelectionMode("CHEAPEST");
  }, [tableData, mergedCustomPrices]);

  const handlePresetQuickest = useCallback(() => {
    if (!tableData) return;
    // Find best lab: prefer most coverage, then best average TAT among equal-coverage labs
    let bestLabId: string | null = null;
    let bestCoverage = -1;
    let bestAvgTat = Infinity;
    let bestTotal = Infinity;
    for (const lab of tableData.laboratories) {
      let labTotal = 0;
      let coverage = 0;
      const times: number[] = [];
      for (const test of tableData.tests) {
        const price = mergedCustomPrices[`${test.id}-${lab.id}`] ?? test.prices[lab.id];
        if (price != null) { labTotal += price; coverage++; }
        const hours = parseTatToHours(test.turnaroundTimes?.[lab.id]);
        if (hours !== Infinity) times.push(hours);
      }
      if (coverage === 0) continue;
      const avgTat = times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : Infinity;
      const isBetter = coverage > bestCoverage
        || (coverage === bestCoverage && avgTat < bestAvgTat)
        || (coverage === bestCoverage && avgTat === bestAvgTat && labTotal < bestTotal);
      if (isBetter) { bestCoverage = coverage; bestAvgTat = avgTat; bestTotal = labTotal; bestLabId = lab.id; }
    }
    if (!bestLabId) return;
    const next: Record<string, string> = {};
    for (const test of tableData.tests) {
      const price = mergedCustomPrices[`${test.id}-${bestLabId}`] ?? test.prices[bestLabId];
      if (price != null) next[test.id] = bestLabId;
    }
    // Strict lab mode: never auto-assign missing tests from another lab.
    setSelections(next);
    setSelectionMode("FASTEST");
  }, [tableData, mergedCustomPrices]);

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
  const [showBundles, setShowBundles] = useState(false);
  const [bulkMode, setBulkMode] = useState(true);
  const [bulkPreview, setBulkPreview] = useState<BulkPreviewState>({
    mode: "individual",
    tests: [],
    subtotal: 0,
    selectedProfileId: null,
    selectedProfileName: null,
  });
  const [serviceFee, setServiceFee] = useState(30);
  const [pendingEmailAfterBulk, setPendingEmailAfterBulk] = useState(false);

  // When bulk panel is dismissed, reset its preview state
  useEffect(() => {
    if (!bulkMode) {
      setBulkPreview({
        mode: "individual",
        tests: [],
        subtotal: 0,
        selectedProfileId: null,
        selectedProfileName: null,
      });
    }
  }, [bulkMode]);

  // Open email dialog after bulk tests are added to cart
  useEffect(() => {
    if (pendingEmailAfterBulk && allTestMappingIds.length > 0) {
      setEmailDialogOpen(true);
      setPendingEmailAfterBulk(false);
    }
  }, [pendingEmailAfterBulk, allTestMappingIds.length]);

  // Sidebar expands (center panel hides) immediately in bulk mode
  const bulkExpanded = bulkMode;

  const handleBulkAdd = useCallback((tests: BulkTestResult[]) => {
    for (const t of tests) {
      addItem({
        id: t.testMappingId,
        testMappingId: t.testMappingId,
        canonicalName: t.canonicalName || t.name,
        tubeType: t.tubeType,
      });
    }
    setBulkMode(false);
  }, [addItem]);

  const handleBulkAddProfile = useCallback((profileId: string) => {
    const bundle = availableBundles.find((b) => b.id === profileId);
    if (!bundle) return;
    if (!selectedBundleIds.has(bundle.id)) {
      toggleBundle(bundle);
    }
    setBulkMode(false);
  }, [availableBundles, selectedBundleIds, toggleBundle]);

  // If bulk results are ready, add them to cart then open email dialog;
  // otherwise open email dialog directly (normal cart mode)
  const handleEmailOpen = useCallback(() => {
    if (bulkExpanded && bulkPreview.mode === "profile" && bulkPreview.selectedProfileId) {
      handleBulkAddProfile(bulkPreview.selectedProfileId);
      setPendingEmailAfterBulk(true);
      return;
    }
    if (bulkExpanded && bulkPreview.tests.length > 0) {
      handleBulkAdd(bulkPreview.tests);
      setPendingEmailAfterBulk(true);
    } else {
      setEmailDialogOpen(true);
    }
  }, [bulkExpanded, bulkPreview, handleBulkAdd, handleBulkAddProfile]);

  // ── Smart bundling ────────────────────────────────────────────────────────
  // CDL-only bundles for auto-select eligibility
  const cdlBundles = useMemo(
    () => availableBundles.filter((b) => !b.sourceLabCode || b.sourceLabCode.toUpperCase() === "CDL"),
    [availableBundles]
  );

  type CartItem = typeof items[0];
  const [autoBundleNotice, setAutoBundleNotice] = useState<{
    name: string;
    savings: number;
    replacedItems: CartItem[];
    bundleId: string;
  } | null>(null);
  const smartBundleSig = useRef<string>("");

  useEffect(() => {
    if (!comparison) return;
    if (items.length < 2) return;

    const sig = items.map((i) => i.testMappingId).sort().join(",");
    if (sig === smartBundleSig.current) return;

    // Use server-computed bundle suggestions (already price-compared, size-filtered)
    const suggestions = (comparison as { bundleSuggestions?: import("@/lib/services/comparison.service").BundleSuggestion[] }).bundleSuggestions ?? [];
    if (suggestions.length === 0) return;

    // Pick the best suggestion whose bundle exists in availableBundles and isn't already selected
    const best = suggestions.find(
      (s) => !selectedBundleIds.has(s.bundleId) && availableBundles.some((b) => b.id === s.bundleId)
    );
    if (!best) return;

    const bundleToAdd = availableBundles.find((b) => b.id === best.bundleId);
    if (!bundleToAdd) return;

    // Lock signature BEFORE mutating state to prevent re-trigger
    smartBundleSig.current = sig;

    const coveredSet = new Set(best.coveredTestMappingIds);
    const replacedItems = items.filter((i) => coveredSet.has(i.testMappingId));

    for (const item of replacedItems) removeItem(item.id);
    toggleBundle(bundleToAdd);

    setAutoBundleNotice({
      name: best.bundleName,
      savings: best.maxSavings,
      replacedItems,
      bundleId: best.bundleId,
    });

    const t = setTimeout(() => setAutoBundleNotice(null), 8000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comparison]);

  const handleUndoAutoBundle = useCallback((notice: NonNullable<typeof autoBundleNotice>) => {
    setAutoBundleNotice(null);
    smartBundleSig.current = "__undone__";
    // Deselect the auto-added bundle
    const bundle = cdlBundles.find((b) => b.id === notice.bundleId);
    if (bundle && selectedBundleIds.has(bundle.id)) toggleBundle(bundle);
    // Restore individual items
    for (const item of notice.replacedItems) addItem(item);
  }, [cdlBundles, selectedBundleIds, toggleBundle, addItem]);

  function cleanBundleName(name: string): string {
    return name.replace(/,\s*PROFIL(E)?$/i, "").replace(/\s+PROFIL(E)?$/i, "").trim();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bestLab = labs.find((l: any) => l.id === bestLabId);
  const bestTotal = bestLab?.total ?? 0;
  const unselectedBundles = availableBundles.filter(
    (b) => !selectedBundleIds.has(b.id),
  );

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <DOMSafetyBoundary>
    <div className="w-full mt-4 sm:mt-6 space-y-4">

      {/* ── Smart bundle auto-select banner ─────────────────────────────── */}
      {autoBundleNotice && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 shadow-sm">
          <Sparkles className="h-4 w-4 text-emerald-600 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-emerald-800">
              Profil auto-sélectionné — économie de {formatCurrency(autoBundleNotice.savings)}
            </p>
            <p className="text-xs text-emerald-700/80 mt-0.5">
              <span className="font-medium">{autoBundleNotice.name}</span> couvre vos tests et revient moins cher qu&apos;acheter séparément.
            </p>
          </div>
          <button
            onClick={() => handleUndoAutoBundle(autoBundleNotice)}
            className="shrink-0 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 hover:text-emerald-900 border border-emerald-300 hover:border-emerald-400 rounded-lg px-2.5 py-1.5 transition-colors bg-white/60 hover:bg-white"
          >
            <Undo2 className="h-3.5 w-3.5" />
            Annuler
          </button>
          <button
            onClick={() => setAutoBundleNotice(null)}
            className="shrink-0 h-6 w-6 flex items-center justify-center rounded-md text-emerald-600/60 hover:text-emerald-800 hover:bg-emerald-100 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* ── Grid — 3-col normal, 2-col when bulk is expanded ────────────── */}
      <div className={`gap-4 grid grid-cols-1 transition-all duration-300 ${bulkExpanded ? "lg:grid-cols-[minmax(0,1fr)_280px]" : "lg:grid-cols-2 xl:grid-cols-[340px_minmax(0,1fr)_280px]"}`}>

        {/* ════════════════ LEFT: Test Search ════════════════ */}
        <div className={`${bulkExpanded ? "order-1" : "order-2 lg:order-1"} rounded-2xl border border-border/60 bg-card flex flex-col overflow-hidden`}>
          {/* Header — hidden when bulk mode (bulk panel has its own header) */}
          {!bulkMode && (
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
              <div>
                <h2 className="text-base font-semibold">Recherche de tests</h2>
                <p className="text-xs text-muted-foreground/70">Recherchez et ajoutez des analyses</p>
              </div>
            </div>
          )}

          {/* Bulk search panel — replaces search + bundles when active */}
          {bulkMode && (
            <BulkSearchPanel
              onClose={() => setBulkMode(false)}
              onResultsChange={setBulkPreview}
            />
          )}

          {/* Search input + bundles — hidden in bulk mode */}
          {!bulkMode && (
          <>
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
              availableBundles={availableBundles}
              selectedBundleIds={selectedBundleIds}
              onAddBundle={(bundle) => toggleBundle(bundle as ActiveDeal)}
            />
          </div>

          {/* Bundle deals */}
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {/* See more / collapse toggle */}
            {!showBundles ? (
              <button
                onClick={() => setShowBundles(true)}
                className="w-full mt-3 py-3.5 flex items-center justify-center gap-2 text-black font-semibold text-base sm:text-lg transition-colors border border-slate-300 rounded-xl bg-white hover:bg-slate-100"
              >
                <Package className="h-4 w-4 text-black" />
                Voir les offres groupées
                {!bundlesLoading && (storedBundleCount ?? availableBundles.length) > 0 && (
                  <span className="text-sm text-slate-600">({storedBundleCount ?? availableBundles.length})</span>
                )}
              </button>
            ) : (
              <div className="space-y-2 mt-2 rounded-2xl border border-slate-300 bg-white p-2.5 sm:p-3 shadow-sm">
                <div className="flex items-center justify-between mb-1 px-1">
                  <p className="text-sm sm:text-base font-semibold text-black uppercase tracking-wide">
                    Offres groupées
                  </p>
                  <button
                    onClick={() => setShowBundles(false)}
                    className="text-sm text-slate-600 hover:text-black transition-colors"
                  >
                    Réduire
                  </button>
                </div>

                <div className="max-h-[300px] sm:max-h-[360px] overflow-y-auto pr-1 space-y-2">
                  {bundlesLoading && (
                    <div className="space-y-2">
                      <Skeleton className="h-16 rounded-lg" />
                      <Skeleton className="h-16 rounded-lg" />
                    </div>
                  )}
                  {availableBundles.map((bundle) => {
                    const isSelected = selectedBundleIds.has(bundle.id);
                    const allBundleTests = bundle.componentTests?.length
                      ? bundle.componentTests.map((test) => test.name)
                      : bundle.canonicalNames;
                    return (
                      <button
                        key={bundle.id}
                        onClick={() => toggleBundle(bundle)}
                        className={`w-full flex items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-all group ${
                          isSelected
                            ? "border-blue-500 bg-blue-50"
                            : "border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50"
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-base sm:text-lg font-semibold truncate text-black">
                            {cleanBundleName(bundle.dealName)}
                          </p>
                          <div className="mt-0.5 flex items-center gap-1.5 flex-wrap">
                            {bundle.sourceLabCode && (
                              <Badge variant="outline" className="text-[10px] text-slate-700 border-slate-300">
                                {bundle.sourceLabCode}
                              </Badge>
                            )}
                            {bundle.profileCode && (
                              <Badge variant="secondary" className="text-[10px]">
                                {bundle.profileCode}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm sm:text-base text-slate-700 font-medium">
                            {formatCurrency(bundle.customRate)}
                          </p>
                          {(bundle.profileTube || bundle.profileTurnaround) && (
                            <p className="text-xs sm:text-sm text-slate-600 mt-0.5 flex items-center gap-2">
                              {bundle.profileTube && (
                                <span className="inline-flex items-center gap-1">
                                  <TubeDot tubeType={bundle.profileTube} withTooltip />
                                  <span>{parseTubeColor(bundle.profileTube)?.label ?? "Tube non renseigné"}</span>
                                </span>
                              )}
                              {bundle.profileTurnaround && <span>- {bundle.profileTurnaround}</span>}
                            </p>
                          )}
                          {allBundleTests.length > 0 && (
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              {allBundleTests.map((name) => (
                                <span
                                  key={`${bundle.id}-${name}`}
                                  className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-700"
                                >
                                  {name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        {isSelected ? (
                          <CheckCircle2 className="h-5 w-5 text-blue-600 shrink-0" />
                        ) : (
                          <Plus className="h-4 w-4 text-slate-500 group-hover:text-blue-600 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                  {!bundlesLoading && availableBundles.length === 0 && (
                    <p className="text-sm text-slate-500 text-center py-3">Aucune offre disponible</p>
                  )}
                  </div>
              </div>
            )}

            {/* Nav links */}
            <div className="pt-3 mt-2 border-t border-border/30 space-y-1">
              <button
                onClick={() => router.push("/tests/all")}
                className="w-full flex items-center gap-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors px-2 py-2.5 rounded-lg hover:bg-muted/30"
              >
                <List className="h-4 w-4 shrink-0" />
                <span>Parcourir tous les tests</span>
              </button>
              <button
                onClick={() => router.push("/tests/deals")}
                className="w-full flex items-center gap-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors px-2 py-2.5 rounded-lg hover:bg-muted/30"
              >
                <Package className="h-4 w-4 shrink-0" />
                <span>Gérer les offres groupées</span>
              </button>
              <button
                onClick={() => router.push("/tests/mappings")}
                className="w-full flex items-center gap-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors px-2 py-2.5 rounded-lg hover:bg-muted/30"
              >
                <GitCompare className="h-4 w-4 shrink-0" />
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
          </>
          )}
        </div>

        {/* ════════════════ CENTER: Order Items + Comparison ════════════════ */}
        {!bulkExpanded && (<div className="order-1 lg:order-2 rounded-2xl border border-border/60 bg-card flex flex-col overflow-hidden min-h-[500px]">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
            <div>
              <h2 className="text-base font-semibold">Comparaison</h2>
              <p className="text-xs text-muted-foreground/70">
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
            <div className="px-5 pt-4 pb-3 border-b border-border/30 empty:hidden">
              {items.map((item) => {
                  const tube = parseTubeColor(item.tubeType);
                  return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-1.5 group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {tube ? (
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-full shrink-0 ring-1 ring-black/15"
                          style={{ backgroundColor: tube.color }}
                          title={tube.label}
                        />
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
                    className="py-1.5 group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <Package className="h-3 w-3 text-primary/50 shrink-0" />
                          <span className="text-xs text-foreground/70 font-medium">{bundle.dealName}</span>
                          <Badge variant="secondary" className="text-[9px] px-1.5 py-0 shrink-0">
                            {`${bundle.testMappingIds.length} tests`}
                          </Badge>
                        </div>
                        {((bundle.componentTests?.length ?? 0) > 0 || bundle.canonicalNames.length > 0) && (
                          <div className="mt-1 pl-5 flex flex-wrap gap-1">
                            {(bundle.componentTests?.length
                              ? bundle.componentTests.map((t) => t.name)
                              : bundle.canonicalNames
                            ).map((name) => (
                              <span
                                key={`${bundle.id}-${name}`}
                                className="inline-flex items-center rounded-md border border-border/50 bg-muted/30 px-1.5 py-0.5 text-[10px] text-foreground/70"
                              >
                                {name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => toggleBundle(bundle)}
                        className="inline-flex h-5 w-5 items-center justify-center rounded-md border border-destructive/30 bg-destructive/10 text-destructive/80 hover:bg-destructive/20 transition-colors shrink-0 ml-2 mt-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>

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
        </div>)}

        {/* ════════════════ RIGHT: Summary ════════════════ */}
        <div className={`${bulkExpanded ? "order-2" : "order-3 lg:order-3 lg:col-span-2 xl:col-span-1"} space-y-4 xl:sticky xl:top-4 xl:self-start`}>
          <div className="rounded-xl border border-border/60 bg-card/70 p-1">
            <div className="grid grid-cols-2 gap-1">
              <button
                onClick={() => setBulkMode(true)}
                className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                  bulkMode
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                }`}
              >
                <ListPlus className="h-3.5 w-3.5" />
                En lot
              </button>
              <button
                onClick={() => setBulkMode(false)}
                className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                  !bulkMode
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                }`}
              >
                <ListFilter className="h-3.5 w-3.5" />
                Simple
              </button>
            </div>
          </div>

          {/* Summary card */}
          <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
              <div>
                <h2 className="text-base font-semibold">Résumé</h2>
                <p className="text-xs text-muted-foreground/70">Total de la commande</p>
              </div>
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-emerald-500" />
              </div>
            </div>

            {/* Price display */}
            <div className="px-5 py-4">
              {bulkExpanded ? (
                /* Bulk mode: show subtotal + editable service fee + total */
                <div className="rounded-xl border border-primary/20 bg-primary/5 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-primary/10">
                    <span className="text-[11px] text-muted-foreground">
                      Sous-total ({bulkPreview.tests.length} test{bulkPreview.tests.length !== 1 ? "s" : ""})
                    </span>
                    <span className="text-sm tabular-nums font-medium">{formatCurrency(bulkPreview.subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-primary/10 gap-2">
                    <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground shrink-0">
                      <Receipt className="h-3 w-3" />
                      Frais de service
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">$</span>
                      <Input
                        type="number"
                        min={0}
                        step={1}
                        value={serviceFee}
                        onChange={(e) => setServiceFee(Math.max(0, Number(e.target.value) || 0))}
                        className="h-6 w-16 text-xs text-right tabular-nums px-1.5 py-0"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3 bg-primary/5">
                    <span className="text-sm font-semibold">Total estimé</span>
                    <span className="text-xl font-bold tabular-nums">{formatCurrency(bulkPreview.subtotal + serviceFee)}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground/50 text-center pb-2">
                    {bulkPreview.mode === "profile"
                      ? (bulkPreview.selectedProfileName ?? "Profil")
                      : (bulkPreview.tests[0]?.laboratoryName ?? "—")}
                  </p>
                </div>
              ) : (
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
              )}
            </div>

            {/* Stats */}
            <div className="px-5 pb-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-3.5 w-3.5 text-muted-foreground/50" />
                  <span className="text-xs text-muted-foreground/70">Tests sélectionnés</span>
                </div>
                <span className="text-sm font-bold tabular-nums">
                  {bulkExpanded ? bulkPreview.tests.length : allTestMappingIds.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-3.5 w-3.5 text-muted-foreground/50" />
                  <span className="text-xs text-muted-foreground/70">Offres incluses</span>
                </div>
                <span className="text-sm font-bold tabular-nums">
                  {bulkExpanded
                    ? (bulkPreview.mode === "profile" ? 1 : 0)
                    : selectedBundles.length}
                </span>
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

            <Button
              className="w-full"
              disabled={allTestMappingIds.length === 0 && bulkPreview.tests.length === 0 && !bulkPreview.selectedProfileId}
              onClick={handleEmailOpen}
            >
              <Send className="mr-2 h-4 w-4" />
              <span>Envoyer au client</span>
            </Button>
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
