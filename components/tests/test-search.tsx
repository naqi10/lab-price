"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, PlusCircle, CheckCircle2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import { useDebounce } from "@/hooks/use-debounce";
import { parseTubeColor } from "@/lib/tube-colors";
import MatchIndicator from "./match-indicator";

interface SearchResult {
  id: string;
  name: string;
  code: string | null;
  category: string | null;
  price: number;
  unit: string | null;
  tubeType: string | null;
  laboratoryId: string;
  laboratoryName: string;
  laboratoryCode: string;
  testMappingId: string | null;
  canonicalName: string | null;
  similarity?: number;
  matchType?: string;
  confidence?: number;
}

function normalizeTestName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export default function TestSearch({
  onAddToCart,
  onRemoveFromCart,
  cartItemIds,
  cartItemNameKeys,
}: {
  onAddToCart?: (test: SearchResult) => void;
  onRemoveFromCart?: (testMappingId: string) => void;
  cartItemIds?: Set<string>;
  cartItemNameKeys?: Set<string>;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (debouncedQuery.length < 2) { setResults([]); return; }
    setIsLoading(true);
    fetch(`/api/tests?q=${encodeURIComponent(debouncedQuery)}`)
      .then(r => r.json())
      .then(d => { if (d.success) setResults(d.data); })
      .finally(() => setIsLoading(false));
  }, [debouncedQuery]);

  const limited = results.slice(0, 12);

  // Group results by testMappingId for cleaner display
  const grouped = useMemo(() => {
    const groups: { key: string; testMappingId: string | null; canonicalName: string | null; tests: SearchResult[] }[] = [];
    const mappingGroups = new Map<string, SearchResult[]>();
    const ungrouped: SearchResult[] = [];

    for (const test of limited) {
      if (test.testMappingId) {
        const existing = mappingGroups.get(test.testMappingId);
        if (existing) existing.push(test);
        else mappingGroups.set(test.testMappingId, [test]);
      } else {
        ungrouped.push(test);
      }
    }

    for (const [tmId, tests] of mappingGroups) {
      groups.push({ key: tmId, testMappingId: tmId, canonicalName: tests[0].canonicalName, tests });
    }
    for (const test of ungrouped) {
      groups.push({ key: test.id, testMappingId: null, canonicalName: null, tests: [test] });
    }

    return groups;
  }, [limited]);

  return (
    <TooltipProvider>
    <div className="w-full space-y-3">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un test par nom..."
          className="pl-9 h-10"
        />
        {query && (
          <button
            onClick={() => { setQuery(""); setResults([]); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Suggestions panel — full-width, inline below search */}
      {isLoading && (
        <div className="rounded-lg border border-border/60 bg-card p-4">
          <p className="text-sm text-muted-foreground">Recherche en cours...</p>
        </div>
      )}

      {!isLoading && grouped.length > 0 && (
        <div className="w-full rounded-lg border border-border/60 bg-card overflow-hidden">
          <div className="px-4 py-2.5 border-b border-border/40 bg-muted/30">
            <p className="text-xs font-medium text-muted-foreground">
              {results.length > 12
                ? `Top suggestions sur ${results.length} résultats`
                : `${grouped.length} suggestion${grouped.length > 1 ? "s" : ""}`}
            </p>
          </div>
          <ul className="divide-y divide-border/30">
            {grouped.map((group) => {
              const isMultiLab = group.testMappingId != null && group.tests.length > 1;
              const primary = group.tests[0];
              const displayName = isMultiLab ? (group.canonicalName || primary.name) : primary.name;
              const nameKey = normalizeTestName(group.canonicalName || primary.canonicalName || primary.name);
              const inCart =
                (!!group.testMappingId && !!cartItemIds?.has(group.testMappingId)) ||
                !!cartItemNameKeys?.has(nameKey);
              const tube = parseTubeColor(primary.tubeType);

              return (
                <li
                  key={group.key}
                  className="flex items-start justify-between gap-3 sm:gap-4 px-3 sm:px-4 py-3.5 hover:bg-accent/50 transition-colors"
                  style={inCart ? { backgroundColor: "rgba(var(--primary-rgb,59,130,246),0.06)" } : undefined}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-2">
                      {tube && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span
                              className="inline-block h-2.5 w-2.5 rounded-full shrink-0 ring-1 ring-white/10"
                              style={{ backgroundColor: tube.color }}
                            />
                          </TooltipTrigger>
                          <TooltipContent side="top">{tube.label}</TooltipContent>
                        </Tooltip>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] sm:text-sm font-semibold leading-snug text-foreground/90 whitespace-normal break-words">
                          {displayName}
                        </p>
                        {primary.category && (
                          <Badge variant="secondary" className="mt-1 text-[10px]">{primary.category}</Badge>
                        )}
                      </div>
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                      {isMultiLab ? (
                        <span className="text-xs text-muted-foreground/80 whitespace-normal break-words">
                          {group.tests.map(t => t.laboratoryName).join(", ")}
                        </span>
                      ) : (
                        <>
                          <span className="text-xs text-muted-foreground">{primary.laboratoryName}</span>
                          {primary.canonicalName && (
                            <span className="text-[10px] text-emerald-400 whitespace-normal break-words">
                              → {primary.canonicalName}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 pt-0.5">
                    {!isMultiLab && primary.matchType && (
                      <MatchIndicator type={primary.matchType} confidence={primary.confidence} compact />
                    )}
                    {isMultiLab ? (
                      <Badge variant="outline" className="text-[10px]">
                        {group.tests.length} labs
                      </Badge>
                    ) : (
                      <span className="text-xs sm:text-sm font-semibold tabular-nums whitespace-nowrap min-w-[64px] sm:min-w-[72px] text-right">
                        {primary.price} <span className="text-xs text-muted-foreground font-normal">{primary.unit || "MAD"}</span>
                      </span>
                    )}
                    {onAddToCart && (
                      inCart ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => group.testMappingId && onRemoveFromCart?.(group.testMappingId)}
                          className="h-7 w-7 p-0 text-emerald-400 hover:text-destructive hover:bg-destructive/10"
                          aria-label="Retirer de la sélection"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onAddToCart(primary)}
                          disabled={!group.testMappingId}
                          className="h-7 w-7 p-0 disabled:opacity-30"
                          aria-label="Ajouter à la comparaison"
                        >
                          <PlusCircle className="h-4 w-4" />
                        </Button>
                      )
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {!isLoading && query.length >= 2 && limited.length === 0 && (
        <div className="rounded-lg border border-dashed border-border/40 p-6 text-center">
          <p className="text-sm text-muted-foreground">Aucun test trouvé pour &quot;{query}&quot;</p>
        </div>
      )}
    </div>
    </TooltipProvider>
  );
}
