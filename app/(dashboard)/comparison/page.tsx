"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import Header from "@/components/dashboard/header";
import ComparisonTable from "@/components/comparison/comparison-table";
import LabCostSummary from "@/components/comparison/lab-cost-summary";
import MissingTestsAlert from "@/components/comparison/missing-tests-alert";
import { useComparison } from "@/hooks/use-comparison";
import { Skeleton } from "@/components/ui/skeleton";

export default function ComparisonPage() {
  const searchParams = useSearchParams();
  const testIds = searchParams.getAll("tests");
  const { comparison, isLoading, error, compare } = useComparison();

  useEffect(() => {
    if (testIds.length > 0) {
      compare(testIds);
    }
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
          {comparison.missingTests?.length > 0 && (
            <MissingTestsAlert missingTests={comparison.missingTests} />
          )}
          <LabCostSummary laboratories={comparison.laboratories || []} />
          <ComparisonTable comparison={comparison} />
        </div>
      ) : null}
    </>
  );
}
