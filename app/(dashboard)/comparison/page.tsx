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
import { Mail } from "lucide-react";

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

  // Per-test lab selection state
  const [selections, setSelections] = useState<Record<string, string>>({});

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

    const labs = (comparison.laboratories || []).map((l: any) => ({
      id: l.id,
      name: l.name,
      total: l.totalPrice,
      missingTests: testIds.length - l.testCount,
      isComplete: l.isComplete,
    }));

    const tableData = {
      tests: (comparison.testMappings || []).map((tm: any) => ({
        id: tm.id,
        canonicalName: tm.canonicalName,
        prices: comparison.priceMatrix?.[tm.id] || {},
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

  // Clear all selections
  const handleClearSelections = useCallback(() => {
    setSelections({});
  }, []);

  if (!testIds.length) {
    return (
      <>
        <Header title="Comparaison des prix" />
        <div className="mt-6 text-center text-muted-foreground">
          <p>Sélectionnez des tests depuis la page Tests pour lancer une comparaison.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="Comparaison des prix" />
      {isLoading ? (
        <div className="mt-6 space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : error ? (
        <p className="text-red-500 mt-6">{error}</p>
      ) : comparison ? (
        <div className="mt-6 space-y-6">
          {/* Email action bar */}
          <div className="flex items-center justify-between rounded-lg border bg-card p-4">
            <div>
              <p className="text-sm font-medium">Envoyer la comparaison au client</p>
              <p className="text-xs text-muted-foreground">
                Identifie le laboratoire le moins cher et envoie le résultat par email.
              </p>
            </div>
            <Button onClick={() => setEmailDialogOpen(true)}>
              <Mail className="mr-2 h-4 w-4" />
              Envoyer par email
            </Button>
          </div>

          {missingTests.length > 0 && (
            <MissingTestsAlert missingTests={missingTests} />
          )}
          <LabCostSummary labs={labs} bestLabId={bestLabId} />
          {tableData && (
            <ComparisonTable
              data={tableData}
              selections={selections}
              onSelectLab={handleSelectLab}
              onPresetCheapest={handlePresetCheapest}
              onClearSelections={handleClearSelections}
            />
          )}
        </div>
      ) : null}

      <EmailComparisonDialog
        open={emailDialogOpen}
        onClose={() => setEmailDialogOpen(false)}
        testMappingIds={testIds}
        testNames={testNames}
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
