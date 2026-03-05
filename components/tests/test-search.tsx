"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, PlusCircle, CheckCircle2, X, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import { useDebounce } from "@/hooks/use-debounce";
import { formatCurrency } from "@/lib/utils";
import { parseTubeColor } from "@/lib/tube-colors";
import { getProfileMeta } from "@/lib/data/profile-metadata";

import MatchIndicator from "./match-indicator";

interface SearchResult {
  id: string;
  name: string;
  code: string | null;
  category: string | null;
  price: number;
  unit: string | null;
  turnaroundTime: string | null;
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

function normalizeSearchText(value: string | null | undefined) {
  return (value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function isProfileResult(test: SearchResult): boolean {
  const category = (test.category ?? "").toLowerCase();
  if (category.includes("profil") || category.includes("profile")) return true;
  if (/\bprofil\b/i.test(test.name) || /\bprofile\b/i.test(test.name)) return true;
  if (test.code && getProfileMeta(test.code)) return true;
  return false;
}

export default function TestSearch({
  onAddToCart,
  onRemoveFromCart,
  cartItemIds,
}: {
  onAddToCart?: (test: SearchResult) => void;
  onRemoveFromCart?: (testMappingId: string) => void;
  cartItemIds?: Set<string>;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (debouncedQuery.length < 2) { setResults([]); return; }
    setIsLoading(true);
    fetch(`/api/tests?q=${encodeURIComponent(debouncedQuery)}&limit=50`)
      .then(r => r.json())
      .then(d => { if (d.success) setResults(d.data); })
      .finally(() => setIsLoading(false));
  }, [debouncedQuery]);

  const rankedResults = useMemo(() => {
    const normalizedQuery = normalizeSearchText(debouncedQuery);
    if (!normalizedQuery) return results;

    const scored = results
      .map((item) => {
        const normalizedName = normalizeSearchText(item.name);
        const normalizedCanonical = normalizeSearchText(item.canonicalName);
        const normalizedCode = normalizeSearchText(item.code);

        const exact =
          normalizedName === normalizedQuery ||
          normalizedCanonical === normalizedQuery ||
          normalizedCode === normalizedQuery;

        const prefix =
          normalizedName.startsWith(normalizedQuery) ||
          normalizedCanonical.startsWith(normalizedQuery) ||
          normalizedCode.startsWith(normalizedQuery);

        const baseScore = typeof item.similarity === "number" ? item.similarity : 0;
        const score = exact ? 3 : prefix ? 2 : baseScore > 0.6 ? 1 : 0;

        return { item, score, exact };
      })
      .sort((a, b) => b.score - a.score || (b.item.similarity ?? 0) - (a.item.similarity ?? 0));

    const exactMatches = scored.filter((entry) => entry.exact).map((entry) => entry.item);
    if (exactMatches.length > 0) return exactMatches;

    return scored.map((entry) => entry.item);
  }, [results, debouncedQuery]);

  const limited = rankedResults.slice(0, 20);

  // Group ALL results by testMappingId so equivalent tests across labs merge
  const grouped = useMemo(() => {
    const groupMap = new Map<string, SearchResult[]>();

    for (const test of limited) {
      const groupKey = test.testMappingId || `unmapped-${test.id}`;
      const existing = groupMap.get(groupKey);
      if (existing) existing.push(test);
      else groupMap.set(groupKey, [test]);
    }

    const groups: {
      key: string;
      testMappingId: string | null;
      canonicalName: string | null;
      tests: SearchResult[];
    }[] = [];

    for (const [groupKey, tests] of groupMap) {
      const mapped = tests.find((t) => t.testMappingId);
      groups.push({
        key: groupKey,
        testMappingId: mapped?.testMappingId ?? null,
        canonicalName: mapped?.canonicalName ?? null,
        tests,
      });
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
            <p className="text-sm font-medium text-muted-foreground">
              {rankedResults.length > 20
                ? `Top suggestions sur ${rankedResults.length} resultats`
                : `${grouped.length} suggestion${grouped.length > 1 ? "s" : ""}`}
            </p>
          </div>
          <ul className="divide-y divide-border/30">
            {grouped.map((group) => {
              const uniqueLabs = [...new Map(group.tests.map(t => [t.laboratoryId, t.laboratoryName])).entries()]
                .map(([id, name]) => ({ id, name }));
              const uniqueLabNames = uniqueLabs.map(l => l.name);
              const isMultiLab = group.testMappingId != null && uniqueLabs.length > 1;
              const primary = group.tests[0];
              const displayName = isMultiLab ? (group.canonicalName || primary.name) : primary.name;
              const isProfile = isProfileResult(primary);
              const selectedMappingId = group.tests.find((t) => t.testMappingId && cartItemIds?.has(t.testMappingId))?.testMappingId
                ?? group.testMappingId;
              const inCart = !!group.testMappingId && !!cartItemIds?.has(group.testMappingId);
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
                            <span className="inline-flex h-4 w-4 items-center justify-center shrink-0">
                              <span
                                className="inline-block h-2.5 w-2.5 rounded-full ring-1 ring-black/15"
                                style={{ backgroundColor: tube.color }}
                              />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top">{tube.label}</TooltipContent>
                        </Tooltip>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-base font-semibold leading-snug text-foreground whitespace-normal break-words">
                          {displayName}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <Badge
                            variant={isProfile ? "info" : "secondary"}
                            className="text-xs"
                          >
                            {isProfile ? "Profil" : "Individuel"}
                          </Badge>
                          {primary.category && !/^(profil|profile|individuel|individual)$/i.test(primary.category) && (
                            <Badge variant="secondary" className="text-xs">{primary.category}</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                      {isMultiLab ? (
                        <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                          {uniqueLabs.map((lab) => (
                            <span key={lab.id}>
                              {lab.name}
                            </span>
                          ))}
                        </span>
                      ) : (
                        <>
                          <span className="text-sm text-muted-foreground">
                            {primary.laboratoryName}
                          </span>
                          {primary.canonicalName && (
                            <span className="text-sm text-emerald-600 whitespace-normal break-words">
                              → {primary.canonicalName}
                            </span>
                          )}
                        </>
                      )}
                      {primary.turnaroundTime && (
                        <span className="inline-flex items-center gap-1 text-sm text-muted-foreground/85">
                          <Clock className="h-3.5 w-3.5 shrink-0" />
                          {primary.turnaroundTime}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 pt-0.5">
                    {!isMultiLab && primary.matchType && (
                      <MatchIndicator type={primary.matchType} confidence={primary.confidence} compact />
                    )}
                    {isMultiLab ? (
                      <Badge variant="outline" className="text-xs">
                        {uniqueLabNames.length} labs
                      </Badge>
                    ) : (
                      <span className="text-base font-bold tabular-nums whitespace-nowrap min-w-[64px] sm:min-w-[72px] text-right">
                        {formatCurrency(primary.price)}
                      </span>
                    )}
                    {onAddToCart && (
                      inCart ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => selectedMappingId && onRemoveFromCart?.(selectedMappingId)}
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
          <p className="text-xs text-muted-foreground/70 mt-1">Vérifiez l&apos;orthographe ou essayez un autre terme.</p>
        </div>
      )}
    </div>
    </TooltipProvider>
  );
}
