"use client";

import { useState, useMemo } from "react";
import { formatCurrency, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import MatchIndicator from "@/components/tests/match-indicator";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link2, Check, Zap, DollarSign, RotateCcw, Clock, X } from "lucide-react";
import { parseTubeColor } from "@/lib/tube-colors";


interface ComparisonTableData {
  tests: {
    id: string;
    canonicalName: string;
    prices: Record<string, number | null>;
    turnaroundTimes?: Record<string, string | null>;
    tubeTypes?: Record<string, string | null>;
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
      if (Number.isFinite(num) && num >= 0) onSave(num);
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  const handleBlur = () => {
    const num = Number(price);
    if (Number.isFinite(num) && num >= 0) onSave(num);
    else onCancel();
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
        className="h-7 w-20 text-xs tabular-nums"
        placeholder="0.00"
      />
      <button
        type="button"
        onClick={onCancel}
        className="text-muted-foreground/60 hover:text-destructive transition-colors"
        aria-label="Annuler"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

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
  onRemoveTest,
  selectionMode = "CUSTOM",
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
  onRemoveTest?: (testMappingId: string) => void;
  selectionMode?: "CHEAPEST" | "FASTEST" | "CUSTOM";
}) {
  const [editingPrice, setEditingPrice] = useState<{ testId: string; labId: string } | null>(null);
  const hasSelections = !!selections && Object.keys(selections).length > 0;

  // Keep only labs that have at least one priced test in the current table.
  const visibleLabs = useMemo(
    () =>
      data.laboratories.filter((lab) =>
        data.tests.some((test) => getEffectivePrice(test.id, lab.id, test.prices[lab.id], customPrices) != null)
      ),
    [data.laboratories, data.tests, customPrices]
  );

  // Calculate effective totals per lab (accounting for custom prices)
  const effectiveTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const lab of visibleLabs) {
      let total = 0;
      for (const test of data.tests) {
        const price = getEffectivePrice(test.id, lab.id, test.prices[lab.id], customPrices);
        if (price != null) total += price;
      }
      totals[lab.id] = total;
    }
    return totals;
  }, [visibleLabs, data.tests, customPrices]);

  // Calculate cheapest lab overall using effective totals
  const cheapestLabId = useMemo(() => {
    let minTotal = Infinity;
    let labId = "";
    for (const [id, total] of Object.entries(effectiveTotals)) {
      if (total != null && total < minTotal) {
        minTotal = total;
        labId = id;
      }
    }
    return labId;
  }, [effectiveTotals]);

  const bestTotal = effectiveTotals[data.bestLabId] ?? 0;

  const selectionTotal = selections
    ? Object.entries(selections).reduce((sum, [testId, labId]) => {
        const test  = data.tests.find((t) => t.id === testId);
        const price = getEffectivePrice(testId, labId, test?.prices[labId] ?? null, customPrices);
        return sum + (price ?? 0);
      }, 0)
    : 0;

  // Calculate quickest lab overall (by average turnaround time)
  const quickestLabId = useMemo(() => {
    let quickestId = "";
    let quickestAvg = Infinity;
    for (const lab of visibleLabs) {
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
  }, [visibleLabs, data.tests]);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-3">

        {/* ── Optimisation toolbar ──────────────────────────────────────── */}
        {onSelectLab && (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border/40 bg-muted/20 px-3 sm:px-4 py-2.5">
            <span className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-widest mr-1">
              Optimiser
            </span>
            <Button
              size="sm"
              variant={selectionMode === "CHEAPEST" ? "default" : "outline"}
              onClick={onPresetCheapest}
              className="h-7 text-xs gap-1.5 rounded-md"
            >
              <DollarSign className="h-3 w-3" />
              Prix
            </Button>
            <Button
              size="sm"
              variant={selectionMode === "FASTEST" ? "default" : "outline"}
              onClick={onPresetQuickest}
              className="h-7 text-xs gap-1.5 rounded-md"
            >
              <Clock className="h-3 w-3" />
              Délai
            </Button>
            {/* Always rendered, hidden via CSS to prevent React 19 removeChild DOM errors */}
            <Button
              size="sm"
              variant="ghost"
              onClick={onClearSelections}
              className={cn("h-7 text-xs gap-1 text-muted-foreground/60", !hasSelections && "hidden")}
            >
              <RotateCcw className="h-3 w-3" />
              Effacer
            </Button>
            <div className={cn("w-full sm:w-auto sm:ml-auto flex items-center gap-2", !hasSelections && "hidden")}>
              <Zap className="h-3.5 w-3.5 text-primary" />
              <span className="text-sm font-bold tabular-nums">
                {formatCurrency(selectionTotal)}
              </span>
              <Badge variant="success" className={cn("text-[10px]", !(selectionTotal < bestTotal && bestTotal > 0) && "hidden")}>
                -{formatCurrency(bestTotal - selectionTotal)}
              </Badge>
            </div>
          </div>
        )}

        {/* ── Matrix table ─────────────────────────────────────────────── */}
        <div className="rounded-lg sm:rounded-xl border border-border/40 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">

              {/* ── Column headers ── */}
              <thead>
                <tr className="border-b border-border/50">
                  {/* Sticky test name column */}
                  <th className="sticky left-0 z-20 bg-card px-3 sm:px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 w-40 min-w-[150px] sm:w-48 sm:min-w-[180px]">
                    Analyse
                  </th>
                  {visibleLabs.map((lab) => {
                    const isCheapest = lab.id === cheapestLabId;
                    const isQuickest = lab.id === quickestLabId;
                    return (
                      <th
                        key={lab.id}
                        className={cn(
                          "px-3 sm:px-5 py-3 text-left min-w-[130px] sm:min-w-[150px]",
                          isCheapest && "bg-emerald-500/[0.04]"
                        )}
                      >
                        <div className="space-y-1.5">
                          <span className="text-xs font-semibold text-foreground/90 whitespace-nowrap">
                            {lab.name}
                          </span>
                          {(isCheapest || isQuickest) && (
                            <div className="flex gap-1.5">
                              {isCheapest && (
                                <span className="inline-flex items-center gap-1 text-[9px] font-medium text-emerald-400/90">
                                  <DollarSign className="h-2.5 w-2.5" />
                                  Moins cher
                                </span>
                              )}
                              {isQuickest && (
                                <span className="inline-flex items-center gap-1 text-[9px] font-medium text-blue-400/90">
                                  <Clock className="h-2.5 w-2.5" />
                                  Plus rapide
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              {/* ── Body rows ── */}
              <tbody>
                {data.tests.map((test, rowIdx) => {
                  const effectivePrices: Record<string, number> = {};
                  visibleLabs.forEach((lab) => {
                    const eff = getEffectivePrice(test.id, lab.id, test.prices[lab.id], customPrices);
                    if (eff != null) effectivePrices[lab.id] = eff;
                  });
                  const minPrice = Object.keys(effectivePrices).length > 0
                    ? Math.min(...Object.values(effectivePrices))
                    : null;

                  // Compute fastest TAT for this row
                  let minTatHours = Infinity;
                  let minTatLabId = "";
                  visibleLabs.forEach((lab) => {
                    const tat = test.turnaroundTimes?.[lab.id];
                    if (tat && effectivePrices[lab.id] != null) {
                      const hours = parseTatToHours(tat);
                      if (hours < minTatHours) {
                        minTatHours = hours;
                        minTatLabId = lab.id;
                      }
                    }
                  });

                  const selectedLabId = selections?.[test.id];
                  const primaryTube = parseTubeColor(
                    visibleLabs.map((lab) => test.tubeTypes?.[lab.id]).find(Boolean) ?? null
                  );

                  return (
                    <tr
                      key={test.id}
                      className={cn(
                        "border-b border-border/20 transition-colors",
                        rowIdx % 2 === 0 ? "bg-transparent" : "bg-muted/[0.03]",
                      )}
                    >
                      {/* ── Test name (sticky) ── */}
                      <td className="sticky left-0 z-10 bg-card px-3 sm:px-4 py-3.5 align-top">
                        <div className="flex items-start gap-2 group/name">
                          {onRemoveTest && (
                            <button
                              onClick={() => onRemoveTest(test.id)}
                              className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-destructive/30 bg-destructive/10 text-destructive/80 transition-colors hover:bg-destructive/20"
                              aria-label="Retirer"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          )}
                          <div className="min-w-0 space-y-1">
                            <span className="block text-[13px] font-medium text-foreground/85 leading-snug">
                              {test.canonicalName}
                            </span>
                            {primaryTube && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground/60">
                                <span
                                  className="inline-block h-2 w-2 rounded-full ring-1 ring-white/10"
                                  style={{ backgroundColor: primaryTube.color }}
                                />
                                {primaryTube.label}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* ── Lab price cells ── */}
                      {visibleLabs.map((lab) => {
                        const match         = data.matchMatrix?.[test.id]?.[lab.id];
                        const tat           = test.turnaroundTimes?.[lab.id];
                        const tubeType      = test.tubeTypes?.[lab.id];
                        const tube          = parseTubeColor(tubeType);
                        const rawPrice      = test.prices[lab.id];
                        const customKey     = `${test.id}-${lab.id}`;
                        const isCustomPrice = customPrices[customKey] !== undefined;
                        const effectivePrice = getEffectivePrice(test.id, lab.id, rawPrice, customPrices);
                        const isCheapest    = minPrice != null && effectivePrice != null && effectivePrice <= minPrice;
                        const isFastestInRow = minTatLabId === lab.id && minTatHours !== Infinity && visibleLabs.length > 1;
                        const isSelected    = selectedLabId === lab.id;

                        return (
                          <td
                            key={lab.id}
                            className={cn(
                              "px-3 sm:px-5 py-3.5 align-top transition-all duration-150",
                              isCheapest && effectivePrice != null && "bg-emerald-500/[0.06]",
                              isSelected && "bg-blue-500/[0.08]",
                            )}
                            style={isSelected ? { boxShadow: "inset 3px 0 0 0 rgb(59 130 246 / 0.6)" } : undefined}
                          >
                            {effectivePrice != null ? (
                              <div className="space-y-1.5">
                                {/* ── Primary: Price row ── */}
                                <div className="flex items-center gap-2">
                                  {/* Selection radio */}
                                  {onSelectLab && (
                                    <button
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); onSelectLab(test.id, lab.id); }}
                                      className={cn(
                                        "flex-shrink-0 h-4 w-4 rounded-full border-[1.5px] transition-all duration-150 flex items-center justify-center",
                                        isSelected
                                          ? "border-blue-400 bg-blue-500"
                                          : "border-muted-foreground/25 hover:border-blue-400/60"
                                      )}
                                      aria-label={`Sélectionner ${lab.name}`}
                                    >
                                      <Check className={cn("h-2.5 w-2.5 text-white", !isSelected && "hidden")} />
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
                                  ) : (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span
                                          className={cn(
                                            "tabular-nums cursor-pointer transition-colors",
                                            isCheapest
                                              ? "text-emerald-400 font-bold text-[13px]"
                                              : "text-foreground/80 font-semibold text-[13px]",
                                            isCustomPrice && "text-blue-400 hover:text-blue-300",
                                            !isCustomPrice && "hover:text-blue-400",
                                          )}
                                          onDoubleClick={() => setEditingPrice({ testId: test.id, labId: lab.id })}
                                        >
                                          {formatCurrency(effectivePrice)}
                                        </span>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        {isCustomPrice ? (
                                          <>
                                            <p className="text-xs text-blue-300">Prix personnalisé</p>
                                            <p className="text-xs mt-1 text-muted-foreground">Double-cliquez pour modifier</p>
                                          </>
                                        ) : (
                                          <p className="text-xs text-muted-foreground">Double-cliquez pour modifier le prix</p>
                                        )}
                                      </TooltipContent>
                                    </Tooltip>
                                  )}

                                  {/* Diff from cheapest — compact inline % */}
                                  {minPrice != null && effectivePrice != null && !isCheapest && (
                                    (() => {
                                      const pct = minPrice > 0 ? Math.round(((effectivePrice - minPrice) / minPrice) * 100) : 0;
                                      return (
                                        <span className="text-[10px] text-muted-foreground/40 tabular-nums">
                                          +{pct}%
                                        </span>
                                      );
                                    })()
                                  )}
                                </div>

                                {/* Per-row badges */}
                                {((isCheapest && effectivePrice != null && visibleLabs.length > 1) || isFastestInRow) && (
                                  <div className="flex flex-wrap gap-1">
                                    {isCheapest && effectivePrice != null && visibleLabs.length > 1 && (
                                      <span className="inline-flex items-center gap-0.5 text-[9px] font-medium text-emerald-400/80 bg-emerald-500/[0.08] rounded px-1 py-0.5">
                                        <DollarSign className="h-2 w-2" />
                                        Moins cher
                                      </span>
                                    )}
                                    {isFastestInRow && (
                                      <span className="inline-flex items-center gap-0.5 text-[9px] font-medium text-blue-400/80 bg-blue-500/[0.08] rounded px-1 py-0.5">
                                        <Clock className="h-2 w-2" />
                                        Plus rapide
                                      </span>
                                    )}
                                  </div>
                                )}

                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-0.5">
                                  {tat && (
                                    <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground/60">
                                      <Clock className="h-2.5 w-2.5 shrink-0" />
                                      {tat}
                                    </span>
                                  )}
                                  {tube && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span className="inline-flex items-center gap-1">
                                          <span
                                            className="inline-block h-2 w-2 rounded-full ring-1 ring-white/10"
                                            style={{ backgroundColor: tube.color }}
                                          />
                                          <span className="text-[10px] text-muted-foreground/50">{tube.label}</span>
                                        </span>
                                      </TooltipTrigger>
                                      <TooltipContent side="top">{tube.label}</TooltipContent>
                                    </Tooltip>
                                  )}
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
                                              className="text-muted-foreground/30 hover:text-primary transition-colors">
                                              <Link2 className="h-2.5 w-2.5" />
                                            </button>
                                          </TooltipTrigger>
                                          <TooltipContent>Corriger la correspondance</TooltipContent>
                                        </Tooltip>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : (
                              /* ── No price available ── */
                              <div className="flex items-center gap-1.5">
                                <span className="text-[13px] text-muted-foreground/25">—</span>
                                {data.onCreateMapping && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <button onClick={() => data.onCreateMapping!(test.id, lab.id)}
                                        className="text-muted-foreground/25 hover:text-primary transition-colors">
                                        <Link2 className="h-3 w-3" />
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent>Créer une correspondance</TooltipContent>
                                  </Tooltip>
                                )}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>

              {/* ── Footer totals ── */}
              <tfoot>
                <tr className="border-t-2 border-border/40 bg-muted/[0.06]">
                  <td className="sticky left-0 z-10 bg-card px-3 sm:px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-muted-foreground/60">
                    Total
                  </td>
                  {visibleLabs.map((lab) => {
                    const total  = effectiveTotals[lab.id] ?? data.totals[lab.id];
                    const isBest = lab.id === data.bestLabId;
                    const diff   = total != null && !isBest ? total - bestTotal : 0;
                    const pct    = bestTotal > 0 && total != null && !isBest
                      ? Math.round((diff / bestTotal) * 100) : 0;
                    return (
                      <td
                        key={lab.id}
                        className={cn(
                          "px-3 sm:px-5 py-3.5",
                          isBest && "bg-emerald-500/[0.06]"
                        )}
                      >
                        {total != null ? (
                          <div className="flex items-baseline gap-2">
                            <span
                              className={cn(
                                "text-sm font-bold tabular-nums",
                                isBest ? "text-emerald-400" : "text-foreground/80"
                              )}
                            >
                              {formatCurrency(total)}
                            </span>
                            {!isBest && total > bestTotal && (
                              <span className="text-[10px] text-muted-foreground/35 tabular-nums">
                                +{pct}%
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground/25">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
