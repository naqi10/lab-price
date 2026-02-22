"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState, useContext } from "react";
import ComparisonTable from "@/components/comparison/comparison-table";
import LabCostSummary from "@/components/comparison/lab-cost-summary";
import MissingTestsAlert from "@/components/comparison/missing-tests-alert";
import EmailComparisonDialog from "@/components/comparison/email-comparison-dialog";
import SaveEstimateDialog from "@/components/comparison/save-estimate-dialog";
import QuickMappingDialog from "@/components/comparison/quick-mapping-dialog";
import { useComparison } from "@/hooks/use-comparison";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Mail, Zap, Download, Loader2, Save } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { DashboardTitleContext } from "@/lib/contexts/dashboard-title";

/**
 * Parse a human-readable turnaround time string into hours for comparison.
 * Lower value = faster. Returns Infinity if unparseable.
 */
function parseTatToHours(tat: string | null | undefined): number {
   if (!tat) return Infinity;
   const s = tat.toLowerCase().trim();

   // "même jour" / "same day"
   if (s.includes("même jour") || s.includes("same day")) return 0;

   // "résultats en X heures" / "résultats en X–Y heures" / "results in X hours"
   const hoursMatch = s.match(/(\d+)(?:\s*[–-]\s*(\d+))?\s*h/);
   if (hoursMatch) return Number(hoursMatch[1]);

   // "X jours ouvrables" / "X–Y jours ouvrables" / "X business days"
   const daysMatch = s.match(/(\d+)(?:\s*[–-]\s*(\d+))?\s*(?:jour|day|business)/);
   if (daysMatch) return Number(daysMatch[1]) * 24;

   return Infinity;
}

/**
 * Detect if the current selections match the cheapest preset
 */
function isSelectionModeCheapest(
   selections: Record<string, string>,
   tableData: any,
   customPrices: Record<string, number>
): boolean {
   if (!tableData) return false;
   
   for (const test of tableData.tests) {
     const selectedLabId = selections[test.id];
     if (!selectedLabId) return false;
     
     // Find the cheapest lab for this test considering custom prices
     let cheapestLabId: string | null = null;
     let cheapestPrice = Infinity;
     
     for (const lab of tableData.laboratories) {
       const price = customPrices[`${test.id}-${lab.id}`] ?? test.prices[lab.id];
       if (price != null && price < cheapestPrice) {
         cheapestPrice = price;
         cheapestLabId = lab.id;
       }
     }
     
     if (selectedLabId !== cheapestLabId) return false;
   }
   
   return true;
}

/**
 * Detect if the current selections match the fastest preset
 */
function isSelectionModeFastest(
   selections: Record<string, string>,
   tableData: any
): boolean {
   if (!tableData) return false;
   
   for (const test of tableData.tests) {
     const selectedLabId = selections[test.id];
     if (!selectedLabId) return false;
     
     // Find the fastest lab for this test
     let fastestLabId: string | null = null;
     let fastestHours = Infinity;
     
     for (const lab of tableData.laboratories) {
       if (test.prices[lab.id] == null) continue; // Skip labs that don't have this test
       const tat = test.turnaroundTimes?.[lab.id];
       const hours = parseTatToHours(tat);
       if (hours < fastestHours) {
         fastestHours = hours;
         fastestLabId = lab.id;
       }
     }
     
     if (selectedLabId !== fastestLabId) return false;
   }
   
   return true;
}

export default function ComparisonPage() {
  return (
    <Suspense fallback={<><div className="mt-6 space-y-4"><Skeleton className="h-12 w-full" /><Skeleton className="h-64 w-full" /></div></>}>
      <ComparisonContent />
    </Suspense>
  );
}

