"use client";

import { useState, useEffect, useCallback } from "react";
import { type Bundle } from "@/lib/data/bundles";
import BundleDealCard from "./bundle-deal-card";
import EmailComparisonDialog from "@/components/comparison/email-comparison-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Package } from "lucide-react";

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

interface ResolvedBundle {
  bundle: Bundle;
  testMappingIds: string[];
  originalTotal: number | null;
  customPrices: Record<string, number>;
  laboratories: { id: string; name: string }[];
  savingsPercent: number;
}

export default function BundleDealsSection() {
  const [resolved, setResolved] = useState<ResolvedBundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeBundle, setActiveBundle] = useState<ResolvedBundle | null>(null);

  const resolveBundles = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch active deals (already enriched with canonicalNames)
      const dealsRes = await fetch("/api/tests/deals/active");
      const dealsData = await dealsRes.json();
      if (!dealsData.success || !dealsData.data?.length) {
        setResolved([]);
        return;
      }

      const deals: ActiveDeal[] = dealsData.data;

      // 2. Fetch comparison data for all deals in parallel
      const results = await Promise.all(
        deals.map(async (deal): Promise<ResolvedBundle | null> => {
          if (deal.testMappingIds.length === 0) return null;

          try {
            const compRes = await fetch("/api/comparison", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ testMappingIds: deal.testMappingIds }),
            });
            const compData = await compRes.json();

            if (!compData.success) return null;

            const { laboratories, priceMatrix, bestLaboratory } = compData.data;
            const originalTotal: number | null = bestLaboratory?.totalPrice ?? null;

            // Build customPrices: distribute customRate proportionally across all labs
            const customPrices: Record<string, number> = {};
            for (const lab of laboratories) {
              let labTotal = 0;
              for (const testId of deal.testMappingIds) {
                labTotal += priceMatrix[testId]?.[lab.id] ?? 0;
              }
              if (labTotal === 0) continue;

              const ratio = deal.customRate / labTotal;
              for (const testId of deal.testMappingIds) {
                const origPrice = priceMatrix[testId]?.[lab.id];
                if (origPrice != null) {
                  customPrices[`${testId}-${lab.id}`] = Math.round(origPrice * ratio * 100) / 100;
                }
              }
            }

            const savingsPercent =
              originalTotal && originalTotal > 0
                ? Math.round(((originalTotal - deal.customRate) / originalTotal) * 100)
                : 0;

            const bundle: Bundle = {
              id: deal.id,
              dealName: deal.dealName,
              description: deal.description,
              category: deal.category,
              canonicalNames: deal.canonicalNames,
              customRate: deal.customRate,
              icon: deal.icon,
              popular: deal.popular,
            };

            return {
              bundle,
              testMappingIds: deal.testMappingIds,
              originalTotal,
              customPrices,
              laboratories: laboratories.map((l: { id: string; name: string }) => ({
                id: l.id,
                name: l.name,
              })),
              savingsPercent,
            };
          } catch {
            return null;
          }
        })
      );

      setResolved(results.filter((r): r is ResolvedBundle => r !== null));
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    resolveBundles();
  }, [resolveBundles]);

  const handleSend = (rb: ResolvedBundle) => {
    setActiveBundle(rb);
    setDialogOpen(true);
  };

  const bestValueId =
    resolved.length > 0
      ? resolved.reduce((best, rb) =>
          rb.bundle.customRate < best.bundle.customRate ? rb : best
        ).bundle.id
      : null;

  if (!loading && resolved.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2.5">
        <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10">
          <Package className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h2 className="text-sm font-semibold">Offres groupées</h2>
          <p className="text-xs text-muted-foreground">
            Packs de tests pré-configurés à tarifs préférentiels
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={`skeleton-${i}`} className="rounded-xl border border-border/50 bg-card overflow-hidden flex flex-col">
                {/* Accent strip */}
                <Skeleton className="h-1 w-full rounded-none" />
                <div className="p-4 space-y-3">
                  {/* Header: icon + title */}
                  <div className="flex items-start gap-3">
                    <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                  {/* Test pills */}
                  <div className="flex flex-wrap gap-1.5">
                    <Skeleton className="h-5 w-20 rounded-md" />
                    <Skeleton className="h-5 w-16 rounded-md" />
                    <Skeleton className="h-5 w-24 rounded-md" />
                  </div>
                  {/* Badges */}
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-14 rounded-full" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </div>
                  {/* Price + button */}
                  <div className="flex items-end justify-between pt-2 mt-auto border-t border-border/30">
                    <div className="space-y-1.5">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-6 w-24" />
                    </div>
                    <Skeleton className="h-8 w-24 rounded-md" />
                  </div>
                </div>
              </div>
            ))
          : resolved.map((rb) => (
              <BundleDealCard
                key={rb.bundle.id}
                bundle={rb.bundle}
                loading={false}
                onSend={() => handleSend(rb)}
                bestValue={rb.bundle.id === bestValueId}
              />
            ))}
      </div>

      {activeBundle && (
        <EmailComparisonDialog
          open={dialogOpen}
          onClose={() => {
            setDialogOpen(false);
            setActiveBundle(null);
          }}
          testMappingIds={activeBundle.testMappingIds}
          testNames={activeBundle.bundle.canonicalNames}
          customPrices={activeBundle.customPrices}
          laboratories={activeBundle.laboratories}
        />
      )}
    </div>
  );
}
