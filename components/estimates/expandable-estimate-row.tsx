"use client";

import { useState } from "react";
import { ChevronDown, Download, Trash2, Loader2, Mail } from "lucide-react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

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
  selectionMode?: string | null;
  customer: { name: string; email: string } | null;
  createdBy: { name: string };
  notes: string | null;
  testMappingIds: string[];
  selections?: Record<string, string> | null;
  customPrices?: Record<string, number>;
  testMappingDetails?: TestMappingDetail[];
  _count?: { emailLogs: number };
}

interface ExpandableEstimateRowProps {
  estimate: EstimateWithDetails;
  isExpanded?: boolean;
  onExpandChange?: (expanded: boolean) => void;
  onRowClick?: () => void;
  getStatusBadge: (status: string) => React.ReactNode;
  onDownload?: (id: string) => Promise<void>;
  onDelete?: (id: string) => void;
  downloadingId?: string | null;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  emailCount?: number;
  selectionMode?: boolean;
}

const MODE_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  CHEAPEST: { label: "Moins cher", variant: "default" },
  FASTEST: { label: "Plus rapide", variant: "secondary" },
  CUSTOM: { label: "Personnalisé", variant: "outline" },
};

export function ExpandableEstimateRow({
  estimate,
  isExpanded = false,
  onExpandChange,
  onRowClick,
  getStatusBadge,
  onDownload,
  onDelete,
  downloadingId,
  isSelected = false,
  onSelect,
}: ExpandableEstimateRowProps) {
  const [expanded, setExpanded] = useState(isExpanded);

  const isExpired = estimate.validUntil && new Date(estimate.validUntil) < new Date();
  const testCount = estimate.testMappingIds?.length || 0;
  const emailCount = estimate._count?.emailLogs ?? 0;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newExpanded = !expanded;
    setExpanded(newExpanded);
    onExpandChange?.(newExpanded);
  };

  // Parse customPrices — may be a string
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

  const getTestPriceInfo = (testMapping: TestMappingDetail): { effectivePrice: number; selectedLab: string } => {
    if (!testMapping.entries || testMapping.entries.length === 0) {
      return { effectivePrice: 0, selectedLab: "—" };
    }

    const selectedLabId = estimate.selections?.[testMapping.id];
    // Normalize: entries may use flat `laboratoryId` (snapshot) or nested `laboratory.id` (DB)
    const entry = selectedLabId
      ? testMapping.entries.find((e: any) => (e.laboratoryId || e.laboratory?.id) === selectedLabId)
      : testMapping.entries[0];

    if (!entry) return { effectivePrice: 0, selectedLab: "—" };

    const labId = (entry as any).laboratoryId || (entry as any).laboratory?.id;
    const labName = (entry as any).laboratoryName || (entry as any).laboratory?.name || "—";
    const originalPrice = entry.price ?? 0;

    // Check entry.customPrice first, then top-level customPrices map
    const customPrice = entry.customPrice !== undefined && entry.customPrice !== null
      ? entry.customPrice
      : (labId ? customPricesMap[`${testMapping.id}-${labId}`] : undefined);

    const effectivePrice = customPrice !== undefined && customPrice !== null ? customPrice : originalPrice;

    return { effectivePrice, selectedLab: labName };
  };

  const modeConfig = estimate.selectionMode ? MODE_CONFIG[estimate.selectionMode] : null;

  return (
    <>
      <TableRow
        className="cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={onRowClick}
      >
        {onSelect && (
          <TableCell className="w-10" onClick={(e) => e.stopPropagation()}>
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onSelect(estimate.id)}
              className="rounded"
            />
          </TableCell>
        )}

        {/* Numéro */}
        <TableCell className="whitespace-nowrap">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggle}
              className="p-0 h-auto w-auto mr-2"
            >
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform",
                  expanded && "rotate-180"
                )}
              />
            </Button>
            <span className="font-medium">{estimate.estimateNumber}</span>
          </div>
        </TableCell>

        {/* Client */}
        <TableCell>
          <div>
            <p className="font-medium text-sm">{estimate.customer?.name || "—"}</p>
            <p className="text-xs text-muted-foreground">{estimate.customer?.email || ""}</p>
          </div>
        </TableCell>

        {/* Tests count */}
        <TableCell className="whitespace-nowrap">
          <Badge variant="outline" className="text-xs">
            {testCount} test{testCount !== 1 ? "s" : ""}
          </Badge>
        </TableCell>

        {/* Mode */}
        <TableCell className="whitespace-nowrap">
          {modeConfig ? (
            <Badge variant={modeConfig.variant} className="text-xs">
              {modeConfig.label}
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-xs">Standard</Badge>
          )}
        </TableCell>

        {/* Créé le */}
        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
          {formatDate(new Date(estimate.createdAt))}
        </TableCell>

        {/* Validité */}
        <TableCell className="whitespace-nowrap">
          {estimate.validUntil ? (
            <span className={cn("text-sm", isExpired ? "text-red-500 font-medium" : "text-muted-foreground")}>
              {formatDate(new Date(estimate.validUntil))}
              {isExpired && <span className="text-xs ml-1">(Expiré)</span>}
            </span>
          ) : (
            <span className="text-muted-foreground/50 text-sm">—</span>
          )}
        </TableCell>

        {/* Prix */}
        <TableCell className="font-medium tabular-nums whitespace-nowrap">{formatCurrency(estimate.totalPrice)}</TableCell>

        {/* Statut */}
        <TableCell className="whitespace-nowrap">{getStatusBadge(estimate.status)}</TableCell>

        {/* Emails */}
        <TableCell className="whitespace-nowrap">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Mail className="h-3.5 w-3.5" />
            <span className="text-sm">{emailCount}</span>
          </div>
        </TableCell>

        {/* Actions */}
        {(onDownload || onDelete) && (
          <TableCell className="text-right">
            <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
              {onDownload && (
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
              )}
              {onDelete && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(estimate.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      aria-label="Supprimer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Supprimer</TooltipContent>
                </Tooltip>
              )}
            </div>
          </TableCell>
        )}
      </TableRow>

      {expanded && estimate.testMappingDetails && (
        <TableRow className="bg-muted/30 hover:bg-muted/30">
          <TableCell colSpan={11} className="py-4">
            <div className="ml-8 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground mb-3">TESTS INCLUS</p>
              <div className="space-y-2">
                {estimate.testMappingDetails.map((testMapping) => {
                  const { effectivePrice, selectedLab } = getTestPriceInfo(testMapping);
                  return (
                    <div key={testMapping.id} className="text-sm flex items-center justify-between p-2 bg-card rounded border border-border/50">
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{testMapping.canonicalName}</p>
                        <p className="text-xs text-muted-foreground">
                          Labo: <span className="font-mono text-foreground/70">{selectedLab}</span>
                        </p>
                      </div>
                      <div className="text-right ml-4">
                        <span className="font-medium text-foreground">
                          {formatCurrency(effectivePrice)}
                        </span>
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
