"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState, useCallback } from "react";
import Header from "@/components/dashboard/header";
import ComparisonTable, { type PriceOverride } from "@/components/comparison/comparison-table";
import LabCostSummary from "@/components/comparison/lab-cost-summary";
import MissingTestsAlert from "@/components/comparison/missing-tests-alert";
import EmailComparisonDialog from "@/components/comparison/email-comparison-dialog";
import QuickMappingDialog from "@/components/comparison/quick-mapping-dialog";
import { useComparison } from "@/hooks/use-comparison";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";

type OverridesMap = Record<string, Record<string, PriceOverride>>;

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

  // Overrides: testId -> labId -> { price, reason, originalPrice }
  const [overrides, setOverrides] = useState<OverridesMap>({});

  const handleOverride = useCallback(
    (testId: string, labId: string, price: number, reason: string) => {
      setOverrides((prev) => {
        const base = comparison?.priceMatrix?.[testId]?.[labId] ?? null;
        const originalPrice = typeof base === "number" ? base : 0;
        return {
          ...prev,
          [testId]: {
            ...(prev[testId] || {}),
            [labId]: { price, reason, originalPrice },
          },
        };
      });
    },
    [comparison]
  );

  const handleRemoveOverride = useCallback((testId: string, labId: string) => {
    setOverrides((prev) => {
      const next = { ...prev };
      if (next[testId]) {
        const labOverrides = { ...next[testId] };
        delete labOverrides[labId];
        if (Object.keys(labOverrides).length === 0) delete next[testId];
        else next[testId] = labOverrides;
      }
      return next;
    });
  }, []);

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

    const labList = comparison.laboratories || [];
    const testMappings = comparison.testMappings || [];
    const priceMatrix = comparison.priceMatrix || {};

    const getEffectivePrice = (testId: string, labId: string): number | null => {
      const override = overrides[testId]?.[labId];
      if (override != null) return override.price;
      const raw = priceMatrix[testId]?.[labId];
      return raw != null ? raw : null;
    };

    const testsWithPrices = testMappings.map((tm: any) => ({
      id: tm.id,
      canonicalName: tm.canonicalName,
      prices: Object.fromEntries(
        labList.map((l: any) => {
          const eff = getEffectivePrice(tm.id, l.id);
          return [l.id, eff];
        })
      ),
    }));

    const totals: Record<string, number> = {};
    labList.forEach((l: any) => {
      let sum = 0;
      testMappings.forEach((tm: any) => {
        const eff = getEffectivePrice(tm.id, l.id);
        if (eff != null) sum += eff;
      });
      totals[l.id] = sum;
    });

    const labIdsWithTotals = labList
      .filter((l: any) => totals[l.id] != null)
      .map((l: any) => l.id);
    const bestLabId =
      labIdsWithTotals.length > 0
        ? labIdsWithTotals.reduce((a: string, b: string) =>
            totals[a] <= totals[b] ? a : b
          )
        : comparison.bestLaboratory?.id || "";

    const labs = labList.map((l: any) => ({
      id: l.id,
      name: l.name,
      total: totals[l.id] ?? 0,
      missingTests: testIds.length - l.testCount,
      isComplete: l.isComplete,
    }));

    const tableData = {
      tests: testsWithPrices,
      laboratories: labList.map((l: any) => ({ id: l.id, name: l.name })),
      totals,
      bestLabId,
      matchMatrix: comparison.matchMatrix || {},
      onCreateMapping: (testMappingId: string, laboratoryId: string) => {
        const test = testMappings.find((tm: any) => tm.id === testMappingId);
        const lab = labList.find((l: any) => l.id === laboratoryId);
        setMappingDialog({
          open: true,
          testMappingId,
          laboratoryId,
          testName: test?.canonicalName || "",
          labName: lab?.name || "",
        });
      },
      overrides,
      onOverride: handleOverride,
      onRemoveOverride: handleRemoveOverride,
    };

    const missingTests = labList
      .filter((l: any) => !l.isComplete)
      .map((l: any) => ({
        labName: l.name,
        tests: testMappings
          .filter((tm: any) => getEffectivePrice(tm.id, l.id) == null)
          .map((tm: any) => tm.canonicalName),
      }))
      .filter((m: any) => m.tests.length > 0);

    const testNames = testMappings.map((tm: any) => tm.canonicalName);

    return { labs, bestLabId, tableData, missingTests, testNames };
  }, [comparison, testIds.length, overrides, handleOverride, handleRemoveOverride]);

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
          {tableData && <ComparisonTable data={tableData} />}
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
