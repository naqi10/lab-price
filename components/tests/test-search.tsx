"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, PlusCircle, CheckCircle2, X, Clock, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDebounce } from "@/hooks/use-debounce";
import { formatCurrency } from "@/lib/utils";
import { getProfileMeta } from "@/lib/data/profile-metadata";
import { TubeDot } from "@/components/ui/tube-dot";

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
  canonicalTubeType?: string | null;
  similarity?: number;
  matchType?: string;
  confidence?: number;
}

interface BundleSummary {
  id: string;
  dealName: string;
  customRate: number;
  canonicalNames: string[];
  testMappingIds: string[];
}

function resolveGroupTubeType(groupTests: SearchResult[]): string | null {
  if (groupTests.length === 0) return null;
  const canonical = groupTests.find((t) => t.canonicalTubeType)?.canonicalTubeType;
  if (canonical) return canonical;

  const counts = new Map<string, number>();
  for (const t of groupTests) {
    const key = t.tubeType?.trim();
    if (!key) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  if (counts.size === 0) return null;
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
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
  availableBundles,
  selectedBundleIds,
  onAddBundle,
}: {
  onAddToCart?: (test: SearchResult) => void;
  onRemoveFromCart?: (testMappingId: string) => void;
  cartItemIds?: Set<string>;
  availableBundles?: BundleSummary[];
  selectedBundleIds?: Set<string>;
  onAddBundle?: (b: BundleSummary) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchPage, setSearchPage] = useState(1);
  const [openBundleKey, setOpenBundleKey] = useState<string | null>(null);
  const debouncedQuery = useDebounce(query, 300);

  // Pre-index bundles by testMappingId for O(1) lookup
  const relatedBundleMap = useMemo(() => {
    const map = new Map<string, BundleSummary[]>();
    if (!availableBundles) return map;
    for (const bundle of availableBundles) {
      if (bundle.testMappingIds.length === 0) continue;
      // Guard against malformed/duplicated mapping IDs from upstream payloads.
      const uniqueMappingIds = new Set(bundle.testMappingIds.filter(Boolean));
      for (const tmId of uniqueMappingIds) {
        const existing = map.get(tmId);
        if (existing) {
          if (!existing.some((b) => b.id === bundle.id)) existing.push(bundle);
        }
        else map.set(tmId, [bundle]);
      }
    }
    return map;
  }, [availableBundles]);

  // Reset to page 1 whenever query changes
  useEffect(() => { setSearchPage(1); }, [debouncedQuery]);

  useEffect(() => {
    if (debouncedQuery.length < 2) { setResults([]); return; }
    setIsLoading(true);
    fetch(`/api/tests?q=${encodeURIComponent(debouncedQuery)}&limit=100`)
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

  const GROUPS_PER_PAGE = 10;

  // Group ALL ranked results by testMappingId so equivalent tests across labs merge
  const allGrouped = useMemo(() => {
    const groupMap = new Map<string, SearchResult[]>();

    for (const test of rankedResults) {
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
  }, [rankedResults]);

  const totalGroupPages = Math.ceil(allGrouped.length / GROUPS_PER_PAGE);
  const grouped = allGrouped.slice(
    (searchPage - 1) * GROUPS_PER_PAGE,
    searchPage * GROUPS_PER_PAGE,
  );

  useEffect(() => {
    // Close stale expanded bundle panel when the currently visible groups change.
    if (!openBundleKey) return;
    const stillExists = allGrouped.some((g) => g.key === openBundleKey);
    if (!stillExists) setOpenBundleKey(null);
  }, [allGrouped, openBundleKey]);

  return (
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

      {!isLoading && allGrouped.length > 0 && (
        <div className="w-full rounded-lg border border-border/60 bg-card overflow-hidden">
          <div className="px-4 py-2.5 border-b border-border/40 bg-muted/30 flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">
              {allGrouped.length} résultat{allGrouped.length > 1 ? "s" : ""}
              {totalGroupPages > 1 && (
                <span className="ml-1 text-xs font-normal">
                  — page {searchPage}/{totalGroupPages}
                </span>
              )}
            </p>
          </div>
          <ul className="divide-y divide-border/30 overflow-y-auto max-h-[480px]">
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
              const displayTubeType = resolveGroupTubeType(group.tests);

              // Bundle suggestions for individual tests
              const relatedBundles = (!isProfile && group.testMappingId)
                ? (relatedBundleMap.get(group.testMappingId) ?? [])
                : [];
              const hasBundles = relatedBundles.length > 0;
              const bundlesOpen = openBundleKey === group.key;
              const cheapestPrice = Math.min(...group.tests.map(t => t.price));

              return (
                <li
                  key={group.key}
                  className="flex flex-col px-3 sm:px-4 py-3.5 hover:bg-accent/50 transition-colors"
                  style={inCart ? { backgroundColor: "rgba(var(--primary-rgb,59,130,246),0.06)" } : undefined}
                >
                  {/* Main row */}
                  <div className="flex items-start justify-between gap-3 sm:gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start gap-2">
                        <TubeDot tubeType={displayTubeType} withTooltip />
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
                      {/* Bundle toggle */}
                      {hasBundles && (
                        <button
                          onClick={() =>
                            setOpenBundleKey((prev) =>
                              prev === group.key ? null : group.key,
                            )
                          }
                          className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline text-left whitespace-normal break-words"
                        >
                          <ChevronDown
                            className={`h-3 w-3 transition-transform ${
                              bundlesOpen ? "rotate-180" : ""
                            }`}
                          />
                          <span className="sm:hidden">
                            {relatedBundles.length} offre{relatedBundles.length > 1 ? "s" : ""} incluse{relatedBundles.length > 1 ? "s" : ""}
                          </span>
                          <span className="hidden sm:inline">
                            {relatedBundles.length} offre{relatedBundles.length > 1 ? "s" : ""} incluant ce test
                          </span>
                        </button>
                      )}
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
                  </div>

                  {/* Bundle suggestions panel (kept mounted for React DOM stability) */}
                  {hasBundles && (
                    <div
                      className={`mt-2 space-y-1.5 pl-2 sm:pl-6 ${
                        bundlesOpen ? "block" : "hidden"
                      }`}
                    >
                      {relatedBundles.map((bundle) => {
                        const delta = bundle.customRate - cheapestPrice;
                        const inSelection = !!selectedBundleIds?.has(bundle.id);
                        return (
                          <div
                            key={bundle.id}
                            className="flex flex-col gap-2 rounded-md border border-border/50 bg-muted/40 px-3 py-2 sm:flex-row sm:items-start sm:justify-between"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium leading-snug break-words">{bundle.dealName}</p>
                              {bundle.canonicalNames.length > 0 && (
                                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                  {bundle.canonicalNames.join(", ")}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center justify-between gap-2 sm:justify-end sm:shrink-0">
                              <div className="text-left sm:text-right">
                                <p className="text-sm font-bold tabular-nums">{formatCurrency(bundle.customRate)}</p>
                                {delta > 0 ? (
                                  <p className="text-xs text-muted-foreground">+{formatCurrency(delta)}</p>
                                ) : (
                                  <p className="text-xs text-emerald-600">Même prix ou moins!</p>
                                )}
                              </div>
                              {onAddBundle && (
                                <Button
                                  variant={inSelection ? "default" : "ghost"}
                                  size="sm"
                                  onClick={() => onAddBundle(bundle)}
                                  className="h-7 w-7 p-0"
                                  aria-label={inSelection ? "Retirer l'offre" : "Ajouter l'offre"}
                                >
                                  {inSelection
                                    ? <CheckCircle2 className="h-4 w-4" />
                                    : <PlusCircle className="h-4 w-4" />}
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          {/* Pagination controls */}
          {totalGroupPages > 1 && (
            <div className="flex items-center justify-between border-t border-border/40 px-3 py-2 bg-muted/20">
              <p className="text-xs text-muted-foreground">
                {(searchPage - 1) * GROUPS_PER_PAGE + 1}–
                {Math.min(searchPage * GROUPS_PER_PAGE, allGrouped.length)} sur{" "}
                {allGrouped.length}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => setSearchPage((p) => Math.max(1, p - 1))}
                  disabled={searchPage <= 1}
                  aria-label="Page précédente"
                >
                  <ChevronLeft className="h-3 w-3" />
                </Button>
                {Array.from({ length: Math.min(totalGroupPages, 5) }, (_, i) => {
                  let pageNum: number;
                  if (totalGroupPages <= 5) pageNum = i + 1;
                  else if (searchPage <= 3) pageNum = i + 1;
                  else if (searchPage >= totalGroupPages - 2) pageNum = totalGroupPages - 4 + i;
                  else pageNum = searchPage - 2 + i;
                  return (
                    <Button
                      key={pageNum}
                      variant={pageNum === searchPage ? "default" : "ghost"}
                      size="sm"
                      className="h-6 w-6 p-0 text-xs"
                      onClick={() => setSearchPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => setSearchPage((p) => Math.min(totalGroupPages, p + 1))}
                  disabled={searchPage >= totalGroupPages}
                  aria-label="Page suivante"
                >
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {!isLoading && query.length >= 2 && allGrouped.length === 0 && (
        <div className="rounded-lg border border-dashed border-border/40 p-6 text-center">
          <p className="text-sm text-muted-foreground">Aucun test trouvé pour &quot;{query}&quot;</p>
          <p className="text-xs text-muted-foreground/70 mt-1">Vérifiez l&apos;orthographe ou essayez un autre terme.</p>
        </div>
      )}
    </div>
  );
}
