"use client";

import { formatCurrency, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Trophy, Clock, Zap, AlertTriangle } from "lucide-react";
import type { LabColor } from "@/hooks/use-lab-colors";

interface LabCostSummaryProps {
  labs: {
    id: string;
    name: string;
    total: number;
    missingTests: number;
    isComplete: boolean;
    turnaroundTimes: { testName: string; tat: string }[];
  }[];
  bestLabId: string;
  selections?: Record<string, string>;
  selectionTotal?: number;
  testNames?: string[];
  testMappingIds?: string[];
  laboratories?: { id: string; name: string }[];
  labColorMap?: Record<string, LabColor>;
}

export default function LabCostSummary({
  labs,
  bestLabId,
  selections,
  selectionTotal = 0,
  testNames = [],
  testMappingIds = [],
  laboratories = [],
  labColorMap = {},
}: LabCostSummaryProps) {
  const bestLab     = labs.find((l) => l.id === bestLabId);
  const sorted      = [...labs].sort((a, b) => {
    if (a.isComplete && !b.isComplete) return -1;
    if (!a.isComplete && b.isComplete) return 1;
    return a.total - b.total;
  });
  const maxTotal    = sorted.reduce((m, l) => Math.max(m, l.total), 0);

  const hasSelections  = !!selections && Object.keys(selections).length > 0;
  const labNameMap     = new Map(laboratories.map((l) => [l.id, l.name]));
  const involvedLabIds = hasSelections ? [...new Set(Object.values(selections!))] : [];
  const isMultiLab     = involvedLabIds.length > 1;

  return (
    <div className="space-y-4">

      {/* ── Optimised selection card ──────────────────────────────────── */}
      {hasSelections && (
        <div className="rounded-xl border border-primary/30 bg-primary/8 p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-9 w-9 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
                <Zap className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {isMultiLab ? "Sélection optimisée multi-laboratoires" : "Sélection personnalisée"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {involvedLabIds.length} labo{involvedLabIds.length > 1 ? "s" : ""} · {Object.keys(selections!).length} test{Object.keys(selections!).length > 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-2xl font-bold text-primary tabular-nums">{formatCurrency(selectionTotal)}</p>
              {bestLab && selectionTotal < bestLab.total && (
                <p className="text-xs text-emerald-400 mt-0.5">
                  -{formatCurrency(bestLab.total - selectionTotal)} vs {bestLab.name}
                </p>
              )}
            </div>
          </div>

          {/* Per-test breakdown */}
          <div className="mt-4 space-y-1.5">
            {testMappingIds.map((tmId, i) => {
              const labId   = selections![tmId];
              const labName = labId ? labNameMap.get(labId) ?? "—" : "—";
              const color   = labId ? labColorMap[labId] : undefined;
              return (
                <div key={tmId} className="flex items-center justify-between text-xs gap-3">
                  <span className="text-muted-foreground truncate">{testNames[i] ?? tmId}</span>
                  <span
                    className="shrink-0 px-2 py-0.5 rounded-full text-[11px] font-medium border"
                    style={
                      color
                        ? { color: color.text, backgroundColor: color.bg, borderColor: color.border }
                        : { color: "hsl(var(--muted-foreground))", backgroundColor: "hsl(var(--muted)/0.3)", borderColor: "hsl(var(--border))" }
                    }
                  >
                    {labName}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Lab leaderboard ───────────────────────────────────────────── */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((lab, idx) => {
          const isBest   = lab.id === bestLabId;
          const color    = labColorMap[lab.id];
          const barPct   = maxTotal > 0 ? Math.round((lab.total / maxTotal) * 100) : 100;
          const diff     = !isBest && bestLab ? lab.total - bestLab.total : 0;
          const pct      = bestLab && bestLab.total > 0 && !isBest
            ? Math.round((diff / bestLab.total) * 100) : 0;

          return (
            <div
              key={lab.id}
              className="relative rounded-xl border overflow-hidden"
              style={
                color
                  ? { borderColor: isBest && !hasSelections ? color.dot : color.border, backgroundColor: color.bg }
                  : { borderColor: "rgba(148,163,184,0.2)", backgroundColor: "rgba(148,163,184,0.05)" }
              }
            >
              {/* Progress fill */}
              <div
                className="absolute inset-y-0 left-0 opacity-15"
                style={{
                  width: `${barPct}%`,
                  backgroundColor: color?.dot ?? "#94a3b8",
                  transition: "width 0.6s ease",
                }}
              />

              <div className="relative p-4">
                {/* Header row */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    {color && (
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0 mt-0.5"
                        style={{ backgroundColor: color.dot }}
                      />
                    )}
                    <span
                      className="text-sm font-semibold leading-tight"
                      style={color ? { color: color.text } : undefined}
                    >
                      {lab.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {isBest && !hasSelections && (
                      <Trophy className="h-4 w-4 text-amber-400" />
                    )}
                    {!lab.isComplete && (
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500/70" />
                    )}
                    <span className="text-[11px] font-bold text-muted-foreground/50 tabular-nums">
                      #{idx + 1}
                    </span>
                  </div>
                </div>

                {/* Price */}
                <p
                  className="text-2xl font-bold tabular-nums"
                  style={isBest && !hasSelections ? { color: "#fbbf24" } : color ? { color: color.text } : undefined}
                >
                  {formatCurrency(lab.total)}
                </p>

                {/* Diff vs best */}
                {!isBest && bestLab && diff > 0 && (
                  <p className="text-xs text-muted-foreground/70 mt-0.5">
                    +{formatCurrency(diff)} ({pct}% de plus)
                  </p>
                )}
                {isBest && !hasSelections && (
                  <p className="text-xs text-amber-400/80 mt-0.5">Meilleur prix global</p>
                )}

                {/* Missing tests warning */}
                {lab.missingTests > 0 && (
                  <p className="text-xs text-amber-500/80 mt-1">
                    {lab.missingTests} test{lab.missingTests > 1 ? "s" : ""} manquant{lab.missingTests > 1 ? "s" : ""}
                  </p>
                )}

                {/* Turnaround times */}
                {lab.turnaroundTimes.length > 0 && (
                  <div className="mt-3 pt-3 border-t space-y-1.5"
                    style={{ borderColor: color?.border ?? "rgba(148,163,184,0.15)" }}
                  >
                    {lab.turnaroundTimes.map(({ testName, tat }) => (
                      <div key={testName} className="flex items-start gap-1.5">
                        <Clock className="h-3 w-3 mt-0.5 shrink-0 text-muted-foreground/50" />
                        <span className="text-xs text-muted-foreground/70 leading-tight">
                          <span className="text-foreground/60 font-medium">{testName}</span>
                          {" — "}
                          {tat}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
