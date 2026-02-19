"use client";

import { useRouter } from "next/navigation";
import Header from "@/components/dashboard/header";
import TestSearch from "@/components/tests/test-search";
import TestCart from "@/components/tests/test-cart";
import DraftManager from "@/components/comparison/draft-manager";
import { useTestCart } from "@/hooks/use-tests";
import { Button } from "@/components/ui/button";

export default function TestsPage() {
  const router = useRouter();
  const { items, addItem, removeItem, clearCart, loadFromMappingIds, isReady } = useTestCart();

  return (
    <>
      <Header title="Tests & Analyses" />
      <div className="flex items-center justify-end mt-4 gap-4">
        <Button variant="outline" onClick={() => router.push("/tests/mappings")}>
          Gérer les correspondances
        </Button>
      </div>
      <div className="grid gap-6 mt-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TestSearch
            onSelect={(test) => {
              const mappingId = test.testMappingId || test.id;
              addItem({
                id: mappingId,
                testMappingId: mappingId,
                canonicalName: test.canonicalName || test.name,
              });
            }}
          />
        </div>
        <div className="space-y-6">
          <TestCart
            items={items}
            isReady={isReady}
            onRemove={removeItem}
            onClear={clearCart}
            onCompare={() => {
              const ids = items.map((i) => i.testMappingId);
              const params = new URLSearchParams();
              ids.forEach((id) => params.append("tests", id));
              router.push(`/comparison?${params.toString()}`);
            }}
          />
          <DraftManager
            currentTestMappingIds={items.map((i) => i.testMappingId)}
            onLoad={(ids) => loadFromMappingIds(ids)}
          />
        </div>
      </div>
    </>
  );
}
