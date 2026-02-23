"use client";

import { useRouter } from "next/navigation";
import TestSearch from "@/components/tests/test-search";
import TestCart from "@/components/tests/test-cart";
import DraftManager from "@/components/comparison/draft-manager";
import { useTestCart } from "@/hooks/use-tests";
import { useLabColors } from "@/hooks/use-lab-colors";
import { useDashboardTitle } from "@/hooks/use-dashboard-title";
import BundleDealsSection from "@/components/bundles/bundle-deals-section";
import { Button } from "@/components/ui/button";
import { GitCompare, Package } from "lucide-react";

export default function TestsPage() {
  const router = useRouter();
  const { items, addItem, removeItem, clearCart, loadFromMappingIds, isReady } = useTestCart();
  const { colorMap } = useLabColors();
  useDashboardTitle("Tests & Analyses");

  const cartItemIds = new Set(items.map((i) => i.testMappingId));

  const handleCompare = () => {
    const ids = items.map((i) => i.testMappingId);
    const params = new URLSearchParams();
    ids.forEach((id) => params.append("tests", id));
    router.push(`/comparison?${params.toString()}`);
  };

  return (
    <div className="w-full mt-4 space-y-4">
      {/* ── Search bar (top, sticky) ─────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-background pb-2">
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
              onRemoveFromCart={(testMappingId) => removeItem(testMappingId)}
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 self-start"
            onClick={() => router.push("/tests/deals")}
          >
            <Package className="h-4 w-4" />
            Offres groupées
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

      {/* ── Cart + drafts (only when tests selected) ──────────────── */}
      {items.length > 0 && (
        <div className="space-y-4">
          <TestCart
            items={items}
            isReady={isReady}
            onRemove={removeItem}
            onClear={clearCart}
            onCompare={handleCompare}
            labColorMap={colorMap}
          />
          <DraftManager
            currentTestMappingIds={items.map((i) => i.testMappingId)}
            onLoad={(ids) => loadFromMappingIds(ids)}
          />
        </div>
      )}

      {/* ── Pre-made bundle deals ──────────────────────────────────── */}
      <BundleDealsSection />
    </div>
  );
}
