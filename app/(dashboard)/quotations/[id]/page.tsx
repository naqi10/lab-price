"use client";

import { useParams } from "next/navigation";
import Header from "@/components/dashboard/header";
import QuotationPreview from "@/components/quotations/quotation-preview";
import EmailDialog from "@/components/quotations/email-dialog";
import { useQuotation } from "@/hooks/use-quotations";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function QuotationDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { quotation, isLoading, error } = useQuotation(id);
  const [showEmailDialog, setShowEmailDialog] = useState(false);

  const handleDownloadPdf = async () => {
    const res = await fetch(`/api/quotations/${id}/pdf`);
    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `devis-${quotation?.quotationNumber || id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  if (isLoading) return <Skeleton className="h-96" />;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <>
      <div className="flex items-center justify-between">
        <Header title={`Devis ${quotation?.quotationNumber || ""}`} />
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownloadPdf}>
            Télécharger PDF
          </Button>
          <Button onClick={() => setShowEmailDialog(true)}>Envoyer par email</Button>
        </div>
      </div>
      <div className="mt-6">
        <QuotationPreview quotation={quotation} />
      </div>
      {showEmailDialog && (
        <EmailDialog
          quotationId={id}
          onClose={() => setShowEmailDialog(false)}
        />
      )}
    </>
  );
}
