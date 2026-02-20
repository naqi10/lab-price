"use client";

import { useRouter } from "next/navigation";
import TestCart from "@/components/tests/test-cart";
import AllTestsTable from "@/components/tests/all-tests-table";
import DraftManager from "@/components/comparison/draft-manager";
import { useTestCart } from "@/hooks/use-tests";
import { useLabColors } from "@/hooks/use-lab-colors";
import { useDashboardTitle } from "@/hooks/use-dashboard-title";
import { Button } from "@/components/ui/button";
import { GitCompare } from "lucide-react";

export default function TestsPage() {
  const router = useRouter();
  const { items, addItem, removeItem, clearCart, loadFromMappingIds, isReady } = useTestCart();
  const { colorMap, getColor } = useLabColors();
  useDashboardTitle("Tests & Analyses");

  const cartItemIds = new Set(items.map((i) => i.testMappingId));

  const handleCompare = () => {
    const ids = items.map((i) => i.testMappingId);
    const params = new URLSearchParams();
    ids.forEach((id) => params.append("tests", id));
    router.push(`/comparison?${params.toString()}`);
  };

  return (
    <>
      <div className="flex items-center justify-end mt-4">
        <Button variant="outline" size="sm" onClick={() => router.push("/tests/mappings")}>
          <GitCompare className="h-4 w-4" />
          Gérer les correspondances
        </Button>
      </div>

      {/* Single unified layout: table on the left, cart panel on the right */}
      <div className="mt-4 grid gap-5 lg:grid-cols-3">
        {/* ── Tests table ─────────────────────────────────────────────── */}
        <div className={items.length > 0 ? "lg:col-span-2" : "lg:col-span-3"}>
          <AllTestsTable
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

        {/* ── Right panel: cart + drafts (only when tests selected) ───── */}
        {items.length > 0 && (
          <div className="space-y-4 lg:col-span-1">
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
      </div>
    </>
  );
}
