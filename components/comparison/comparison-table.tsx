"use client";

import { useState } from "react";
import { formatCurrency, cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import MatchIndicator from "@/components/tests/match-indicator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Link2, Pencil, Check, Trash2 } from "lucide-react";

export type PriceOverride = {
  price: number;
  reason: string;
  originalPrice: number;
};

interface ComparisonTableData {
  tests: {
    id: string;
    canonicalName: string;
    prices: Record<string, number | null>;
  }[];
  laboratories: { id: string; name: string }[];
  totals: Record<string, number>;
  bestLabId: string;
  matchMatrix?: Record<
    string,
    Record<string, { matchType: string; similarity: number; localTestName: string } | null>
  >;
  onCreateMapping?: (testMappingId: string, laboratoryId: string) => void;
  overrides?: Record<string, Record<string, PriceOverride>>;
  onOverride?: (testId: string, labId: string, price: number, reason: string) => void;
  onRemoveOverride?: (testId: string, labId: string) => void;
}

function getEffectivePrice(
  testId: string,
  labId: string,
  basePrice: number | null,
  overrides?: Record<string, Record<string, PriceOverride>>
): number | null {
  const override = overrides?.[testId]?.[labId];
  if (override != null) return override.price;
  return basePrice;
}

function OverridePopover({
  testId,
  labId,
  testName,
  labName,
  currentPrice,
  override,
  onOverride,
  onRemoveOverride,
  onClose,
}: {
  testId: string;
  labId: string;
  testName: string;
  labName: string;
  currentPrice: number;
  override: PriceOverride | undefined;
  onOverride: (testId: string, labId: string, price: number, reason: string) => void;
  onRemoveOverride: (testId: string, labId: string) => void;
  onClose: () => void;
}) {
  const [price, setPrice] = useState(override?.price ?? currentPrice);
  const [reason, setReason] = useState(override?.reason ?? "");

  const handleApply = () => {
    const num = Number(price);
    if (!Number.isFinite(num) || num < 0) return;
    onOverride(testId, labId, num, reason.trim());
    onClose();
  };

  const handleRemove = () => {
    onRemoveOverride(testId, labId);
    onClose();
  };

  return (
    <div className="w-72 space-y-4 p-2">
      <div>
        <p className="text-sm font-medium text-muted-foreground">
          {testName} — {labName}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Prix d&apos;origine : {formatCurrency(override?.originalPrice ?? currentPrice)}
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="override-price">Nouveau prix (MAD)</Label>
        <Input
          id="override-price"
          type="number"
          min={0}
          step={0.01}
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="override-reason">Raison / note</Label>
        <Textarea
          id="override-reason"
          placeholder="Ex. prix négocié, devis spécial..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={2}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={handleApply}>
          <Check className="mr-1 h-3 w-3" />
          Appliquer
        </Button>
        {override != null && (
          <Button size="sm" variant="outline" onClick={handleRemove}>
            <Trash2 className="mr-1 h-3 w-3" />
            Supprimer
          </Button>
        )}
      </div>
    </div>
  );
}

export default function ComparisonTable({
  data,
}: {
  data: ComparisonTableData;
}) {
  const bestTotal = data.totals[data.bestLabId] ?? 0;
  const [openOverride, setOpenOverride] = useState<{
    testId: string;
    labId: string;
  } | null>(null);

  return (
    <TooltipProvider delayDuration={200}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Test</TableHead>
            {data.laboratories.map((lab) => (
              <TableHead
                key={lab.id}
                className={cn(lab.id === data.bestLabId && "bg-green-900/30")}
              >
                {lab.name}
                {lab.id === data.bestLabId && (
                  <Badge variant="success" className="ml-2">
                    Meilleur
                  </Badge>
                )}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.tests.map((test) => {
            const effectivePrices: Record<string, number> = {};
            data.laboratories.forEach((lab) => {
              const raw = test.prices[lab.id];
              const eff = getEffectivePrice(test.id, lab.id, raw, data.overrides);
              if (eff != null) effectivePrices[lab.id] = eff;
            });
            const minPrice =
              Object.keys(effectivePrices).length > 0
                ? Math.min(...Object.values(effectivePrices))
                : null;

            return (
              <TableRow key={test.id}>
                <TableCell className="font-medium">{test.canonicalName}</TableCell>
                {data.laboratories.map((lab) => {
                  const match = data.matchMatrix?.[test.id]?.[lab.id];
                  const rawPrice = test.prices[lab.id];
                  const override = data.overrides?.[test.id]?.[lab.id];
                  const effectivePrice = getEffectivePrice(
                    test.id,
                    lab.id,
                    rawPrice,
                    data.overrides
                  );
                  const isCheapest =
                    minPrice != null &&
                    effectivePrice != null &&
                    effectivePrice <= minPrice;

                  return (
                    <TableCell
                      key={lab.id}
                      className={cn(lab.id === data.bestLabId && "bg-green-900/30")}
                    >
                      {effectivePrice != null ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {override != null ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="font-medium">
                                    {formatCurrency(override.price)}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">
                                    Prix d&apos;origine :{" "}
                                    <strong>{formatCurrency(override.originalPrice)}</strong>
                                  </p>
                                  {override.reason && (
                                    <p className="text-xs mt-1">
                                      Raison : {override.reason}
                                    </p>
                                  )}
                                </TooltipContent>
                              </Tooltip>
                            ) : (
                              <span className="font-medium">
                                {formatCurrency(effectivePrice)}
                              </span>
                            )}
                            {effectivePrice != null && data.onOverride != null && (
                              <Popover
                                open={
                                  openOverride?.testId === test.id &&
                                  openOverride?.labId === lab.id
                                }
                                onOpenChange={(open) =>
                                  !open && setOpenOverride(null)
                                }
                              >
                                <PopoverTrigger asChild>
                                  <button
                                    type="button"
                                    className="text-muted-foreground hover:text-primary inline-flex p-0.5 rounded"
                                    aria-label="Modifier le prix"
                                    onClick={() =>
                                      setOpenOverride({ testId: test.id, labId: lab.id })
                                    }
                                  >
                                    <Pencil className="h-3 w-3" />
                                  </button>
                                </PopoverTrigger>
                                <PopoverContent align="start" className="w-auto p-0">
                                  <OverridePopover
                                    key={`${test.id}-${lab.id}`}
                                    testId={test.id}
                                    labId={lab.id}
                                    testName={test.canonicalName}
                                    labName={lab.name}
                                    currentPrice={effectivePrice}
                                    override={override}
                                    onOverride={data.onOverride!}
                                    onRemoveOverride={data.onRemoveOverride ?? (() => {})}
                                    onClose={() => setOpenOverride(null)}
                                  />
                                </PopoverContent>
                              </Popover>
                            )}
                          </div>
                          {minPrice != null && effectivePrice != null && (
                            <>
                              {isCheapest ? (
                                <div className="text-xs text-green-600 dark:text-green-400">
                                  Meilleur prix
                                </div>
                              ) : (
                                (() => {
                                  const diff = effectivePrice - minPrice;
                                  const pct =
                                    minPrice > 0
                                      ? Math.round((diff / minPrice) * 100)
                                      : 0;
                                  return (
                                    <div className="text-xs text-amber-600 dark:text-amber-400">
                                      +{formatCurrency(diff)} (+{pct}%)
                                    </div>
                                  );
                                })()
                              )}
                            </>
                          )}
                          {match && (
                            <div className="flex items-center gap-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span>
                                    <MatchIndicator
                                      type={match.matchType}
                                      confidence={match.similarity}
                                      compact
                                    />
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">
                                    Nom local :{" "}
                                    <strong>{match.localTestName}</strong>
                                  </p>
                                  <p className="text-xs">
                                    Confiance :{" "}
                                    {Math.round(match.similarity * 100)}%
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                              {match.matchType === "FUZZY" &&
                                data.onCreateMapping && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <button
                                        onClick={() =>
                                          data.onCreateMapping!(test.id, lab.id)
                                        }
                                        className="text-muted-foreground hover:text-primary"
                                      >
                                        <Link2 className="h-3 w-3" />
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      Corriger la correspondance
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <MatchIndicator type="NONE" compact />
                          {data.onCreateMapping && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() =>
                                    data.onCreateMapping!(test.id, lab.id)
                                  }
                                  className="text-muted-foreground hover:text-primary"
                                >
                                  <Link2 className="h-3 w-3" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>
                                Créer une correspondance manuelle
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            );
          })}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell className="font-bold">Total</TableCell>
            {data.laboratories.map((lab) => {
              const total = data.totals[lab.id];
              const isBest = lab.id === data.bestLabId;
              const diff = total != null && !isBest ? total - bestTotal : 0;
              const pct =
                bestTotal > 0 && total != null && !isBest
                  ? Math.round((diff / bestTotal) * 100)
                  : 0;
              return (
                <TableCell
                  key={lab.id}
                  className={cn(
                    "font-bold",
                    isBest && "bg-green-900/40 text-green-400"
                  )}
                >
                  <div className="space-y-0.5">
                    {total != null ? (
                      <>
                        <div>{formatCurrency(total)}</div>
                        {!isBest && total > bestTotal && (
                          <div className="text-xs font-normal text-muted-foreground">
                            +{formatCurrency(diff)} (+{pct}%)
                          </div>
                        )}
                      </>
                    ) : (
                      "-"
                    )}
                  </div>
                </TableCell>
              );
            })}
          </TableRow>
        </TableFooter>
      </Table>
    </TooltipProvider>
  );
}
