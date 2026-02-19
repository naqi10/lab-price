"use client";

import { useState, useMemo } from "react";
import { formatCurrency, cn } from "@/lib/utils";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import MatchIndicator from "@/components/tests/match-indicator";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Link2, Pencil, Check, Trash2, Zap, DollarSign, RotateCcw, Clock, Trophy, X } from "lucide-react";
import type { LabColor } from "@/hooks/use-lab-colors";

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
    turnaroundTimes?: Record<string, string | null>;
  }[];
  laboratories: { id: string; name: string }[];
  totals: Record<string, number>;
  bestLabId: string;
  matchMatrix?: Record<
    string,
    Record<string, { matchType: string; similarity: number; localTestName: string } | null>
  >;
  onCreateMapping?: (testMappingId: string, laboratoryId: string) => void;
}

function getEffectivePrice(
  testId: string,
  labId: string,
  basePrice: number | null,
  customPrices?: Record<string, number>
): number | null {
  // Custom prices take priority over base price
  const key = `${testId}-${labId}`;
  if (customPrices?.[key] !== undefined) return customPrices[key];
  return basePrice;
}

function InlinePriceEditor({
  testId, labId, currentPrice, onSave, onCancel,
}: {
  testId: string; labId: string; currentPrice: number;
  onSave: (price: number) => void;
  onCancel: () => void;
}) {
  const [price, setPrice] = useState(currentPrice.toString());

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const num = Number(price);
      if (Number.isFinite(num) && num >= 0) {
        onSave(num);
      }
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  const handleBlur = () => {
    const num = Number(price);
    if (Number.isFinite(num) && num >= 0) {
      onSave(num);
    } else {
      onCancel();
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      <Input
        autoFocus
        type="number"
        min={0}
        step={0.01}
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        className="h-8 w-24 text-sm tabular-nums"
        placeholder="0.00"
      />
      <button
        type="button"
        onClick={onCancel}
        className="text-muted-foreground/60 hover:text-destructive transition-colors"
        aria-label="Annuler"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export default function ComparisonTable({
  data,
  selections,
  customPrices = {},
  onSelectLab,
  onPresetCheapest,
  onPresetQuickest,
  onClearSelections,
  onUpdateCustomPrice,
  onClearCustomPrice,
  labColorMap = {},
}: {
  data: ComparisonTableData;
  selections?: Record<string, string>;
  customPrices?: Record<string, number>;
  onSelectLab?: (testId: string, labId: string) => void;
  onPresetCheapest?: () => void;
  onPresetQuickest?: () => void;
  onClearSelections?: () => void;
  onUpdateCustomPrice?: (testId: string, labId: string, price: number) => void;
  onClearCustomPrice?: (testId: string, labId: string) => void;
  labColorMap?: Record<string, LabColor>;
}) {
  const bestTotal    = data.totals[data.bestLabId] ?? 0;
  const [openOverride, setOpenOverride] = useState<{ testId: string; labId: string } | null>(null);
  const [editingPrice, setEditingPrice] = useState<{ testId: string; labId: string } | null>(null);
  const hasSelections = !!selections && Object.keys(selections).length > 0;

   const selectionTotal = selections
     ? Object.entries(selections).reduce((sum, [testId, labId]) => {
         const test  = data.tests.find((t) => t.id === testId);
         const price = getEffectivePrice(testId, labId, test?.prices[labId] ?? null, customPrices);
         return sum + (price ?? 0);
      }, 0)
    : 0;

  // Calculate cheapest lab overall
  const cheapestLabId = useMemo(() => {
    let minTotal = Infinity;
    let labId = "";
    for (const [id, total] of Object.entries(data.totals)) {
      if (total != null && total < minTotal) {
        minTotal = total;
        labId = id;
      }
    }
    return labId;
  }, [data.totals]);

  // Calculate quickest lab overall (by average turnaround time)
  const quickestLabId = useMemo(() => {
    let quickestId = "";
    let quickestAvg = Infinity;
    for (const lab of data.laboratories) {
      const times: number[] = [];
      for (const test of data.tests) {
        const tat = test.turnaroundTimes?.[lab.id];
        if (tat) {
          const hours = parseTatToHours(tat);
          if (hours !== Infinity) times.push(hours);
        }
      }
      if (times.length > 0) {
        const avg = times.reduce((a, b) => a + b, 0) / times.length;
        if (avg < quickestAvg) {
          quickestAvg = avg;
          quickestId = lab.id;
        }
      }
    }
    return quickestId;
  }, [data.laboratories, data.tests]);

  // Helper to parse turnaround time into hours for comparison
  function parseTatToHours(tat: string): number {
    if (!tat) return Infinity;
    const s = tat.toLowerCase().trim();
    if (s.includes("même jour") || s.includes("same day")) return 0;
    const hoursMatch = s.match(/(\d+)(?:\s*[–-]\s*(\d+))?\s*h/);
    if (hoursMatch) return Number(hoursMatch[1]);
    const daysMatch = s.match(/(\d+)(?:\s*[–-]\s*(\d+))?\s*(?:jour|day|business)/);
    if (daysMatch) return Number(daysMatch[1]) * 24;
    return Infinity;
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-3">

        {/* ── Optimisation toolbar ──────────────────────────────────────── */}
        {onSelectLab && (
          <div
            key={hasSelections ? "toolbar-sel" : "toolbar-def"}
            className="flex flex-wrap items-center gap-2 rounded-xl border border-border/50 bg-card px-4 py-3"
          >
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mr-1">
              Optimiser par&nbsp;:
            </span>
            <Button size="sm" variant="outline" onClick={onPresetCheapest} className="h-7 text-xs gap-1.5">
              <DollarSign className="h-3.5 w-3.5" />
              Prix le plus bas
            </Button>
            <Button size="sm" variant="outline" onClick={onPresetQuickest} className="h-7 text-xs gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Délai le plus court
            </Button>
            {hasSelections && (
              <Button size="sm" variant="ghost" onClick={onClearSelections} className="h-7 text-xs gap-1.5 text-muted-foreground">
                <RotateCcw className="h-3.5 w-3.5" />
                Réinitialiser
              </Button>
            )}
            {hasSelections && (
              <div className="ml-auto flex items-center gap-2">
                <Zap className="h-3.5 w-3.5 text-primary" />
                <span className="text-sm font-semibold tabular-nums">
                  {formatCurrency(selectionTotal)}
                </span>
                {selectionTotal < bestTotal && bestTotal > 0 && (
                  <Badge variant="success" className="text-[10px]">
                    -{formatCurrency(bestTotal - selectionTotal)}
                  </Badge>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Matrix table ─────────────────────────────────────────────── */}
        <div className="rounded-xl border border-border/50 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50">
                <TableHead className="bg-card font-semibold text-xs uppercase tracking-wider text-muted-foreground w-44">
                  Test
                </TableHead>
                {data.laboratories.map((lab) => {
                   const color  = labColorMap[lab.id];
                   const isBest = lab.id === data.bestLabId;
                   const isCheapest = lab.id === cheapestLabId;
                   const isQuickest = lab.id === quickestLabId;
                   return (
                     <TableHead
                       key={lab.id}
                       className="text-xs font-semibold"
                       style={
                         color
                           ? { backgroundColor: color.bg, borderBottom: `2px solid ${isBest ? color.dot : color.border}` }
                           : undefined
                       }
                     >
                       <div className="flex flex-col gap-1.5">
                         <div className="flex items-center gap-1.5 whitespace-nowrap">
                           {color && (
                             <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: color.dot }} />
                           )}
                           <span style={color ? { color: color.text } : undefined}>{lab.name}</span>
                           {isBest && <Trophy className="h-3 w-3 text-amber-400 shrink-0" />}
                         </div>
                         <div className="flex gap-1 flex-wrap">
                           {isCheapest && (
                             <Badge variant="outline" className="text-[9px] py-0.5 bg-emerald-500/10 border-emerald-500/30 text-emerald-400">
                               Moins cher
                             </Badge>
                           )}
                           {isQuickest && (
                             <Badge variant="outline" className="text-[9px] py-0.5 bg-blue-500/10 border-blue-500/30 text-blue-400">
                               Plus rapide
                             </Badge>
                           )}
                         </div>
                       </div>
                     </TableHead>
                   );
                 })}
              </TableRow>
            </TableHeader>

             <TableBody>
               {data.tests.map((test) => {
                 const effectivePrices: Record<string, number> = {};
                 data.laboratories.forEach((lab) => {
                   const eff = getEffectivePrice(test.id, lab.id, test.prices[lab.id], customPrices);
                   if (eff != null) effectivePrices[lab.id] = eff;
                 });
                 const minPrice = Object.keys(effectivePrices).length > 0
                   ? Math.min(...Object.values(effectivePrices))
                   : null;
                 const selectedLabId = selections?.[test.id];

                 return (
                   <TableRow key={test.id} className="border-border/30">
                     <TableCell className="font-medium text-sm py-3 align-top">
                       {test.canonicalName}
                     </TableCell>
                       {data.laboratories.map((lab) => {
                        const color         = labColorMap[lab.id];
                        const match         = data.matchMatrix?.[test.id]?.[lab.id];
                        const tat           = test.turnaroundTimes?.[lab.id];
                        const rawPrice      = test.prices[lab.id];
                        const customKey     = `${test.id}-${lab.id}`;
                        const isCustomPrice = customPrices[customKey] !== undefined;
                        const effectivePrice = getEffectivePrice(test.id, lab.id, rawPrice, customPrices);
                        const isCheapest    = minPrice != null && effectivePrice != null && effectivePrice <= minPrice;
                        const isSelected    = selectedLabId === lab.id;

                       return (
                         <TableCell
                           key={lab.id}
                           className={cn("py-3 align-top transition-all duration-200", isSelected && "border-l-4 border-primary")}
                           style={
                             isSelected
                               ? { backgroundColor: "rgba(59,130,246,0.15)" }
                               : color
                                 ? { backgroundColor: `${color.bg}` }
                                 : undefined
                           }
                         >
                           {effectivePrice != null ? (
                             <div className="space-y-1">
                               <div className="flex items-center gap-1.5">
                                 {/* Selection radio */}
                                 {onSelectLab && (
                                   <button
                                     type="button"
                                     onClick={(e) => { e.stopPropagation(); onSelectLab(test.id, lab.id); }}
                                     className={cn(
                                       "flex-shrink-0 h-5 w-5 rounded-full border-2 transition-all duration-200 flex items-center justify-center",
                                       isSelected
                                         ? "border-blue-400 bg-blue-500 shadow-lg shadow-blue-500/50 scale-110"
                                         : "border-muted-foreground/40 hover:border-blue-400/70 hover:shadow-md hover:shadow-blue-500/20"
                                     )}
                                     aria-label={`Sélectionner ${lab.name}`}
                                   >
                                     {isSelected && <Check className="h-3 w-3 text-white font-bold" />}
                                   </button>
                                 )}

                                  {/* Price */}
                                  {editingPrice?.testId === test.id && editingPrice?.labId === lab.id ? (
                                    <InlinePriceEditor
                                      testId={test.id}
                                      labId={lab.id}
                                      currentPrice={effectivePrice!}
                                      onSave={(price) => {
                                        onUpdateCustomPrice?.(test.id, lab.id, price);
                                        setEditingPrice(null);
                                      }}
                                      onCancel={() => setEditingPrice(null)}
                                    />
                                  ) : isCustomPrice ? (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span
                                          className="font-semibold text-sm tabular-nums text-blue-400 cursor-pointer hover:text-blue-300 transition-colors"
                                          onDoubleClick={() => setEditingPrice({ testId: test.id, labId: lab.id })}
                                        >
                                          {formatCurrency(effectivePrice)}
                                        </span>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p className="text-xs text-blue-300">Prix personnalisé pour cette estimation</p>
                                        <p className="text-xs mt-1 text-muted-foreground">Double-cliquez pour modifier</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  ) : (
                                    <span
                                      className="font-semibold text-sm tabular-nums cursor-pointer hover:text-blue-400 transition-colors"
                                      onDoubleClick={() => setEditingPrice({ testId: test.id, labId: lab.id })}
                                      title="Double-cliquez pour modifier le prix"
                                    >
                                      {formatCurrency(effectivePrice)}
                                    </span>
                                  )}

                                </div>

                                {/* Cheapest / diff indicator */}
                              {minPrice != null && effectivePrice != null && (
                                isCheapest ? (
                                  <div className="text-[10px] font-medium text-emerald-400">Meilleur prix</div>
                                ) : (
                                  (() => {
                                    const diff = effectivePrice - minPrice;
                                    const pct  = minPrice > 0 ? Math.round((diff / minPrice) * 100) : 0;
                                    return (
                                      <div className="text-[10px] text-amber-500/80">
                                        +{formatCurrency(diff)} (+{pct}%)
                                      </div>
                                    );
                                  })()
                                )
                              )}

                              {/* Turnaround */}
                              {tat && (
                                <div className="flex items-center gap-1 text-[10px] text-muted-foreground/60">
                                  <Clock className="h-2.5 w-2.5 shrink-0" />
                                  <span className="whitespace-nowrap">{tat}</span>
                                </div>
                              )}

                              {/* Match quality */}
                              {match && (
                                <div className="flex items-center gap-1">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span>
                                        <MatchIndicator type={match.matchType} confidence={match.similarity} compact />
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="text-xs">Nom local : <strong>{match.localTestName}</strong></p>
                                      <p className="text-xs">Confiance : {Math.round(match.similarity * 100)}%</p>
                                    </TooltipContent>
                                  </Tooltip>
                                  {match.matchType === "FUZZY" && data.onCreateMapping && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <button onClick={() => data.onCreateMapping!(test.id, lab.id)}
                                          className="text-muted-foreground/40 hover:text-primary transition-colors">
                                          <Link2 className="h-3 w-3" />
                                        </button>
                                      </TooltipTrigger>
                                      <TooltipContent>Corriger la correspondance</TooltipContent>
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
                                    <button onClick={() => data.onCreateMapping!(test.id, lab.id)}
                                      className="text-muted-foreground/40 hover:text-primary transition-colors">
                                      <Link2 className="h-3 w-3" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent>Créer une correspondance manuelle</TooltipContent>
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
              <TableRow className="border-border/50">
                <TableCell className="font-bold text-sm uppercase tracking-wide text-muted-foreground">
                  Total
                </TableCell>
                {data.laboratories.map((lab) => {
                  const color  = labColorMap[lab.id];
                  const total  = data.totals[lab.id];
                  const isBest = lab.id === data.bestLabId;
                  const diff   = total != null && !isBest ? total - bestTotal : 0;
                  const pct    = bestTotal > 0 && total != null && !isBest
                    ? Math.round((diff / bestTotal) * 100) : 0;
                  return (
                    <TableCell
                      key={lab.id}
                      className="font-bold"
                      style={color ? { backgroundColor: color.bg } : undefined}
                    >
                      <div>
                        {total != null ? (
                          <>
                            <span
                              className="text-sm tabular-nums"
                              style={isBest ? { color: "#fbbf24" } : color ? { color: color.text } : undefined}
                            >
                              {formatCurrency(total)}
                            </span>
                            {!isBest && total > bestTotal && (
                              <div className="text-[10px] font-normal text-muted-foreground/60 mt-0.5">
                                +{formatCurrency(diff)} (+{pct}%)
                              </div>
                            )}
                            {isBest && (
                              <div className="text-[10px] font-medium text-amber-400/80 mt-0.5">
                                Meilleur total
                              </div>
                            )}
                          </>
                        ) : "—"}
                      </div>
                    </TableCell>
                  );
                })}
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </div>
    </TooltipProvider>
  );
}
