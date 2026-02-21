"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, Loader2, FlaskConical, Sparkles } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import {
  type Bundle,
  CATEGORY_COLORS,
  DEFAULT_CATEGORY_COLOR,
} from "@/lib/data/bundles";
import { cn } from "@/lib/utils";

interface BundleDealCardProps {
  bundle: Bundle;
  originalTotal: number | null;
  loading: boolean;
  onSend: () => void;
  bestValue?: boolean;
}

export default function BundleDealCard({
  bundle,
  originalTotal,
  loading,
  onSend,
  bestValue,
}: BundleDealCardProps) {
  const savings =
    originalTotal !== null ? originalTotal - bundle.customRate : null;
  const savingsPercent =
    savings !== null && originalTotal
      ? Math.round((savings / originalTotal) * 100)
      : null;

  const colors = CATEGORY_COLORS[bundle.category] ?? DEFAULT_CATEGORY_COLOR;

  return (
    <div
      className={cn(
        "group relative rounded-xl border bg-card overflow-hidden transition-all duration-300",
        "hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5",
        bestValue
          ? "border-amber-500/40 ring-1 ring-amber-500/20"
          : "border-border/50 hover:border-border"
      )}
    >
      {/* Gradient accent strip */}
      <div className={cn("h-1", colors.accent)} />

      {/* Best value ribbon */}
      {bestValue && (
        <div className="absolute top-3 right-3 z-10">
          <Badge className="bg-amber-500/15 text-amber-500 border-amber-500/25 text-[10px] font-semibold gap-1">
            <Sparkles className="h-3 w-3" />
            Meilleure offre
          </Badge>
        </div>
      )}

      {/* Category gradient overlay */}
      <div className={cn("absolute inset-0 bg-gradient-to-b pointer-events-none", colors.gradient)} />

      <div className="relative p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start gap-3">
          <span className="text-2xl shrink-0 mt-0.5" role="img">
            {bundle.icon}
          </span>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold leading-tight">
              {bundle.dealName}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
              {bundle.description}
            </p>
          </div>
        </div>

        {/* Tests list as pills */}
        <div className="flex flex-wrap gap-1.5">
          {bundle.canonicalNames.map((name) => (
            <span
              key={name}
              className="inline-flex items-center rounded-md bg-muted/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
            >
              {name}
            </span>
          ))}
        </div>

        {/* Test count + category */}
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] gap-1 font-normal">
            <FlaskConical className="h-2.5 w-2.5" />
            {bundle.canonicalNames.length} tests
          </Badge>
          <Badge variant="outline" className={cn("text-[10px] border", colors.badge)}>
            {bundle.category}
          </Badge>
        </div>

        {/* Price section */}
        <div className="flex items-end justify-between gap-2 pt-2 border-t border-border/30">
          <div className="space-y-1">
            {loading ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Calcul des prix...</span>
              </div>
            ) : originalTotal !== null ? (
              <>
                <p className="text-xs text-muted-foreground line-through">
                  {formatCurrency(originalTotal)}
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-xl font-bold text-primary">
                    {formatCurrency(bundle.customRate)}
                  </p>
                  {savingsPercent !== null && savingsPercent > 0 && (
                    <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-xs font-semibold">
                      -{savingsPercent}%
                    </Badge>
                  )}
                </div>
              </>
            ) : (
              <p className="text-xl font-bold text-primary">
                {formatCurrency(bundle.customRate)}
              </p>
            )}
          </div>

          <Button
            size="sm"
            onClick={onSend}
            disabled={loading}
            className="shrink-0 gap-1.5 shadow-sm"
          >
            <Mail className="h-3.5 w-3.5" />
            Envoyer
          </Button>
        </div>
      </div>
    </div>
  );
}
