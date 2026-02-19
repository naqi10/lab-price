"use client";

import { useParams } from "next/navigation";
import Header from "@/components/dashboard/header";
import QuotationPreview from "@/components/quotations/quotation-preview";
import EmailDialog from "@/components/quotations/email-dialog";
import { useQuotation } from "@/hooks/use-quotations";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useState } from "react";
import { Download, Mail, FileText, Eye, Loader2 } from "lucide-react";

export default function QuotationDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { quotation, isLoading, error } = useQuotation(id);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
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
    } finally {
      setDownloading(false);
    }
  };

  const handleViewPdf = () => {
    window.open(`/api/quotations/${id}/pdf?inline=true`, "_blank", "noopener,noreferrer");
  };

  if (isLoading) {
    return (
      <div className="space-y-4 mt-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }
  if (error) return <p className="text-destructive mt-4">{error}</p>;

  return (
    <>
      <Header title={`Devis ${quotation?.quotationNumber || ""}`} />

      {/* Action bar */}
      <div className="flex items-center justify-end gap-2 mt-4">
        <Button variant="outline" size="sm" onClick={handleViewPdf}>
          <Eye className="h-4 w-4" />
          Voir PDF
        </Button>
        <Button variant="outline" size="sm" onClick={handleDownloadPdf} disabled={downloading}>
          {downloading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Télécharger PDF
        </Button>
        <Button size="sm" onClick={() => setShowEmailDialog(true)}>
          <Mail className="h-4 w-4" />
          Envoyer par email
        </Button>
      </div>

      {/* Tabs: preview + pdf viewer */}
      <Tabs defaultValue="preview" className="mt-4">
        <TabsList>
          <TabsTrigger value="preview" className="gap-2">
            <FileText className="h-3.5 w-3.5" />
            Aperçu
          </TabsTrigger>
          <TabsTrigger value="pdf" className="gap-2">
            <Eye className="h-3.5 w-3.5" />
            Vue PDF
          </TabsTrigger>
        </TabsList>

        {/* HTML preview tab */}
        <TabsContent value="preview">
          <div className="mt-4 rounded-xl border border-border/50 bg-card p-6 md:p-8">
            <QuotationPreview quotation={quotation} />
          </div>
        </TabsContent>

        {/* Inline PDF viewer tab */}
        <TabsContent value="pdf">
          <div className="mt-4 rounded-xl border border-border/50 overflow-hidden bg-card">
            <div className="flex items-center justify-between border-b border-border/40 px-4 py-2.5">
              <span className="text-xs text-muted-foreground">
                PDF — Devis {quotation?.quotationNumber}
              </span>
              <Button variant="ghost" size="sm" onClick={handleViewPdf} className="text-xs h-7 gap-1.5">
                <Eye className="h-3 w-3" />
                Ouvrir dans un nouvel onglet
              </Button>
            </div>
            <iframe
              src={`/api/quotations/${id}/pdf?inline=true`}
              className="w-full"
              style={{ height: "80vh", minHeight: 500 }}
              title={`Devis ${quotation?.quotationNumber}`}
            />
          </div>
        </TabsContent>
      </Tabs>

      <EmailDialog
        open={showEmailDialog}
        quotationId={id}
        quotation={quotation}
        onClose={() => setShowEmailDialog(false)}
      />
    </>
  );
}
