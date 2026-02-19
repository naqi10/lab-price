"use client";

import { useState } from "react";
import { ChevronDown, Download, Trash2, Loader2 } from "lucide-react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDate } from "@/lib/utils";

interface TestMappingDetail {
  id: string;
  canonicalName: string;
  entries?: Array<{
    laboratoryId: string;
    laboratoryName: string;
    laboratoryCode: string;
    price: number;
    customPrice?: number;
  }>;
}

interface EstimateWithDetails {
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

interface ExpandableEstimateRowProps {
  estimate: EstimateWithDetails;
  isExpanded?: boolean;
  onExpandChange?: (expanded: boolean) => void;
  onRowClick?: () => void;
  getStatusBadge: (status: string) => React.ReactNode;
  onDownload?: (id: string) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  downloadingId?: string | null;
  deletingId?: string | null;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
}

export function ExpandableEstimateRow({
  estimate,
  isExpanded = false,
  onExpandChange,
  onRowClick,
  getStatusBadge,
  onDownload,
  onDelete,
  downloadingId,
  deletingId,
  isSelected = false,
  onSelect,
}: ExpandableEstimateRowProps) {
  const [expanded, setExpanded] = useState(isExpanded);

  const isExpired = estimate.validUntil && new Date(estimate.validUntil) < new Date();

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newExpanded = !expanded;
    setExpanded(newExpanded);
    onExpandChange?.(newExpanded);
  };

  const testCount = estimate.testMappingIds?.length || 0;

  const getSelectedLabName = (testMappingId: string): string => {
    if (!estimate.selections) return "—";
    const labId = estimate.selections[testMappingId];
    if (!labId || !estimate.testMappingDetails) return "—";

    const testMapping = estimate.testMappingDetails.find((t) => t.id === testMappingId);
    if (!testMapping || !testMapping.entries) return "—";

    const entry = testMapping.entries.find((e) => e.laboratoryId === labId);
    return entry?.laboratoryName || "—";
  };

  const getTestPriceInfo = (testMappingId: string): { original: number | null; custom: number | null; selectedLab: string } => {
    if (!estimate.testMappingDetails) return { original: null, custom: null, selectedLab: "—" };

    const testMapping = estimate.testMappingDetails.find((t) => t.id === testMappingId);
    if (!testMapping || !testMapping.entries) return { original: null, custom: null, selectedLab: "—" };

    const labId = estimate.selections?.[testMappingId];
    if (!labId) return { original: null, custom: null, selectedLab: "—" };

    const entry = testMapping.entries.find((e) => e.laboratoryId === labId);
    if (!entry) return { original: null, custom: null, selectedLab: "—" };

    return {
      original: entry.price || null,
      custom: entry.customPrice || null,
      selectedLab: entry.laboratoryName || "—",
    };
  };

  return (
    <>
      <TableRow
        className={cn(
          "cursor-pointer hover:bg-muted/50 transition-colors",
          isExpired ? "opacity-50" : ""
        )}
        onClick={onRowClick}
      >
        {onSelect && (
          <TableCell
            className="w-12"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onSelect(estimate.id)}
              className="rounded"
            />
          </TableCell>
        )}
        <TableCell>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggle}
            className="p-0 h-auto w-auto"
          >
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform mr-2",
                expanded && "rotate-180"
              )}
            />
          </Button>
          <span className="font-medium">{estimate.estimateNumber}</span>
          {isExpired && <span className="ml-2 text-xs text-red-600">(Expiré)</span>}
        </TableCell>
        <TableCell>
          <div>
            <p className="font-medium text-sm">{estimate.customer?.name || "—"}</p>
            <p className="text-xs text-muted-foreground">{estimate.customer?.email || ""}</p>
          </div>
        </TableCell>
        <TableCell className="text-sm text-muted-foreground">
          {formatDate(new Date(estimate.createdAt))}
        </TableCell>
        <TableCell className="font-medium">{formatCurrency(estimate.totalPrice)}</TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            {getStatusBadge(estimate.status)}
            <Badge variant="outline" className="text-xs">
              {testCount} test{testCount !== 1 ? "s" : ""}
            </Badge>
          </div>
        </TableCell>
        {(onDownload || onDelete) && (
          <TableCell className="text-right">
            <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
              {onDownload && (
                <TooltipProvider>
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
                </TooltipProvider>
              )}
              {onDelete && (
                <TooltipProvider>
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
                </TooltipProvider>
              )}
            </div>
          </TableCell>
        )}
      </TableRow>

       {expanded && estimate.testMappingDetails && (
         <TableRow className="bg-muted/30 hover:bg-muted/30">
           <TableCell colSpan={5} className="py-4">
             <div className="ml-8 space-y-2">
               <p className="text-xs font-semibold text-muted-foreground mb-3">TESTS INCLUS</p>
               <div className="space-y-2">
                 {estimate.testMappingDetails.map((testMapping) => {
                   const priceInfo = getTestPriceInfo(testMapping.id);

                   return (
                     <div key={testMapping.id} className="text-sm flex items-center justify-between p-2 bg-card rounded border border-border/50">
                       <div className="flex-1">
                         <p className="font-medium text-foreground">{testMapping.canonicalName}</p>
                         <p className="text-xs text-muted-foreground">
                           Labo: <span className="font-mono text-foreground/70">{priceInfo.selectedLab}</span>
                         </p>
                       </div>
                       <div className="text-right ml-4">
                         {priceInfo.custom !== null ? (
                           <div className="flex items-center gap-2">
                             <span className="text-xs text-muted-foreground line-through">
                               {priceInfo.original ? formatCurrency(priceInfo.original) : "—"}
                             </span>
                             <span className="font-medium text-foreground">
                               {formatCurrency(priceInfo.custom)}
                             </span>
                           </div>
                         ) : (
                           <span className="font-medium text-foreground">
                             {priceInfo.original ? formatCurrency(priceInfo.original) : "—"}
                           </span>
                         )}
                       </div>
                     </div>
                   );
                 })}
               </div>
             </div>
           </TableCell>
         </TableRow>
       )}
    </>
  );
}
