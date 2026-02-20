"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDashboardTitle } from "@/hooks/use-dashboard-title";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Download, ArrowLeft, Edit2 } from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";
import EstimateEmailHistory from "@/components/estimates/estimate-email-history";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function EstimateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [id, setId] = useState<string>("");
  const [estimate, setEstimate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  useDashboardTitle("Détails de l'estimation");

  useEffect(() => {
    params.then(({ id }) => {
      setId(id);
      loadEstimate(id);
    });
  }, [params]);

  const loadEstimate = async (estimateId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/estimates/${estimateId}`);
      const data = await res.json();
      if (data.success) {
        setEstimate(data.data);
      } else {
        setError(data.message || "Erreur lors du chargement");
      }
    } catch (err) {
      setError("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      const res = await fetch(`/api/estimates/${id}/pdf`);
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `estimation-${estimate?.estimateNumber || id}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        alert("Erreur lors du téléchargement du PDF");
      }
    } finally {
      setDownloading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      DRAFT: "secondary",
      SENT: "default",
      ACCEPTED: "default",
      REJECTED: "destructive",
    };
    const labels: Record<string, string> = {
      DRAFT: "Brouillon",
      SENT: "Envoyé",
      ACCEPTED: "Accepté",
      REJECTED: "Rejeté",
    };
    return (
      <Badge variant={variants[status] || "secondary"}>
        {labels[status] || status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !estimate) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        <Card className="p-6">
          <p className="text-red-500">{error || "Estimation non trouvée"}</p>
          <Button onClick={() => router.push("/estimates")} variant="outline" className="mt-4">
            Retour aux estimations
          </Button>
        </Card>
      </div>
    );
  }

  const isExpired = estimate.validUntil && new Date(estimate.validUntil) < new Date();

  // Parse customPrices — may still be a string from the API
  let customPricesMap: Record<string, number> = {};
  if (estimate.customPrices) {
    try {
      customPricesMap = typeof estimate.customPrices === "string"
        ? JSON.parse(estimate.customPrices)
        : estimate.customPrices;
    } catch {
      customPricesMap = {};
    }
  }

  // Helper to resolve the effective price for a test
  const getTestPrice = (test: any) => {
    const selectedLabId = estimate.selections?.[test.id];
    // Normalize: entries may use nested `laboratory.id` (DB) or flat `laboratoryId` (snapshot)
    const selectedEntry = selectedLabId
      ? test.entries?.find((e: any) => (e.laboratoryId || e.laboratory?.id) === selectedLabId)
      : test.entries?.[0];

    const labId = selectedEntry?.laboratoryId || selectedEntry?.laboratory?.id;
    const labName = selectedEntry?.laboratoryName || selectedEntry?.laboratory?.name || "—";
    const labCode = selectedEntry?.laboratoryCode || selectedEntry?.laboratory?.code || "";
    const originalPrice = selectedEntry?.price ?? 0;

    // Custom price: check entry first, then top-level map
    const customPrice = selectedEntry?.customPrice !== undefined && selectedEntry?.customPrice !== null
      ? selectedEntry.customPrice
      : (labId ? customPricesMap[`${test.id}-${labId}`] : undefined);

    const effectivePrice = customPrice !== undefined && customPrice !== null ? customPrice : originalPrice;

    return { labName, labCode, originalPrice, customPrice, effectivePrice };
  };

  // Compute the sum of individual test prices
  const computedTotal = estimate.testMappingDetails?.reduce((sum: number, test: any) => {
    return sum + getTestPrice(test).effectivePrice;
  }, 0) ?? 0;

  return (
    <div className="space-y-6 pt-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {estimate.estimateNumber}
              {isExpired && <span className="ml-2 text-sm text-red-600">(Expiré)</span>}
            </h1>
            <p className="text-sm text-muted-foreground">
              Créée le {formatDate(new Date(estimate.createdAt))}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleDownloadPdf}
            disabled={downloading}
          >
            {downloading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Téléchargement...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Télécharger PDF
              </>
            )}
          </Button>
          {getStatusBadge(estimate.status)}
        </div>
      </div>

      <Tabs defaultValue="details" className="w-full">
        <TabsList>
          <TabsTrigger value="details">Détails</TabsTrigger>
          <TabsTrigger value="emails">Historique emails</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Informations générales</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                   <p className="text-xs text-muted-foreground">Statut</p>
                   <div className="mt-1">{getStatusBadge(estimate.status)}</div>
                 </div>
                <div>
                  <p className="text-xs text-muted-foreground">Mode de sélection</p>
                  <p className="text-sm font-medium mt-1">
                    {estimate.selectionMode === "CHEAPEST" && "Prix le plus bas"}
                    {estimate.selectionMode === "FASTEST" && "Délai le plus court"}
                    {estimate.selectionMode === "CUSTOM" && "Sélection personnalisée"}
                    {!estimate.selectionMode && "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Créée par</p>
                  <p className="text-sm font-medium mt-1">{estimate.createdBy?.name}</p>
                </div>
              </CardContent>
            </Card>

            {/* Right Column */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Client</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {estimate.customer ? (
                  <>
                    <div>
                      <p className="text-xs text-muted-foreground">Nom</p>
                      <p className="text-sm font-medium mt-1">{estimate.customer.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="text-sm font-medium mt-1">{estimate.customer.email}</p>
                    </div>
                    {estimate.customer.phone && (
                      <div>
                        <p className="text-xs text-muted-foreground">Téléphone</p>
                        <p className="text-sm font-medium mt-1">{estimate.customer.phone}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Aucun client associé</p>
                )}
              </CardContent>
            </Card>
           </div>

           {/* Tests Included */}
           {estimate.testMappingDetails && estimate.testMappingDetails.length > 0 && (
             <Card>
               <CardHeader>
                 <CardTitle className="text-base">Tests inclus</CardTitle>
               </CardHeader>
               <CardContent>
                 <div className="space-y-2">
                   {estimate.testMappingDetails.map((test: any) => {
                     const { labName, labCode, originalPrice, customPrice, effectivePrice } = getTestPrice(test);

                     return (
                       <div
                         key={test.id}
                         className="flex items-center justify-between text-sm p-3 bg-muted/30 rounded border border-border/40"
                       >
                         <div className="flex-1">
                           <p className="font-medium text-foreground">{test.canonicalName}</p>
                           <p className="text-xs text-muted-foreground">
                             Labo: <span className="font-mono text-foreground/70">{labName}</span>
                             {labCode && (
                               <span className="ml-2">({labCode})</span>
                             )}
                           </p>
                         </div>
                         <div className="text-right">
                           <p className="font-medium tabular-nums">{formatCurrency(effectivePrice)}</p>
                         </div>
                       </div>
                     );
                   })}
                 </div>
               </CardContent>
             </Card>
           )}

           {/* Pricing Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Résumé des prix</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <p className="text-sm">Sous-total (tests)</p>
                <p className="text-sm font-medium tabular-nums">
                  {formatCurrency(computedTotal)}
                </p>
              </div>
              <div className="border-t border-border/40 pt-3 flex justify-between">
                <p className="text-sm font-semibold">Total</p>
                <p className="text-lg font-bold tabular-nums">
                  {formatCurrency(estimate.totalPrice)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {estimate.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {estimate.notes}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Validity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Validité</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <p className="text-sm text-muted-foreground">Valide jusqu'au</p>
                <p className="text-sm font-medium">
                  {estimate.validUntil
                    ? formatDate(new Date(estimate.validUntil))
                    : "—"}
                </p>
              </div>
              {estimate.sentAt && (
                <div className="border-t border-border/40 pt-3 flex justify-between">
                  <p className="text-sm text-muted-foreground">Envoyée le</p>
                  <p className="text-sm font-medium">
                    {formatDate(new Date(estimate.sentAt))}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="emails">
          <EstimateEmailHistory estimate={estimate} estimateId={id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
