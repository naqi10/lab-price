"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import AllTestsTable from "@/components/tests/all-tests-table";
import { useTestCart } from "@/hooks/use-tests";
import { useDashboardTitle } from "@/hooks/use-dashboard-title";
import { Button } from "@/components/ui/button";
import { ArrowLeft, GitCompare } from "lucide-react";

export default function AllTestsPage() {
  useDashboardTitle("Tous les tests");
  const router = useRouter();
  const { items, addItem, removeItem } = useTestCart();

  const cartItemIds = new Set(items.map((i) => i.testMappingId));

  const handleAddToCart = useCallback(
    (test: { id: string; testMappingId: string | null; canonicalName: string | null; name: string; tubeType: string | null }) => {
      if (!test.testMappingId) return;
      addItem({
        id: test.testMappingId,
        testMappingId: test.testMappingId,
        canonicalName: test.canonicalName || test.name,
        tubeType: test.tubeType,
      });
    },
    [addItem],
  );

  const handleRemoveFromCart = useCallback(
    (testMappingId: string) => {
      removeItem(testMappingId);
    },
    [removeItem],
  );

  return (
    <div className="mt-4 space-y-4">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-muted-foreground"
          onClick={() => router.push("/tests")}
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à la comparaison
        </Button>
        {items.length > 0 && (
          <Button
            size="sm"
            className="gap-1.5 ml-auto"
            onClick={() => router.push("/tests")}
          >
            <GitCompare className="h-4 w-4" />
            Voir la comparaison ({items.length} test{items.length > 1 ? "s" : ""})
          </Button>
        )}
      </div>

      <AllTestsTable
        onAddToCart={handleAddToCart}
        onRemoveFromCart={handleRemoveFromCart}
        cartItemIds={cartItemIds}
      />
    </div>
  );
}
