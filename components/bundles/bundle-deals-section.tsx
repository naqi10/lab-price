"use client";

import { useState, useEffect, useCallback } from "react";
import { BUNDLES, type Bundle } from "@/lib/data/bundles";
import BundleDealCard from "./bundle-deal-card";
import EmailComparisonDialog from "@/components/comparison/email-comparison-dialog";
import { Package } from "lucide-react";

interface ResolvedBundle {
  bundle: Bundle;
  testMappingIds: string[];
  originalTotal: number | null;
  /** customPrices keyed by "${testMappingId}-${labId}" */
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
      // 1. Fetch all test mappings to resolve canonical names -> IDs
      const mappingsRes = await fetch("/api/tests/mappings");
      const mappingsData = await mappingsRes.json();
      if (!mappingsData.success) return;

      const allMappings: { id: string; canonicalName: string }[] =
        mappingsData.data.items || mappingsData.data || [];
      const nameToId = new Map(allMappings.map((m) => [m.canonicalName, m.id]));

      // 2. Resolve each bundle and fetch comparison data
      const results: ResolvedBundle[] = [];

      for (const bundle of BUNDLES) {
        const ids = bundle.canonicalNames
          .map((name) => nameToId.get(name))
          .filter((id): id is string => !!id);

        if (ids.length !== bundle.canonicalNames.length) {
          // Some tests not found - skip this bundle
          continue;
        }

        // Fetch comparison to get original prices
        try {
          const compRes = await fetch("/api/comparison", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ testMappingIds: ids }),
          });
          const compData = await compRes.json();

          if (compData.success) {
            const { laboratories, priceMatrix, bestLaboratory } = compData.data;
            const originalTotal: number | null = bestLaboratory?.totalPrice ?? null;

            // Build customPrices: distribute customRate proportionally across all labs
            const customPrices: Record<string, number> = {};
            for (const lab of laboratories) {
              let labTotal = 0;
              for (const testId of ids) {
                labTotal += priceMatrix[testId]?.[lab.id] ?? 0;
              }
              if (labTotal === 0) continue;

              const ratio = bundle.customRate / labTotal;
              for (const testId of ids) {
                const origPrice = priceMatrix[testId]?.[lab.id];
                if (origPrice != null) {
                  customPrices[`${testId}-${lab.id}`] = Math.round(origPrice * ratio * 100) / 100;
                }
              }
            }

            const savingsPercent =
              originalTotal && originalTotal > 0
                ? Math.round(((originalTotal - bundle.customRate) / originalTotal) * 100)
                : 0;

            results.push({
              bundle,
              testMappingIds: ids,
              originalTotal,
              customPrices,
              laboratories: laboratories.map((l: { id: string; name: string }) => ({
                id: l.id,
                name: l.name,
              })),
              savingsPercent,
            });
          }
        } catch {
          // Skip bundle on error
        }
      }

      setResolved(results);
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

  // Determine which bundle has the best savings
  const bestValueId =
    resolved.length > 0
      ? resolved.reduce((best, rb) =>
          rb.savingsPercent > best.savingsPercent ? rb : best
        ).bundle.id
      : null;

  if (!loading && resolved.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* Section header */}
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

      {/* Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {loading
          ? BUNDLES.slice(0, 3).map((b) => (
              <BundleDealCard
                key={b.id}
                bundle={b}
                originalTotal={null}
                loading={true}
                onSend={() => {}}
              />
            ))
          : resolved.map((rb) => (
              <BundleDealCard
                key={rb.bundle.id}
                bundle={rb.bundle}
                originalTotal={rb.originalTotal}
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
