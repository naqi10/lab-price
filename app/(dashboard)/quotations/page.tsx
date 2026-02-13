"use client";

import { useRouter } from "next/navigation";
import Header from "@/components/dashboard/header";
import QuotationHistoryTable from "@/components/quotations/quotation-history-table";
import { useQuotations } from "@/hooks/use-quotations";
import { Button } from "@/components/ui/button";

export default function QuotationsPage() {
  const router = useRouter();
  const { quotations, isLoading, error, refetch } = useQuotations();

  return (
    <>
      <Header title="Devis" />
      <div className="flex items-center justify-end mt-4">
        <Button onClick={() => router.push("/quotations/new")}>+ Nouveau devis</Button>
      </div>
      {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
      <div className="mt-6">
        <QuotationHistoryTable
          quotations={quotations}
          isLoading={isLoading}
          onView={(id) => router.push(`/quotations/${id}`)}
        />
      </div>
    </>
  );
}