function ComparisonContent() {
  const searchParams = useSearchParams();
  const testIds = searchParams.getAll("tests");
  const { comparison, isLoading, error, compare } = useComparison();
  const { setTitle } = useContext(DashboardTitleContext);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  // Per-test lab selection state
  const [selections, setSelections] = useState<Record<string, string>>({});;

   // Custom prices for this session only (not persisted to DB)
   const [customPrices, setCustomPrices] = useState<Record<string, number>>({});

   // Track the current selection mode
   const [selectionMode, setSelectionMode] = useState<"CHEAPEST" | "FASTEST" | "CUSTOM">("CUSTOM");

   // Quick mapping dialog state
  const [mappingDialog, setMappingDialog] = useState<{
    open: boolean;
    testMappingId: string;
    laboratoryId: string;
    testName: string;
    labName: string;
  }>({ open: false, testMappingId: "", laboratoryId: "", testName: "", labName: "" });

  useEffect(() => {
    setTitle("Comparaison des prix");
  }, [setTitle]);

  useEffect(() => {
    if (testIds.length > 0) {
      compare(testIds);
    }
  }, []);

  const { labs, bestLabId, tableData, missingTests, testNames } = useMemo(() => {
    if (!comparison) return { labs: [], bestLabId: "", tableData: null, missingTests: [], testNames: [] };

    // Build per-lab turnaround times with test names
    const tatMatrix = comparison.tatMatrix || {};
    const tubeTypeMatrix = comparison.tubeTypeMatrix || {};
    const testMappings = comparison.testMappings || [];
    const priceMatrix = comparison.priceMatrix || {};

    // Compute effective totals per lab, applying custom price overrides
    const labTotals: Record<string, number> = {};
    for (const l of (comparison.laboratories || [])) {
      let total = 0;
      for (const tm of testMappings) {
        const originalPrice = priceMatrix[tm.id]?.[l.id];
        if (originalPrice == null) continue;
        const effectivePrice = customPrices[`${tm.id}-${l.id}`] ?? originalPrice;
        total += effectivePrice;
      }
      labTotals[l.id] = total;
    }

    // Determine the best (cheapest) complete lab using effective totals
    const completeLabs = (comparison.laboratories || []).filter((l: any) => l.isComplete);
    let bestLabId = "";
    let bestTotal = Infinity;
    for (const l of completeLabs) {
      const total = labTotals[l.id] ?? Infinity;
      if (total < bestTotal) {
        bestTotal = total;
        bestLabId = l.id;
      }
    }
    if (!bestLabId) bestLabId = comparison.bestLaboratory?.id || "";

    const labs = (comparison.laboratories || []).map((l: any) => {
      const turnaroundTimes: { testName: string; tat: string }[] = [];
      for (const tm of testMappings) {
        const tat = tatMatrix[tm.id]?.[l.id];
        if (tat) {
          turnaroundTimes.push({ testName: tm.canonicalName, tat });
        }
      }
      return {
        id: l.id,
        name: l.name,
        total: labTotals[l.id] ?? l.totalPrice,
        missingTests: testIds.length - l.testCount,
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
      laboratories: (comparison.laboratories || []).map((l: any) => ({ id: l.id, name: l.name })),
      totals: labTotals,
      bestLabId,
      matchMatrix: comparison.matchMatrix || {},
      onCreateMapping: (testMappingId: string, laboratoryId: string) => {
        const test = testMappings.find((tm: any) => tm.id === testMappingId);
        const lab = (comparison.laboratories || []).find((l: any) => l.id === laboratoryId);
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

    return { labs, bestLabId, tableData, missingTests, testNames };
  }, [comparison, testIds.length, customPrices]);

   // Per-test lab selection handler
   const handleSelectLab = useCallback((testId: string, labId: string) => {
     setSelections((prev) => {
       // Toggle: deselect if same lab already selected
       if (prev[testId] === labId) {
         const next = { ...prev };
         delete next[testId];
         return next;
       }
       return { ...prev, [testId]: labId };
     });
     // Any manual change is custom mode
     setSelectionMode("CUSTOM");
   }, []);

   // Preset: select cheapest lab per test
   const handlePresetCheapest = useCallback(() => {
     if (!tableData) return;
     const next: Record<string, string> = {};
     for (const test of tableData.tests) {
       let cheapestLabId: string | null = null;
       let cheapestPrice = Infinity;
       for (const lab of tableData.laboratories) {
         const price = customPrices[`${test.id}-${lab.id}`] ?? test.prices[lab.id];
         if (price != null && price < cheapestPrice) {
           cheapestPrice = price;
           cheapestLabId = lab.id;
         }
       }
       if (cheapestLabId) {
         next[test.id] = cheapestLabId;
       }
     }
     setSelections(next);
     setSelectionMode("CHEAPEST");
   }, [tableData, customPrices]);

   // Preset: select quickest lab per test (by turnaround time)
   const handlePresetQuickest = useCallback(() => {
     if (!tableData) return;
     const next: Record<string, string> = {};
     for (const test of tableData.tests) {
       let quickestLabId: string | null = null;
       let quickestHours = Infinity;
       for (const lab of tableData.laboratories) {
         // Only consider labs that have a price for this test
         if (test.prices[lab.id] == null) continue;
         const tat = test.turnaroundTimes?.[lab.id];
         const hours = parseTatToHours(tat);
         if (hours < quickestHours) {
           quickestHours = hours;
           quickestLabId = lab.id;
         }
       }
       if (quickestLabId) {
         next[test.id] = quickestLabId;
       }
     }
     setSelections(next);
     setSelectionMode("FASTEST");
   }, [tableData]);

   // Clear all selections
   const handleClearSelections = useCallback(() => {
     setSelections({});
     setSelectionMode("CUSTOM");
   }, []);

  // Update a custom price (session-only, not persisted)
  const handleUpdateCustomPrice = useCallback((testId: string, labId: string, price: number) => {
    const key = `${testId}-${labId}`;
    setCustomPrices(prev => ({ ...prev, [key]: price }));
  }, []);

  // Clear a custom price and revert to original
  const handleClearCustomPrice = useCallback((testId: string, labId: string) => {
    const key = `${testId}-${labId}`;
    setCustomPrices(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const hasActiveSelections = Object.keys(selections).length > 0;

  // Download PDF with current prices and selections
  const handleDownloadPdf = useCallback(async () => {
    setIsDownloadingPdf(true);
    try {
      const res = await fetch("/api/comparison/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testMappingIds: testIds,
          selections: hasActiveSelections ? selections : undefined,
          customPrices: Object.keys(customPrices).length > 0 ? customPrices : undefined,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Erreur lors de la génération du PDF");
      }

      // Get filename from Content-Disposition header or generate one
      const contentDisposition = res.headers.get("Content-Disposition");
      let filename = "Comparaison.pdf";
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="([^"]+)"/);
        if (match) filename = match[1];
      }

      // Download the PDF — avoid appendChild/removeChild to prevent
      // React 19 DOM reconciliation conflicts with portal-based components
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur lors du téléchargement";
      alert(message);
    } finally {
      setIsDownloadingPdf(false);
    }
  }, [testIds, selections, hasActiveSelections, customPrices]);

  const selectionTotal = useMemo(() => {
    if (!tableData || !hasActiveSelections) return 0;
    return Object.entries(selections).reduce((sum, [testId, labId]) => {
      const test = tableData.tests.find((t: any) => t.id === testId);
      // Use custom price if set, otherwise fall back to original price
      const price = customPrices[`${testId}-${labId}`] ?? test?.prices[labId] ?? 0;
      return sum + price;
    }, 0);
  }, [selections, tableData, hasActiveSelections, customPrices]);

   if (!testIds.length) {
     return (
       <div className="text-center text-muted-foreground">
         <p>Sélectionnez des tests depuis la page Tests pour lancer une comparaison.</p>
       </div>
     );
   }

   return (
     <>
       <main className="pt-4">
         {isLoading ? (
           <div className="space-y-4">
             <Skeleton className="h-12 w-full" />
             <Skeleton className="h-64 w-full" />
           </div>
         ) : error ? (
           <p className="text-red-500">{error}</p>
         ) : comparison ? (
           <div className="space-y-6">
              {/* Email action bar — keyed to avoid React 19 DOM reconciliation issues */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-lg border bg-card p-4">
                <div>
                  <p className="text-sm font-medium">
                    {hasActiveSelections ? "Envoyer la sélection optimisée au client" : "Envoyer la comparaison au client"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {hasActiveSelections
                      ? `Sélection multi-laboratoires (${Object.keys(selections).length} tests) — ${formatCurrency(selectionTotal)}`
                      : "Identifie le laboratoire le moins cher et envoie le résultat par email."}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline"
                    onClick={handleDownloadPdf}
                    disabled={isDownloadingPdf}
                    size="sm"
                  >
                    <Loader2 className={`mr-2 h-4 w-4 animate-spin${!isDownloadingPdf ? " hidden" : ""}`} />
                    <Download className={`mr-2 h-4 w-4${isDownloadingPdf ? " hidden" : ""}`} />
                    <span>{isDownloadingPdf ? "Génération..." : "PDF"}</span>
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
                    <Zap className={`mr-2 h-4 w-4${!hasActiveSelections ? " hidden" : ""}`} />
                    <Mail className={`mr-2 h-4 w-4${hasActiveSelections ? " hidden" : ""}`} />
                    <span>Envoyer</span>
                  </Button>
                </div>
              </div>

             {missingTests.length > 0 && (
               <MissingTestsAlert missingTests={missingTests} />
             )}
             <LabCostSummary
               labs={labs}
               bestLabId={bestLabId}
               selections={hasActiveSelections ? selections : undefined}
               selectionTotal={selectionTotal}
               testNames={testNames}
               testMappingIds={testIds}
               laboratories={tableData?.laboratories}
             />
              {tableData && (
                <ComparisonTable
                  data={tableData}
                  selections={selections}
                  customPrices={customPrices}
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
         ) : null}
       </main>

        <EmailComparisonDialog
          open={emailDialogOpen}
          onClose={() => setEmailDialogOpen(false)}
          testMappingIds={testIds}
          testNames={testNames}
          selections={hasActiveSelections ? selections : undefined}
          laboratories={tableData?.laboratories}
          customPrices={customPrices}
        />

         <SaveEstimateDialog
           open={saveDialogOpen}
           onClose={() => setSaveDialogOpen(false)}
           testMappingIds={testIds}
           selections={hasActiveSelections ? selections : undefined}
           customPrices={customPrices}
           totalPrice={selectionTotal || 0}
           selectionMode={selectionMode}
         />

        <QuickMappingDialog
          open={mappingDialog.open}
          onClose={() => setMappingDialog((prev) => ({ ...prev, open: false }))}
          testMappingId={mappingDialog.testMappingId}
          laboratoryId={mappingDialog.laboratoryId}
          testName={mappingDialog.testName}
          labName={mappingDialog.labName}
          onCreated={() => {
            // Re-run comparison to pick up the new mapping
            compare(testIds);
          }}
        />
     </>
   );
 }
