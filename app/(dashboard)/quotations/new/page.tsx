"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDashboardTitle } from "@/hooks/use-dashboard-title";
import QuotationForm from "@/components/quotations/quotation-form";
import { Skeleton } from "@/components/ui/skeleton";

export default function NewQuotationPage() {
   useDashboardTitle("Nouveau devis");
   return (
    <Suspense fallback={<><Skeleton className="h-64 mt-6 max-w-2xl" /></>}>
      <NewQuotationContent />
    </Suspense>
  );
}

function NewQuotationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const laboratoryId = searchParams.get("laboratoryId") || undefined;
  const testMappingIds = searchParams.getAll("tests");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: {
    title: string;
    laboratoryId: string;
    testMappingIds: string[];
    customerId?: string;
    clientName?: string;
    clientEmail?: string;
    clientReference?: string;
    notes?: string;
    taxRate?: number;
  }) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (result.success) {
        router.push(`/quotations/${result.data.id}`);
      }
      return result;
    } finally {
      setIsLoading(false);
    }
  };

   return (
     <>
       <div className="max-w-2xl mt-6">
        <QuotationForm
          onSubmit={handleSubmit}
          isLoading={isLoading}
          laboratoryId={laboratoryId}
          testMappingIds={testMappingIds.length > 0 ? testMappingIds : undefined}
        />
      </div>
    </>
  );
}
