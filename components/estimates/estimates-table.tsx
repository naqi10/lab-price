"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TooltipProvider } from "@/components/ui/tooltip";
import { FileText, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { ExpandableEstimateRow } from "./expandable-estimate-row";

interface TestMappingEntry {
  id: string;
  localTestName: string;
  laboratory: { id: string; name: string; code?: string };
  price?: number | null;
}

interface TestMappingDetail {
  id: string;
  canonicalName: string;
  entries: TestMappingEntry[];
}

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
  testMappingIds: string[];
  selections?: Record<string, string> | null;
  customPrices?: Record<string, number>;
  testMappingDetails?: TestMappingDetail[];
}

// Transform database structure to component expected structure
function transformEstimateForDisplay(estimate: Estimate): any {
  if (!estimate.testMappingDetails) {
    return estimate;
  }

  // Parse customPrices if it's a string
  let customPricesObj: Record<string, number> = {};
  if (estimate.customPrices) {
    try {
      customPricesObj = typeof estimate.customPrices === 'string' 
        ? JSON.parse(estimate.customPrices) 
        : estimate.customPrices;
    } catch (e) {
      customPricesObj = {};
    }
  }

  const transformedDetails = estimate.testMappingDetails.map((detail) => ({
    id: detail.id,
    canonicalName: detail.canonicalName,
    entries: detail.entries.map((entry) => ({
      laboratoryId: entry.laboratory.id,
      laboratoryName: entry.laboratory.name,
      laboratoryCode: entry.laboratory.code || "",
      price: entry.price || 0,
      customPrice: customPricesObj[`${detail.id}-${entry.laboratory.id}`],
    })),
  }));

  return {
    ...estimate,
    testMappingDetails: transformedDetails,
  };
}

export default function EstimatesTable({
  estimates,
  onDownload,
  onDelete,
  onNew,
  downloadingId,
  deletingId,
  selectedEstimates,
  onSelectEstimate,
  onSelectAll,
}: {
  estimates: Estimate[];
  onDownload: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onNew?: () => void;
  downloadingId?: string | null;
  deletingId?: string | null;
  selectedEstimates?: Set<string>;
  onSelectEstimate?: (id: string) => void;
  onSelectAll?: (all: boolean) => void;
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
            {onSelectEstimate && (
              <TableHead className="w-12">
                <input
                  type="checkbox"
                  checked={estimates.length > 0 && selectedEstimates?.size === estimates.length}
                  onChange={(e) => onSelectAll?.(e.target.checked)}
                  className="rounded"
                />
              </TableHead>
            )}
            <TableHead>Numéro</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Créé le</TableHead>
            <TableHead>Prix</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {estimates.map((estimate) => (
            <ExpandableEstimateRow
              key={estimate.id}
              estimate={transformEstimateForDisplay(estimate) as any}
              getStatusBadge={getStatusBadge}
              onRowClick={() => router.push(`/estimates/${estimate.id}`)}
              onDownload={onDownload}
              onDelete={onDelete}
              downloadingId={downloadingId}
              deletingId={deletingId}
              isSelected={selectedEstimates?.has(estimate.id) || false}
              onSelect={onSelectEstimate}
            />
          ))}
        </TableBody>
      </Table>
    </TooltipProvider>
  );
}
