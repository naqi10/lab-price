"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/dashboard/header";
import TestSearch from "@/components/tests/test-search";
import TestCart from "@/components/tests/test-cart";
import { useTestCart } from "@/hooks/use-tests";
import { Button } from "@/components/ui/button";

export default function TestsPage() {
  const router = useRouter();
  const { items, addItem, removeItem, clearCart, totalItems } = useTestCart();

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
            onSelect={(test) =>
              addItem({
                id: test.id,
                testMappingId: test.testMappingId || test.id,
                canonicalName: test.canonicalName || test.name,
              })
            }
          />
        </div>
        <div>
          <TestCart
            items={items}
            onRemove={removeItem}
            onClear={clearCart}
            onCompare={() => {
              const ids = items.map((i) => i.testMappingId);
              const params = new URLSearchParams();
              ids.forEach((id) => params.append("tests", id));
              router.push(`/comparison?${params.toString()}`);
            }}
          />
        </div>
      </div>
    </>
  );
}
