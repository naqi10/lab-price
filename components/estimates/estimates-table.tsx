"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Download, Trash2, FileText, Plus, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Estimate {
  id: string;
  estimateNumber: string;
  totalPrice: number;
  status: string;
  createdAt: string;
  sentAt: string | null;
  validUntil: string | null;
  customer: { name: string; email: string } | null;
  createdBy: { name: string };
  notes: string | null;
}

export default function EstimatesTable({
  estimates,
  onDownload,
  onDelete,
  onNew,
  downloadingId,
  deletingId,
}: {
  estimates: Estimate[];
  onDownload: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onNew?: () => void;
  downloadingId?: string | null;
  deletingId?: string | null;
}) {
  const router = useRouter();

  if (estimates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 border border-border/40 rounded-xl bg-card/30">
        <div className="h-12 w-12 rounded-full bg-muted/40 border border-border/50 flex items-center justify-center">
          <FileText className="h-5 w-5 text-muted-foreground/60" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-foreground/70">Aucune estimation créée</p>
          <p className="text-xs text-muted-foreground mt-0.5">Créez une estimation depuis la page de comparaison des prix</p>
        </div>
        {onNew && (
          <Button size="sm" variant="outline" onClick={onNew} className="mt-1">
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Nouvelle estimation
          </Button>
        )}
      </div>
    );
  }

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

  return (
    <TooltipProvider>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Numéro</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Créé le</TableHead>
            <TableHead>Prix</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {estimates.map((estimate) => {
            const isExpired =
              estimate.validUntil && new Date(estimate.validUntil) < new Date();
            return (
              <TableRow
                key={estimate.id}
                className={cn(
                  "cursor-pointer hover:bg-muted/50 transition-colors",
                  isExpired ? "opacity-50" : ""
                )}
                onClick={() => router.push(`/estimates/${estimate.id}`)}
              >
                <TableCell className="font-medium">
                  {estimate.estimateNumber}
                  {isExpired && (
                    <span className="ml-2 text-xs text-red-600">(Expiré)</span>
                  )}
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium text-sm">
                      {estimate.customer?.name || "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {estimate.customer?.email || ""}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(new Date(estimate.createdAt))}
                </TableCell>
                <TableCell className="font-medium">
                  {formatCurrency(estimate.totalPrice)}
                </TableCell>
                <TableCell>{getStatusBadge(estimate.status)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDownload(estimate.id)}
                          disabled={downloadingId === estimate.id}
                          aria-label="Télécharger PDF"
                        >
                          {downloadingId === estimate.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Download className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Télécharger PDF</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(estimate.id)}
                          disabled={deletingId === estimate.id}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          aria-label="Supprimer"
                        >
                          {deletingId === estimate.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Supprimer</TooltipContent>
                    </Tooltip>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TooltipProvider>
  );
}
