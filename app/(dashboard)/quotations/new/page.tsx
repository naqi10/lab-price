"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/dashboard/header";
import QuotationForm from "@/components/quotations/quotation-form";
import QuotationPreview from "@/components/quotations/quotation-preview";

export default function NewQuotationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const laboratoryId = searchParams.get("laboratoryId");
  const [preview, setPreview] = useState<any>(null);

  const handleSubmit = async (data: any) => {
    const res = await fetch("/api/quotations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, laboratoryId }),
    });
    const result = await res.json();
    if (result.success) {
      router.push(`/quotations/${result.data.id}`);
    }
    return result;
  };

  return (
    <>
      <Header title="Nouveau devis" />
      <div className="grid gap-6 mt-6 lg:grid-cols-2">
        <div>
          <QuotationForm
            onSubmit={handleSubmit}
            onPreview={setPreview}
            laboratoryId={laboratoryId || undefined}
          />
        </div>
        <div>{preview && <QuotationPreview quotation={preview} />}</div>
      </div>
    </>
  );
}
