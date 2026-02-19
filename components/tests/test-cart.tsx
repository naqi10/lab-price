"use client";

import { useEffect, useState } from "react";
import { X, Trophy, FlaskConical, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import type { LabColor } from "@/hooks/use-lab-colors";

interface CartItem {
  id: string;
  testMappingId: string;
  canonicalName: string;
}

interface LabTotal {
  id: string;
  name: string;
  total: number;
  testCount: number;
  isComplete: boolean;
}

export default function TestCart({
  items,
  isReady = true,
  onRemove,
  onClear,
  onCompare,
  labColorMap = {},
}: {
  items: CartItem[];
  isReady?: boolean;
  onRemove: (id: string) => void;
  onClear: () => void;
  onCompare: () => void;
  labColorMap?: Record<string, LabColor>;
}) {
  const [labTotals, setLabTotals]         = useState<LabTotal[]>([]);
  const [loadingTotals, setLoadingTotals] = useState(false);

  useEffect(() => {
    if (items.length === 0) { setLabTotals([]); return; }
    const testMappingIds = items.map((i) => i.testMappingId);
    setLoadingTotals(true);
    fetch("/api/comparison/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ testMappingIds }),
    })
      .then((r) => r.json())
      .then((d) => { if (d.success) setLabTotals(d.data || []); })
      .catch(() => {})
      .finally(() => setLoadingTotals(false));
  }, [items]);

  // Empty state
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/40 flex flex-col items-center justify-center py-10 gap-3 text-center px-4">
        <div className="h-9 w-9 rounded-full bg-muted/30 flex items-center justify-center">
          <FlaskConical className="h-4 w-4 text-muted-foreground/40" />
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed max-w-[160px]">
          Cliquez sur <span className="font-semibold text-foreground/50">+</span> dans le tableau pour sélectionner des tests
        </p>
      </div>
    );
  }

  const completeLabs = labTotals.filter((l) => l.isComplete);
  const bestLab      = completeLabs.length > 0
    ? completeLabs.reduce((a, b) => a.total < b.total ? a : b)
    : null;
  const maxTotal     = labTotals.reduce((m, l) => Math.max(m, l.total), 0);

  return (
    <div className="rounded-xl border border-border/60 bg-card overflow-hidden flex flex-col">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-card/80">
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-semibold tracking-tight">Sélection</span>
          <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-primary/20 text-primary text-[11px] font-bold tabular-nums">
            {isReady ? items.length : "…"}
          </span>
        </div>
        <button
          onClick={onClear}
          className="text-[11px] text-muted-foreground/60 hover:text-destructive transition-colors"
        >
          Tout effacer
        </button>
      </div>

      {/* ── Selected tests list ──────────────────────────────────────── */}
      <ul className="divide-y divide-border/30 max-h-44 overflow-y-auto border-b border-border/30">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between gap-3 px-4 py-2 group hover:bg-muted/20 transition-colors"
          >
            <span className="text-xs text-foreground/75 leading-snug">{item.canonicalName}</span>
            <button
              onClick={() => onRemove(item.id)}
              className="shrink-0 text-muted-foreground/30 hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
              aria-label="Retirer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
      </ul>

      {/* ── Lab leaderboard ──────────────────────────────────────────── */}
      <div className="px-4 py-3 space-y-2.5 flex-1">
        <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest">
          Classement par prix
        </p>

        {loadingTotals ? (
          <div className="flex items-center gap-2 py-4 justify-center">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground/40" />
            <span className="text-xs text-muted-foreground/50">Calcul en cours…</span>
          </div>
        ) : labTotals.length === 0 ? (
          <p className="text-xs text-muted-foreground/60 py-2">Aucune donnée disponible</p>
        ) : (
          <ol className="space-y-2">
            {labTotals.map((lab, idx) => {
              const color   = labColorMap[lab.id];
              const isBest  = bestLab?.id === lab.id;
              const barPct  = maxTotal > 0 ? Math.round((lab.total / maxTotal) * 100) : 100;

              return (
                <li key={lab.id} className="group">
                  <div
                    className="relative rounded-lg overflow-hidden border transition-all"
                    style={
                      color
                        ? { borderColor: color.border, backgroundColor: color.bg }
                        : { borderColor: "rgba(148,163,184,0.15)", backgroundColor: "rgba(148,163,184,0.05)" }
                    }
                  >
                    {/* Progress fill */}
                    <div
                      className="absolute inset-y-0 left-0 opacity-20 transition-all duration-700"
                      style={{
                        width: `${barPct}%`,
                        backgroundColor: color?.dot ?? "#94a3b8",
                      }}
                    />

                    <div className="relative flex items-center justify-between px-3 py-2 gap-2">
                      {/* Left: rank + dot + name */}
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[10px] font-bold tabular-nums text-muted-foreground/40 w-3 shrink-0">
                          {idx + 1}
                        </span>
                        {color ? (
                          <span
                            className="h-2 w-2 rounded-full shrink-0"
                            style={{ backgroundColor: color.dot }}
                          />
                        ) : (
                          <span className="h-2 w-2 rounded-full bg-muted shrink-0" />
                        )}
                        <span
                          className="text-xs font-medium truncate"
                          style={color ? { color: color.text } : undefined}
                        >
                          {lab.name}
                        </span>
                        {isBest && (
                          <Trophy className="h-3 w-3 text-amber-400 shrink-0" />
                        )}
                        {!lab.isComplete && (
                          <Badge variant="outline" className="text-[9px] h-3.5 px-1 shrink-0 border-border/50">
                            {lab.testCount}/{items.length}
                          </Badge>
                        )}
                      </div>

                      {/* Right: total */}
                      <span
                        className="text-xs font-bold tabular-nums shrink-0"
                        style={isBest ? { color: "#fbbf24" } : color ? { color: color.text } : undefined}
                      >
                        {formatCurrency(lab.total)}
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <div className="px-4 pb-4 pt-1">
        <Button onClick={onCompare} className="w-full gap-2 h-9">
          Comparer en détail
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
