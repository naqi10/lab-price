"use client";

import { useState } from "react";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MailCheck, MailX, Clock, Eye, Download, Loader2 } from "lucide-react";

const emailStatusConfig: Record<
  string,
  { label: string; variant: "secondary" | "success" | "destructive" | "warning"; icon: typeof MailCheck }
> = {
  SENT: { label: "Envoyé", variant: "success", icon: MailCheck },
  FAILED: { label: "Échoué", variant: "destructive", icon: MailX },
  PENDING: { label: "En cours", variant: "warning", icon: Clock },
};

export default function EstimateEmailHistory({
  estimate,
  estimateId,
}: {
  estimate: any;
  estimateId: string;
}) {
  const [selectedEmail, setSelectedEmail] = useState<any>(null);
  const [downloading, setDownloading] = useState(false);

  const handleViewDetails = (email: any) => {
    setSelectedEmail(email);
  };

  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      const res = await fetch(`/api/estimates/${estimateId}/pdf`);
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `estimation-${estimate?.estimateNumber || estimateId}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } finally {
      setDownloading(false);
    }
  };

  if (!estimate?.emails || estimate.emails.length === 0) {
    return (
      <div className="rounded-lg border border-border/40 bg-card/50 p-6 text-center">
        <p className="text-sm text-muted-foreground">Aucun email envoyé pour cette estimation</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Destinataire</TableHead>
              <TableHead>Sujet</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Date d'envoi</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {estimate.emails.map((email: any) => {
              const emailSt = emailStatusConfig[email.status] || emailStatusConfig.PENDING;
              const EmailIcon = emailSt.icon;

              return (
                <TableRow key={email.id}>
                  <TableCell className="text-sm font-medium">{email.toEmail}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{email.subject}</TableCell>
                  <TableCell>
                    <Badge variant={emailSt.variant} className="gap-1">
                      <EmailIcon className="h-3 w-3" />
                      {emailSt.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {email.sentAt ? formatDate(new Date(email.sentAt)) : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(email)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Voir les détails</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleDownloadPdf}
                            disabled={downloading}
                          >
                            {downloading ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Download className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          Télécharger PDF
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {/* Details Modal */}
        <Dialog open={!!selectedEmail} onOpenChange={(open) => !open && setSelectedEmail(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Détails de l'email envoyé</DialogTitle>
              <DialogDescription>
                Email envoyé à {selectedEmail?.toEmail} le{" "}
                {selectedEmail?.sentAt ? formatDate(new Date(selectedEmail.sentAt)) : "—"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Email Info */}
              <div className="space-y-2 border-b border-border/40 pb-4">
                <div>
                  <p className="text-xs text-muted-foreground">Destinataire</p>
                  <p className="text-sm font-medium">{selectedEmail?.toEmail}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Sujet</p>
                  <p className="text-sm font-medium">{selectedEmail?.subject}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Statut</p>
                  <p className="text-sm">
                    {selectedEmail && (
                      <Badge
                        variant={
                          emailStatusConfig[selectedEmail.status]?.variant || "secondary"
                        }
                        className="gap-1"
                      >
                        {emailStatusConfig[selectedEmail.status]?.label || selectedEmail.status}
                      </Badge>
                    )}
                  </p>
                </div>
              </div>

              {/* Estimate Details */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm">Détails de l'estimation</h3>
                <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                  {/* Header Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Numéro d'estimation</p>
                      <p className="text-sm font-medium">{estimate?.estimateNumber}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Mode de sélection</p>
                      <p className="text-sm font-medium">
                        {estimate?.selectionMode === "CHEAPEST" && "Prix le plus bas"}
                        {estimate?.selectionMode === "FASTEST" && "Délai le plus court"}
                        {estimate?.selectionMode === "CUSTOM" && "Sélection personnalisée"}
                        {!estimate?.selectionMode && "—"}
                      </p>
                    </div>
                  </div>

                  {/* Customer Info */}
                  {estimate?.customer && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Client</p>
                        <p className="text-sm font-medium">{estimate?.customer?.name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Email</p>
                        <p className="text-sm font-medium">{estimate?.customer?.email}</p>
                      </div>
                    </div>
                  )}

                  {/* Price Summary */}
                  <div className="border-t border-border/40 pt-3 mt-3">
                    <div className="flex justify-end gap-8">
                      <div>
                        <p className="text-xs text-muted-foreground">Sous-total</p>
                        <p className="text-sm font-medium tabular-nums">
                          {formatCurrency(estimate?.subtotal || 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Total TTC</p>
                        <p className="text-lg font-bold tabular-nums">
                          {formatCurrency(estimate?.totalPrice || 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {estimate?.notes && (
                <div className="space-y-2 border-t border-border/40 pt-4">
                  <p className="text-xs text-muted-foreground">Notes</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {estimate.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Download Button */}
            <div className="flex justify-end gap-2 border-t border-border/40 pt-4">
              <Button
                variant="outline"
                onClick={() => setSelectedEmail(null)}
              >
                Fermer
              </Button>
              <Button
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
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
