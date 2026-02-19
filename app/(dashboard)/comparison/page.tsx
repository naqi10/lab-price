"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Header from "@/components/dashboard/header";
import ComparisonTable from "@/components/comparison/comparison-table";
import LabCostSummary from "@/components/comparison/lab-cost-summary";
import MissingTestsAlert from "@/components/comparison/missing-tests-alert";
import EmailComparisonDialog from "@/components/comparison/email-comparison-dialog";
import QuickMappingDialog from "@/components/comparison/quick-mapping-dialog";
import { useComparison } from "@/hooks/use-comparison";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Mail, Zap, Download, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

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

export default function ComparisonPage() {
  return (
    <Suspense fallback={<><Header title="Comparaison des prix" /><div className="mt-6 space-y-4"><Skeleton className="h-12 w-full" /><Skeleton className="h-64 w-full" /></div></>}>
      <ComparisonContent />
    </Suspense>
  );
}

function ComparisonContent() {
  const searchParams = useSearchParams();
  const testIds = searchParams.getAll("tests");
  const { comparison, isLoading, error, compare } = useComparison();
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  // Per-test lab selection state
  const [selections, setSelections] = useState<Record<string, string>>({});;

  // Custom prices for this session only (not persisted to DB)
  const [customPrices, setCustomPrices] = useState<Record<string, number>>({});

  // Quick mapping dialog state
  const [mappingDialog, setMappingDialog] = useState<{
    open: boolean;
    testMappingId: string;
    laboratoryId: string;
    testName: string;
    labName: string;
  }>({ open: false, testMappingId: "", laboratoryId: "", testName: "", labName: "" });

  useEffect(() => {
    if (testIds.length > 0) {
      compare(testIds);
    }
  }, []);

  const { labs, bestLabId, tableData, missingTests, testNames } = useMemo(() => {
    if (!comparison) return { labs: [], bestLabId: "", tableData: null, missingTests: [], testNames: [] };

    const bestLabId = comparison.bestLaboratory?.id || "";

    // Build per-lab turnaround times with test names
    const tatMatrix = comparison.tatMatrix || {};
    const testMappings = comparison.testMappings || [];

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
        total: l.totalPrice,
        missingTests: testIds.length - l.testCount,
        isComplete: l.isComplete,
        turnaroundTimes,
      };
    });

    const tableData = {
      tests: (comparison.testMappings || []).map((tm: any) => ({
        id: tm.id,
        canonicalName: tm.canonicalName,
        prices: comparison.priceMatrix?.[tm.id] || {},
        turnaroundTimes: comparison.tatMatrix?.[tm.id] || {},
      })),
      laboratories: (comparison.laboratories || []).map((l: any) => ({ id: l.id, name: l.name })),
      totals: Object.fromEntries((comparison.laboratories || []).map((l: any) => [l.id, l.totalPrice])),
      bestLabId,
      matchMatrix: comparison.matchMatrix || {},
      onCreateMapping: (testMappingId: string, laboratoryId: string) => {
        const test = (comparison.testMappings || []).find((tm: any) => tm.id === testMappingId);
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
        tests: (comparison.testMappings || [])
          .filter((tm: any) => comparison.priceMatrix?.[tm.id]?.[l.id] == null)
          .map((tm: any) => tm.canonicalName),
      }))
      .filter((m: any) => m.tests.length > 0);

    const testNames = (comparison.testMappings || []).map((tm: any) => tm.canonicalName);

    return { labs, bestLabId, tableData, missingTests, testNames };
  }, [comparison, testIds.length]);

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
  }, []);

  // Preset: select cheapest lab per test
  const handlePresetCheapest = useCallback(() => {
    if (!tableData) return;
    const next: Record<string, string> = {};
    for (const test of tableData.tests) {
      let cheapestLabId: string | null = null;
      let cheapestPrice = Infinity;
      for (const lab of tableData.laboratories) {
        const price = test.prices[lab.id];
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
  }, [tableData]);

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
  }, [tableData]);

  // Clear all selections
  const handleClearSelections = useCallback(() => {
    setSelections({});
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

      // Download the PDF
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
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
      return sum + (test?.prices[labId] ?? 0);
    }, 0);
  }, [selections, tableData, hasActiveSelections]);

   if (!testIds.length) {
     return (
       <>
         <Header title="Comparaison des prix" />
         <main className="px-6 py-6">
           <div className="text-center text-muted-foreground">
             <p>Sélectionnez des tests depuis la page Tests pour lancer une comparaison.</p>
           </div>
         </main>
       </>
     );
   }

   return (
     <>
       <Header title="Comparaison des prix" />
       <main className="px-6 py-6">
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
             <div key={hasActiveSelections ? "bar-sel" : "bar-def"} className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-lg border bg-card p-4">
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
                 >
                   {isDownloadingPdf ? (
                     <><Loader2 className="mr-2 h-4 w-4 animate-spin" /><span>Génération...</span></>
                   ) : (
                     <><Download className="mr-2 h-4 w-4" /><span>Télécharger PDF</span></>
                   )}
                 </Button>
                 <Button onClick={() => setEmailDialogOpen(true)}>
                   {hasActiveSelections
                     ? <><Zap className="mr-2 h-4 w-4" /><span>Envoyer la sélection</span></>
                     : <><Mail className="mr-2 h-4 w-4" /><span>Envoyer par email</span></>}
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
