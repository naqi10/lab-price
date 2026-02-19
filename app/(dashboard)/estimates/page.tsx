"use client";

import { useState } from "react";
import Header from "@/components/dashboard/header";
import EstimatesList from "@/components/estimates/estimates-list";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

export default function EstimatesPage() {
  const router = useRouter();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <>
      <Header title="Estimations" />
      <main className="px-6 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Estimations sauvegardées</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Gérez toutes vos estimations de prix créées
            </p>
          </div>
          <Button onClick={() => router.push("/comparison")}>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle estimation
          </Button>
        </div>

        <EstimatesList key={refreshKey} onRefresh={handleRefresh} />
      </main>
    </>
  );
}
