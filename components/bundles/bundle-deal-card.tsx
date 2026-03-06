"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Pipette } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import {
  type Bundle,
  type ComponentTest,
  CATEGORY_COLORS,
  DEFAULT_CATEGORY_COLOR,
} from "@/lib/data/bundles";
import { getTubeColor } from "@/lib/data/profile-metadata";
import { cn } from "@/lib/utils";

interface BundleDealCardProps {
  bundle: Bundle;
  loading: boolean;
  onSend: () => void;
  bestValue?: boolean;
}

function cleanBundleName(name: string): string {
  return name.replace(/,\s*PROFIL(E)?$/i, "").replace(/\s+PROFIL(E)?$/i, "").trim();
}

function parseTubes(tubeLabel: string): string[] {
  return tubeLabel.split("+").map((t) => t.trim()).filter(Boolean);
}

/** Fixed-size tube color dot — always perfectly circular, never stretches. */
function TubeColorDot({ tubeType }: { tubeType: string | null }) {
  const colorClass = tubeType ? getTubeColor(tubeType) : "bg-slate-300";
  return (
    <span
      aria-hidden="true"
      className={cn("rounded-full shrink-0", colorClass)}
      style={{ width: 10, height: 10, minWidth: 10, minHeight: 10, display: "inline-block" }}
    />
  );
}

/** Deduplicated component test list — one row per test with tube dot, name, code. */
function BundleTestList({ tests }: { tests: ComponentTest[] }) {
  if (tests.length === 0) return null;
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        Tests inclus ({tests.length})
      </p>
      <ul className="space-y-0.5 list-none p-0 m-0">
        {tests.map((test) => (
          <li key={test.id} className="flex items-center gap-2 min-w-0">
            <TubeColorDot tubeType={test.tubeType} />
            <span className="text-[11px] text-foreground/80 leading-tight truncate flex-1 min-w-0">
              {test.name}
            </span>
            {test.code && (
              <span className="text-[10px] font-mono text-muted-foreground bg-muted/60 px-1 rounded shrink-0">
                {test.code}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function BundleDealCard({
  bundle,
  loading,
  onSend,
  bestValue,
}: BundleDealCardProps) {

  const colors = CATEGORY_COLORS[bundle.category] ?? DEFAULT_CATEGORY_COLOR;
  const tubes = bundle.profileTube ? parseTubes(bundle.profileTube) : [];
  const componentTests = bundle.componentTests ?? [];

  return (
    <div
      className={cn(
        "group relative rounded-xl border bg-card overflow-hidden transition-all duration-300 h-full flex flex-col",
        "hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5",
        bestValue
          ? "border-amber-500/40 ring-1 ring-amber-500/20"
          : "border-border/50 hover:border-border"
      )}
    >
      <div className={cn("h-1", colors.accent)} />

      {bestValue && (
        <div className="absolute top-3 right-3 z-10">
          <Badge className="bg-amber-500/15 text-amber-700 border-amber-500/25 text-[11px] font-semibold">
            Meilleure offre
          </Badge>
        </div>
      )}

      <div className={cn("absolute inset-0 bg-gradient-to-b pointer-events-none", colors.gradient)} />

      <div className="relative p-4 flex flex-col flex-1 gap-3">
        <div>
          <div className="flex items-start gap-2">
            {bundle.profileCode && (
              <span className="text-[11px] font-mono text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded shrink-0 mt-0.5">
                {bundle.profileCode}
              </span>
            )}
            <h3 className="text-base font-semibold leading-tight text-foreground">
              {cleanBundleName(bundle.dealName)}
            </h3>
          </div>
          <div className="mt-2">
            <Badge variant="outline" className={cn("text-[11px] border text-foreground/80", colors.badge)}>
              {bundle.category}
            </Badge>
          </div>
        </div>

        <BundleTestList tests={componentTests} />

        {(tubes.length > 0 || bundle.profileTurnaround) && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {tubes.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <Pipette className="h-3 w-3 shrink-0" />
                {tubes.map((tube) => (
                  <span key={tube} className="flex items-center gap-1">
                    <TubeColorDot tubeType={tube} />
                    <span className="text-[11px]">{tube}</span>
                  </span>
                ))}
              </div>
            )}
            {bundle.profileTurnaround && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 shrink-0" />
                <span className="text-[11px]">
                  {bundle.profileTurnaround === "1"
                    ? "Résultats en 1 jour"
                    : `Résultats en ${bundle.profileTurnaround} jours`}
                </span>
              </div>
            )}
          </div>
        )}

        {bundle.description && (
          <p className="text-[11px] text-muted-foreground leading-snug line-clamp-3 border-l-2 border-primary/30 pl-2">
            {bundle.description}
          </p>
        )}

        {bundle.profileNotes && (
          <p className="text-[10px] text-muted-foreground/80 italic leading-snug line-clamp-2 border-l-2 border-border/60 pl-2">
            {bundle.profileNotes}
          </p>
        )}

        <div className="flex-1" />

        <div className="flex items-end justify-between gap-2 pt-2 border-t border-border/30">
          <div className="space-y-0.5">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Prix du profil</p>
            {loading ? (
              <div className="text-sm text-muted-foreground animate-pulse">Calcul...</div>
            ) : (
              <p className="text-2xl font-bold text-foreground tabular-nums">
                {formatCurrency(bundle.customRate)}
              </p>
            )}
          </div>
          <Button size="sm" onClick={onSend} disabled={loading} className="shrink-0 shadow-sm">
            Envoyer
          </Button>
        </div>
      </div>
    </div>
  );
}
