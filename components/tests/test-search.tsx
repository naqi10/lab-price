"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  Search, PlusCircle, CheckCircle2, X, Clock,
  ChevronLeft, ChevronRight, ChevronDown, Layers,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDebounce } from "@/hooks/use-debounce";
import { formatCurrency } from "@/lib/utils";
import { getProfileMeta } from "@/lib/data/profile-metadata";
import { TubeDot } from "@/components/ui/tube-dot";
import MatchIndicator from "./match-indicator";

// ── Types ─────────────────────────────────────────────────────────────────────

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

// ── Utilities ──────────────────────────────────────────────────────────────────

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

// ── ProfileComparePanel ────────────────────────────────────────────────────────

function ProfileComparePanel({
  labPrices,
  relatedBundles,
  allBundles,
  selectedBundleIds,
  onAddBundle,
}: {
  labPrices: { code: string; name: string; price: number }[];
  relatedBundles: BundleSummary[];
  allBundles: BundleSummary[];
  selectedBundleIds?: Set<string>;
  onAddBundle?: (b: BundleSummary) => void;
}) {
  const [manualSearch, setManualSearch] = useState("");
  const [showManual, setShowManual] = useState(relatedBundles.length === 0);
  const inputRef = useRef<HTMLInputElement>(null);

  const cheapestIndividual = Math.min(...labPrices.map((l) => l.price));
  const normalizedManual = normalizeSearchText(manualSearch);

  const relatedIds = new Set(relatedBundles.map((b) => b.id));
  const otherBundles = useMemo(
    () => allBundles.filter((b) => !relatedIds.has(b.id)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allBundles, relatedBundles],
  );

  const filteredOther = useMemo(() => {
    if (!normalizedManual) return otherBundles.slice(0, 10);
    return otherBundles
      .filter(
        (b) =>
          normalizeSearchText(b.dealName).includes(normalizedManual) ||
          b.canonicalNames.some((n) => normalizeSearchText(n).includes(normalizedManual)),
      )
      .slice(0, 10);
  }, [otherBundles, normalizedManual]);

  function BundleCard({ bundle }: { bundle: BundleSummary }) {
    const inSelection = !!selectedBundleIds?.has(bundle.id);
    const delta = bundle.customRate - cheapestIndividual;
    const extraTestCount = Math.max(0, bundle.testMappingIds.length - 1);
    const perExtraTest = extraTestCount > 0 ? Math.abs(delta) / extraTestCount : 0;
    const cheaper = delta <= 0;

    return (
      <div
        className={`rounded-lg border p-3 transition-colors ${
          inSelection ? "border-primary/40 bg-primary/5" : "border-border/50 bg-background"
        }`}
      >
        <div className="flex items-start gap-2.5">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold leading-snug break-words">{bundle.dealName}</p>

            {bundle.canonicalNames.length > 0 && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                {bundle.canonicalNames.join(" · ")}
              </p>
            )}

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold tabular-nums">{formatCurrency(bundle.customRate)}</span>
              {cheaper ? (
                <span className="rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-semibold px-2 py-0.5 leading-5">
                  ✓ Même prix ou moins
                </span>
              ) : (
                <span className="rounded-full bg-amber-50 text-amber-700 text-[11px] px-2 py-0.5 leading-5">
                  +{formatCurrency(delta)}
                  {extraTestCount > 0 && (
                    <>
                      {" "}pour {extraTestCount} test{extraTestCount > 1 ? "s" : ""} en plus
                      {perExtraTest > 0 && (
                        <span className="text-amber-500"> ({formatCurrency(perExtraTest)}/test)</span>
                      )}
                    </>
                  )}
                </span>
              )}
            </div>
          </div>

          {onAddBundle && (
            <button
              onClick={() => onAddBundle(bundle)}
              title={inSelection ? "Retirer" : "Comparer"}
              className={`shrink-0 mt-0.5 h-9 w-9 rounded-lg flex items-center justify-center transition-colors ${
                inSelection
                  ? "bg-primary text-primary-foreground"
                  : "border border-border/60 bg-background hover:border-primary/50 hover:text-primary"
              }`}
            >
              {inSelection
                ? <CheckCircle2 className="h-4 w-4" />
                : <PlusCircle className="h-4 w-4" />}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-xl border border-primary/20 bg-primary/[0.03] p-3 space-y-3">
      {/* Header: baseline prices */}
      <div>
        <div className="flex items-center gap-1.5 mb-1.5">
          <Layers className="h-3.5 w-3.5 text-primary shrink-0" />
          <p className="text-xs font-semibold text-primary uppercase tracking-wide">
            Comparer avec un profil
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pl-5">
          <span className="text-xs text-muted-foreground">Test seul :</span>
          {labPrices.map((lab) => (
            <span key={lab.code} className="inline-flex items-center gap-1 text-xs">
              <span className="text-muted-foreground/70">{lab.code}</span>
              <span className={`font-bold tabular-nums ${
                lab.price === cheapestIndividual && labPrices.length > 1
                  ? "text-emerald-600"
                  : "text-foreground"
              }`}>
                {formatCurrency(lab.price)}
              </span>
            </span>
          ))}
        </div>
      </div>

      <div className="border-t border-primary/10" />

      {/* Auto-detected profiles */}
      {relatedBundles.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            Profils incluant ce test
          </p>
          <div className="space-y-2">
            {relatedBundles.map((b) => <BundleCard key={b.id} bundle={b} />)}
          </div>
        </div>
      )}

      {/* Manual selection */}
      {otherBundles.length > 0 && (
        <div className="space-y-2">
          <button
            onClick={() => {
              setShowManual((v) => {
                const next = !v;
                if (next) setTimeout(() => inputRef.current?.focus(), 60);
                return next;
              });
            }}
            className="flex items-center gap-1.5 text-xs text-primary/80 hover:text-primary transition-colors py-0.5"
          >
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showManual ? "rotate-180" : ""}`} />
            {relatedBundles.length > 0
              ? "Comparer avec un autre profil"
              : `Sélectionner un profil (${otherBundles.length} disponibles)`}
          </button>

          {showManual && (
            <div className="space-y-2">
              {otherBundles.length > 4 && (
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                  <input
                    ref={inputRef}
                    value={manualSearch}
                    onChange={(e) => setManualSearch(e.target.value)}
                    placeholder="Filtrer les profils…"
                    className="w-full h-9 rounded-lg border border-border/50 bg-background pl-8 pr-3 text-sm outline-none focus:ring-1 focus:ring-primary/40"
                  />
                </div>
              )}
              {filteredOther.length === 0 ? (
                <p className="text-xs text-muted-foreground px-1">Aucun profil correspondant.</p>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {filteredOther.map((b) => <BundleCard key={b.id} bundle={b} />)}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────

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
  const [openProfileKey, setOpenProfileKey] = useState<string | null>(null);
  const debouncedQuery = useDebounce(query, 300);

  const relatedBundleMap = useMemo(() => {
    const map = new Map<string, BundleSummary[]>();
    if (!availableBundles) return map;
    for (const bundle of availableBundles) {
      if (bundle.testMappingIds.length === 0) continue;
      const uniqueIds = new Set(bundle.testMappingIds.filter(Boolean));
      for (const tmId of uniqueIds) {
        const existing = map.get(tmId);
        if (existing) {
          if (!existing.some((b) => b.id === bundle.id)) existing.push(bundle);
        } else {
          map.set(tmId, [bundle]);
        }
      }
    }
    return map;
  }, [availableBundles]);

  useEffect(() => { setSearchPage(1); }, [debouncedQuery]);

  useEffect(() => {
    if (debouncedQuery.length < 2) { setResults([]); return; }
    setIsLoading(true);
    fetch(`/api/tests?q=${encodeURIComponent(debouncedQuery)}&limit=100`)
      .then((r) => r.json())
      .then((d) => { if (d.success) setResults(d.data); })
      .finally(() => setIsLoading(false));
  }, [debouncedQuery]);

  const rankedResults = useMemo(() => {
    const nq = normalizeSearchText(debouncedQuery);
    if (!nq) return results;
    const scored = results.map((item) => {
      const nn = normalizeSearchText(item.name);
      const nc = normalizeSearchText(item.canonicalName);
      const ncode = normalizeSearchText(item.code);
      const exact = nn === nq || nc === nq || ncode === nq;
      const prefix = nn.startsWith(nq) || nc.startsWith(nq) || ncode.startsWith(nq);
      const base = typeof item.similarity === "number" ? item.similarity : 0;
      const score = exact ? 3 : prefix ? 2 : base > 0.6 ? 1 : 0;
      return { item, score, exact };
    }).sort((a, b) => b.score - a.score || (b.item.similarity ?? 0) - (a.item.similarity ?? 0));
    const exact = scored.filter((e) => e.exact).map((e) => e.item);
    return exact.length > 0 ? exact : scored.map((e) => e.item);
  }, [results, debouncedQuery]);

  const GROUPS_PER_PAGE = 8;

  const allGrouped = useMemo(() => {
    const groupMap = new Map<string, SearchResult[]>();
    for (const test of rankedResults) {
      const key = test.testMappingId || `unmapped-${test.id}`;
      const existing = groupMap.get(key);
      if (existing) existing.push(test);
      else groupMap.set(key, [test]);
    }
    return [...groupMap.entries()].map(([key, tests]) => {
      const mapped = tests.find((t) => t.testMappingId);
      return { key, testMappingId: mapped?.testMappingId ?? null, canonicalName: mapped?.canonicalName ?? null, tests };
    });
  }, [rankedResults]);

  const totalGroupPages = Math.ceil(allGrouped.length / GROUPS_PER_PAGE);
  const grouped = allGrouped.slice((searchPage - 1) * GROUPS_PER_PAGE, searchPage * GROUPS_PER_PAGE);

  useEffect(() => {
    if (!openProfileKey) return;
    if (!allGrouped.some((g) => g.key === openProfileKey)) setOpenProfileKey(null);
  }, [allGrouped, openProfileKey]);

  return (
    <div className="w-full space-y-2">
      {/* ── Search input ──────────────────────────────────────────── */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un test…"
          className="pl-9 h-11 text-base"
        />
        {query && (
          <button
            onClick={() => { setQuery(""); setResults([]); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            title="Effacer"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* ── Loading ───────────────────────────────────────────────── */}
      {isLoading && (
        <div className="rounded-xl border border-border/50 bg-card px-4 py-3">
          <p className="text-sm text-muted-foreground">Recherche en cours…</p>
        </div>
      )}

      {/* ── Results panel ────────────────────────────────────────── */}
      {!isLoading && allGrouped.length > 0 && (
        <div className="rounded-xl border border-border/60 bg-card overflow-hidden shadow-sm">

          {/* Header bar */}
          <div className="px-3 py-2 border-b border-border/40 bg-muted/30 flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">
              {allGrouped.length} résultat{allGrouped.length > 1 ? "s" : ""}
            </p>
            {totalGroupPages > 1 && (
              <p className="text-xs text-muted-foreground">
                {searchPage} / {totalGroupPages}
              </p>
            )}
          </div>

          {/* Result list */}
          <ul className="divide-y divide-border/25 overflow-y-auto max-h-[55vh] sm:max-h-[480px]">
            {grouped.map((group) => {
              const labMap = new Map(group.tests.map((t) => [t.laboratoryId, t]));
              const uniqueLabs = [...new Map(
                group.tests.map((t) => [t.laboratoryId, { id: t.laboratoryId, name: t.laboratoryName, code: t.laboratoryCode }])
              ).values()];
              const isMultiLab = group.testMappingId != null && uniqueLabs.length > 1;
              const primary = group.tests[0];
              const displayName = isMultiLab ? (group.canonicalName || primary.name) : primary.name;
              const isProfile = isProfileResult(primary);
              const selectedMappingId =
                group.tests.find((t) => t.testMappingId && cartItemIds?.has(t.testMappingId))?.testMappingId
                ?? group.testMappingId;
              const inCart = !!group.testMappingId && !!cartItemIds?.has(group.testMappingId);
              const displayTubeType = resolveGroupTubeType(group.tests);

              const relatedBundles = !isProfile && group.testMappingId
                ? (relatedBundleMap.get(group.testMappingId) ?? [])
                : [];
              const canCompareWithProfile =
                !isProfile && !!group.testMappingId && (availableBundles?.length ?? 0) > 0;
              const profileOpen = openProfileKey === group.key;

              const labPrices = uniqueLabs.map((lab) => ({
                code: lab.code,
                name: lab.name,
                price: labMap.get(lab.id)!.price,
              }));
              const cheapestPrice = Math.min(...labPrices.map((l) => l.price));

              return (
                <li
                  key={group.key}
                  className="px-3 py-3 transition-colors hover:bg-accent/25 active:bg-accent/40"
                  style={inCart ? { backgroundColor: "rgba(var(--primary-rgb,59,130,246),0.05)" } : undefined}
                >
                  {/* ── Row: tube · name/badges · price · add ─── */}
                  <div className="flex items-start gap-2">

                    {/* Tube dot — top-aligned */}
                    <div className="pt-0.5 shrink-0">
                      <TubeDot tubeType={displayTubeType} withTooltip />
                    </div>

                    {/* Center: name + meta */}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold leading-snug text-foreground break-words pr-1">
                        {displayName}
                      </p>

                      {/* Badges row */}
                      <div className="flex flex-wrap items-center gap-1 mt-1">
                        <Badge
                          variant={isProfile ? "info" : "secondary"}
                          className="text-[10px] px-1.5 py-0 leading-4 h-4"
                        >
                          {isProfile ? "Profil" : "Individuel"}
                        </Badge>
                        {primary.category &&
                          !/^(profil|profile|individuel|individual)$/i.test(primary.category) && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 leading-4 h-4">
                              {primary.category}
                            </Badge>
                          )}
                        {!isMultiLab && primary.matchType && (
                          <MatchIndicator type={primary.matchType} confidence={primary.confidence} compact />
                        )}
                      </div>

                      {/* Lab info line */}
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5">
                        {isMultiLab ? (
                          labPrices.map((lab) => (
                            <span key={lab.code} className="inline-flex items-center gap-1 text-xs">
                              <span className="text-muted-foreground">{lab.code}</span>
                              <span className={`font-bold tabular-nums ${
                                lab.price === cheapestPrice && labPrices.length > 1
                                  ? "text-emerald-600"
                                  : "text-foreground/80"
                              }`}>
                                {formatCurrency(lab.price)}
                              </span>
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {primary.laboratoryCode}
                          </span>
                        )}
                        {primary.turnaroundTime && (
                          <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground/70">
                            <Clock className="h-3 w-3 shrink-0" />
                            {primary.turnaroundTime}
                          </span>
                        )}
                      </div>

                      {/* "Vs profil" toggle — full tap width, easy to press */}
                      {canCompareWithProfile && (
                        <button
                          onClick={() =>
                            setOpenProfileKey((prev) =>
                              prev === group.key ? null : group.key,
                            )
                          }
                          className={`mt-2 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                            profileOpen
                              ? "bg-primary/12 text-primary"
                              : "bg-muted/60 text-muted-foreground hover:bg-primary/8 hover:text-primary"
                          }`}
                        >
                          <Layers className="h-3.5 w-3.5 shrink-0" />
                          {profileOpen ? (
                            "Masquer comparaison"
                          ) : relatedBundles.length > 0 ? (
                            <>
                              Comparer avec un profil
                              <span className="ml-0.5 rounded-full bg-primary/15 text-primary px-1.5 text-[10px] font-bold leading-4">
                                {relatedBundles.length}
                              </span>
                            </>
                          ) : (
                            "Comparer avec un profil"
                          )}
                        </button>
                      )}
                    </div>

                    {/* Right: price + add/remove button */}
                    <div className="shrink-0 flex flex-col items-end gap-1.5 pt-0.5">
                      {!isMultiLab && (
                        <span className="text-sm font-bold tabular-nums text-foreground whitespace-nowrap">
                          {formatCurrency(primary.price)}
                        </span>
                      )}
                      {isMultiLab && (
                        <span className="text-xs font-semibold text-emerald-600 whitespace-nowrap">
                          {formatCurrency(cheapestPrice)}
                        </span>
                      )}

                      {onAddToCart && (
                        inCart ? (
                          <button
                            onClick={() => selectedMappingId && onRemoveFromCart?.(selectedMappingId)}
                            className="h-9 w-9 rounded-lg flex items-center justify-center bg-emerald-50 text-emerald-500 hover:bg-destructive/10 hover:text-destructive transition-colors"
                            aria-label="Retirer"
                            title="Retirer de la sélection"
                          >
                            <CheckCircle2 className="h-4.5 w-4.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => onAddToCart(primary)}
                            disabled={!group.testMappingId}
                            className="h-9 w-9 rounded-lg flex items-center justify-center border border-border/60 bg-background hover:border-primary/50 hover:text-primary disabled:opacity-30 disabled:pointer-events-none transition-colors"
                            aria-label="Ajouter"
                            title="Ajouter à la comparaison"
                          >
                            <PlusCircle className="h-4 w-4" />
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  {/* Profile compare panel — CSS hidden to preserve DOM stability */}
                  {canCompareWithProfile && (
                    <div className={profileOpen ? "block" : "hidden"}>
                      <ProfileComparePanel
                        labPrices={labPrices}
                        relatedBundles={relatedBundles}
                        allBundles={availableBundles ?? []}
                        selectedBundleIds={selectedBundleIds}
                        onAddBundle={onAddBundle}
                      />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          {/* ── Pagination ────────────────────────────────────────── */}
          {totalGroupPages > 1 && (
            <div className="flex items-center justify-between border-t border-border/40 px-3 py-2 bg-muted/20">
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 text-xs gap-1"
                onClick={() => setSearchPage((p) => Math.max(1, p - 1))}
                disabled={searchPage <= 1}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span className="hidden xs:inline">Préc.</span>
              </Button>

              {/* Page number pills — 3 max on mobile, 5 on larger */}
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(totalGroupPages, 5) }, (_, i) => {
                  let pn: number;
                  if (totalGroupPages <= 5) pn = i + 1;
                  else if (searchPage <= 3) pn = i + 1;
                  else if (searchPage >= totalGroupPages - 2) pn = totalGroupPages - 4 + i;
                  else pn = searchPage - 2 + i;
                  const active = pn === searchPage;
                  return (
                    <button
                      key={pn}
                      onClick={() => setSearchPage(pn)}
                      className={`h-7 w-7 rounded-md text-xs font-medium transition-colors ${
                        active
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {pn}
                    </button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 text-xs gap-1"
                onClick={() => setSearchPage((p) => Math.min(totalGroupPages, p + 1))}
                disabled={searchPage >= totalGroupPages}
              >
                <span className="hidden xs:inline">Suiv.</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ── Empty state ───────────────────────────────────────────── */}
      {!isLoading && query.length >= 2 && allGrouped.length === 0 && (
        <div className="rounded-xl border border-dashed border-border/40 px-4 py-8 text-center">
          <p className="text-sm text-muted-foreground">
            Aucun résultat pour &ldquo;{query}&rdquo;
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Vérifiez l&apos;orthographe ou essayez un autre terme.
          </p>
        </div>
      )}
    </div>
  );
}
