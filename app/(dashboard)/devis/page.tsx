"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import TestSearch from "@/components/tests/test-search";
import { useComparison } from "@/hooks/use-comparison";
import { useDashboardTitle } from "@/hooks/use-dashboard-title";
import { TubeDot } from "@/components/ui/tube-dot";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import {
  X,
  FlaskConical,
  Package,
  Layers,
  Receipt,
  RotateCcw,
  Pencil,
  Search,
  CheckCircle2,
  Send,
} from "lucide-react";
import EmailComparisonDialog from "@/components/comparison/email-comparison-dialog";

// ── Types ────────────────────────────────────────────────────────────────────

interface SearchResult {
  testMappingId: string | null;
  name: string;
  canonicalName: string | null;
  tubeType: string | null;
  laboratoryId: string;
  laboratoryName: string;
  laboratoryCode: string;
  price: number;
  code: string | null;
  category: string | null;
  unit: string | null;
  turnaroundTime: string | null;
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
  selfTestMappingId?: string | null;
  sourceLabCode?: string | null;
  profileCode?: string | null;
}

type QuoteItem =
  | { type: "test"; testMappingId: string; name: string; tubeType?: string | null }
  | {
      type: "bundle";
      bundleId: string;
      selfTestMappingId: string;
      name: string;
      rate: number;
      coveredTestIds: string[];
    };

// ── Page ─────────────────────────────────────────────────────────────────────

export default function DevisPage() {
  useDashboardTitle("Devis patient");

  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);
  const [availableBundles, setAvailableBundles] = useState<BundleSummary[]>([]);
  const [serviceFee, setServiceFee] = useState(30);
  const [editingFee, setEditingFee] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const { comparison, isLoading, compare, reset } = useComparison();

  // Load CDL bundles once
  useEffect(() => {
    fetch("/api/tests/deals/active")
      .then((r) => r.json())
      .then((d) => { if (d.success) setAvailableBundles(d.data ?? []); })
      .catch(() => {});
  }, []);

  const cdlBundles = useMemo(
    () => availableBundles.filter((b) => !b.sourceLabCode || b.sourceLabCode.toUpperCase() === "CDL"),
    [availableBundles]
  );

  // All testMappingIds to send to comparison API
  const allIds = useMemo(
    () => quoteItems.map((i) => (i.type === "test" ? i.testMappingId : i.selfTestMappingId)),
    [quoteItems]
  );

  const idsKey = allIds.join(",");

  useEffect(() => {
    if (allIds.length === 0) { reset(); return; }
    const t = setTimeout(() => compare(allIds), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  // TestSearch props
  const cartItemIds = useMemo(
    () => new Set(quoteItems.filter((i) => i.type === "test").map((i) => i.testMappingId)),
    [quoteItems]
  );
  const selectedBundleIds = useMemo(
    () => new Set(quoteItems.filter((i) => i.type === "bundle").map((i) => i.bundleId)),
    [quoteItems]
  );

  // Map: testMappingId → CDL bundles that include it
  const relatedBundleMap = useMemo(() => {
    const map = new Map<string, BundleSummary[]>();
    for (const b of cdlBundles) {
      for (const id of b.testMappingIds) {
        if (!id) continue;
        const arr = map.get(id) ?? [];
        if (!arr.some((x) => x.id === b.id)) arr.push(b);
        map.set(id, arr);
      }
    }
    return map;
  }, [cdlBundles]);

  // Profile suggestions: CDL bundles not yet selected that cover ≥1 individual test
  const profileSuggestions = useMemo(() => {
    const individualIds = new Set(
      quoteItems.filter((i) => i.type === "test").map((i) => i.testMappingId)
    );
    if (individualIds.size === 0) return [];

    const seen = new Set<string>();
    const result: Array<{ bundle: BundleSummary; matchedIds: string[] }> = [];
    for (const id of individualIds) {
      for (const bundle of relatedBundleMap.get(id) ?? []) {
        if (seen.has(bundle.id) || selectedBundleIds.has(bundle.id)) continue;
        seen.add(bundle.id);
        const matchedIds = bundle.testMappingIds.filter((x) => individualIds.has(x));
        if (matchedIds.length > 0) result.push({ bundle, matchedIds });
      }
    }
    return result.sort((a, b) => b.matchedIds.length - a.matchedIds.length);
  }, [quoteItems, relatedBundleMap, selectedBundleIds]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleAddTest = useCallback((test: SearchResult) => {
    if (!test.testMappingId) return;
    setQuoteItems((prev) => {
      if (prev.some((i) => i.type === "test" && i.testMappingId === test.testMappingId)) return prev;
      return [...prev, {
        type: "test",
        testMappingId: test.testMappingId!,
        name: test.canonicalName || test.name,
        tubeType: test.tubeType,
      }];
    });
  }, []);

  const handleRemove = useCallback((tmId: string) => {
    setQuoteItems((prev) =>
      prev.filter((i) => {
        if (i.type === "test") return i.testMappingId !== tmId;
        if (i.type === "bundle") return i.selfTestMappingId !== tmId;
        return true;
      })
    );
  }, []);

  const handleUseBundle = useCallback((bundle: BundleSummary) => {
    if (!bundle.selfTestMappingId) return;
    const covered = new Set(bundle.testMappingIds);
    setQuoteItems((prev) => {
      const filtered = prev.filter(
        (i) => !(i.type === "test" && covered.has(i.testMappingId))
      );
      if (filtered.some((i) => i.type === "bundle" && i.bundleId === bundle.id)) return filtered;
      return [...filtered, {
        type: "bundle",
        bundleId: bundle.id,
        selfTestMappingId: bundle.selfTestMappingId!,
        name: bundle.dealName,
        rate: bundle.customRate,
        coveredTestIds: bundle.testMappingIds,
      }];
    });
  }, []);

  // ── Derived price data ────────────────────────────────────────────────────

  const priceMatrix: Record<string, Record<string, number>> = comparison?.priceMatrix ?? {};
  const laboratories: { id: string; name: string }[] = comparison?.laboratories ?? [];

  const quoteRows = useMemo(
    () =>
      quoteItems.map((item) => {
        const tmId = item.type === "test" ? item.testMappingId : item.selfTestMappingId;
        const raw: Record<string, number> = priceMatrix[tmId] ?? {};
        let prices: Record<string, number>;
        if (item.type === "bundle") {
          prices = {};
          for (const [labId, p] of Object.entries(raw)) {
            if (p != null) prices[labId] = item.rate;
          }
        } else {
          prices = { ...raw };
        }
        return { item, tmId, prices };
      }),
    [quoteItems, priceMatrix]
  );

  const labTotals = useMemo(
    () =>
      laboratories.map((lab) => ({
        ...lab,
        total: quoteRows.reduce((sum, r) => sum + (r.prices[lab.id] ?? 0), 0),
      })),
    [quoteRows, laboratories]
  );

  const minSubtotal = labTotals
    .filter((l) => l.total > 0)
    .reduce((min, l) => Math.min(min, l.total), Infinity);

  const hasItems = quoteItems.length > 0;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="w-full mt-4 sm:mt-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Devis patient</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Ajoutez les tests requis — le devis se calcule automatiquement.
          </p>
        </div>
        {hasItems && (
          <button
            onClick={() => { setQuoteItems([]); reset(); }}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Réinitialiser
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-4 items-start">

        {/* ── Left: search ──────────────────────────────────────────── */}
        <div className="rounded-2xl border border-border/60 bg-card overflow-hidden lg:sticky lg:top-4">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
            <h2 className="text-base font-semibold">Ajouter des tests</h2>
            <Search className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="px-4 py-4">
            <TestSearch
              cartItemIds={cartItemIds}
              onAddToCart={handleAddTest}
              onRemoveFromCart={handleRemove}
              availableBundles={cdlBundles}
              selectedBundleIds={selectedBundleIds}
              onAddBundle={(b) => handleUseBundle(b as BundleSummary)}
            />
          </div>
        </div>

        {/* ── Right: quote ──────────────────────────────────────────── */}
        <div className="space-y-4">

          {/* Quote table */}
          <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
              <h2 className="text-base font-semibold">Détail du devis</h2>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </div>

            {!hasItems ? (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <FlaskConical className="h-10 w-10 text-muted-foreground/20 mb-3" />
                <p className="text-sm font-medium text-muted-foreground/60">Aucun test ajouté</p>
                <p className="text-xs text-muted-foreground/40 mt-1">
                  Recherchez des tests à gauche pour les ajouter au devis
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/40 bg-muted/20">
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">
                        Test / Profil
                      </th>
                      {laboratories.map((lab) => (
                        <th
                          key={lab.id}
                          className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground whitespace-nowrap"
                        >
                          {lab.name}
                        </th>
                      ))}
                      {laboratories.length === 0 && isLoading && (
                        <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">
                          Chargement…
                        </th>
                      )}
                      <th className="w-10" />
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-border/20">
                    {quoteRows.map(({ item, tmId, prices }) => (
                      <tr key={tmId} className="hover:bg-muted/10 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 min-w-0">
                            {item.type === "bundle" ? (
                              <Package className="h-3.5 w-3.5 text-primary/50 shrink-0" />
                            ) : (
                              <TubeDot tubeType={item.tubeType ?? null} withTooltip />
                            )}
                            <span className="font-medium text-foreground/90 truncate max-w-[220px]">
                              {item.name}
                            </span>
                            {item.type === "bundle" && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 shrink-0">
                                Profil CDL
                              </Badge>
                            )}
                          </div>
                        </td>
                        {laboratories.map((lab) => (
                          <td key={lab.id} className="px-4 py-3 text-right tabular-nums">
                            {prices[lab.id] != null ? (
                              <span className="font-semibold">{formatCurrency(prices[lab.id])}</span>
                            ) : (
                              <span className="text-muted-foreground/30">—</span>
                            )}
                          </td>
                        ))}
                        <td className="pr-3 py-3 text-right">
                          <button
                            onClick={() => handleRemove(tmId)}
                            className="h-6 w-6 inline-flex items-center justify-center rounded-md text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>

                  {comparison && (
                    <tfoot>
                      {/* Subtotal row */}
                      <tr className="border-t border-border/40 bg-muted/20">
                        <td className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Sous-total
                        </td>
                        {labTotals.map((lab) => (
                          <td key={lab.id} className="px-4 py-2.5 text-right tabular-nums font-bold">
                            {lab.total > 0 ? formatCurrency(lab.total) : "—"}
                          </td>
                        ))}
                        <td />
                      </tr>

                      {/* Service fee row */}
                      <tr>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Frais de service</span>
                            {editingFee ? (
                              <input
                                type="number"
                                min={0}
                                step={1}
                                value={serviceFee}
                                onChange={(e) => setServiceFee(Number(e.target.value))}
                                onBlur={() => setEditingFee(false)}
                                onKeyDown={(e) => e.key === "Enter" && setEditingFee(false)}
                                autoFocus
                                className="w-20 text-sm border border-primary rounded px-2 py-0.5 tabular-nums text-right bg-background"
                              />
                            ) : (
                              <button
                                onClick={() => setEditingFee(true)}
                                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                                title="Cliquer pour modifier"
                              >
                                {formatCurrency(serviceFee)}
                                <Pencil className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </td>
                        {labTotals.map((lab) => (
                          <td key={lab.id} className="px-4 py-2.5 text-right tabular-nums text-sm text-muted-foreground">
                            {lab.total > 0 ? formatCurrency(serviceFee) : "—"}
                          </td>
                        ))}
                        <td />
                      </tr>

                      {/* Grand total row */}
                      <tr className="border-t-2 border-primary/20 bg-primary/[0.02]">
                        <td className="px-4 py-3 font-bold text-sm uppercase tracking-wide">Total</td>
                        {labTotals.map((lab) => {
                          const grand = lab.total > 0 ? lab.total + serviceFee : 0;
                          const isBest =
                            grand > 0 &&
                            minSubtotal !== Infinity &&
                            lab.total === minSubtotal;
                          return (
                            <td key={lab.id} className="px-4 py-3 text-right tabular-nums">
                              {grand > 0 ? (
                                <div className="flex flex-col items-end gap-0.5">
                                  <span className={`text-lg font-bold ${isBest ? "text-emerald-600" : ""}`}>
                                    {formatCurrency(grand)}
                                  </span>
                                  {isBest && (
                                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-500 font-semibold">
                                      <CheckCircle2 className="h-3 w-3" />
                                      Meilleur prix
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted-foreground/30">—</span>
                              )}
                            </td>
                          );
                        })}
                        <td />
                      </tr>
                    </tfoot>
                  )}
                </table>

                {/* Loading overlay when comparison not yet available */}
                {isLoading && !comparison && (
                  <div className="px-4 py-3 text-xs text-muted-foreground border-t border-border/30 bg-muted/10">
                    Calcul des prix en cours…
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Profile suggestions */}
          {profileSuggestions.length > 0 && (
            <div className="rounded-2xl border border-amber-200/60 bg-amber-50/30 overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-amber-200/40">
                <Layers className="h-4 w-4 text-amber-600 shrink-0" />
                <p className="text-sm font-semibold text-amber-800">
                  Profils CDL disponibles
                </p>
                <span className="ml-auto text-xs font-semibold text-amber-600 bg-amber-100 rounded-full px-2 py-0.5">
                  {profileSuggestions.length}
                </span>
              </div>

              <div className="p-4 space-y-2">
                <p className="text-xs text-amber-700/70 mb-3">
                  Ces profils CDL couvrent un ou plusieurs de vos tests. Utiliser un profil
                  peut être plus avantageux qu'acheter les tests séparément.
                </p>
                {profileSuggestions.map(({ bundle, matchedIds }) => {
                  const extra = bundle.testMappingIds.length - matchedIds.length;
                  return (
                    <div
                      key={bundle.id}
                      className="flex items-start gap-3 rounded-xl border border-amber-200/40 bg-white p-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold leading-snug">{bundle.dealName}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Couvre{" "}
                          <span className="font-medium text-amber-700">
                            {matchedIds.length} test{matchedIds.length > 1 ? "s" : ""}
                          </span>{" "}
                          sélectionné{matchedIds.length > 1 ? "s" : ""}
                          {extra > 0 && (
                            <> + {extra} autre{extra > 1 ? "s" : ""} inclus</>
                          )}
                        </p>
                        <p className="text-sm font-bold mt-1 tabular-nums">
                          {formatCurrency(bundle.customRate)}
                        </p>
                      </div>
                      {bundle.selfTestMappingId ? (
                        <button
                          onClick={() => handleUseBundle(bundle)}
                          className="shrink-0 self-center text-xs px-3 py-1.5 rounded-lg bg-amber-100 text-amber-800 hover:bg-amber-200 font-medium transition-colors whitespace-nowrap"
                        >
                          Utiliser ce profil
                        </button>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Send email button */}
          {hasItems && comparison && (
            <button
              onClick={() => setEmailDialogOpen(true)}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors shadow-sm"
            >
              <Send className="h-4 w-4" />
              Envoyer le devis au client
            </button>
          )}
        </div>
      </div>

      <EmailComparisonDialog
        open={emailDialogOpen}
        onClose={() => setEmailDialogOpen(false)}
        testMappingIds={allIds}
        testNames={quoteRows.map((r) => r.item.name)}
        laboratories={laboratories}
        customPrices={(() => {
          const cp: Record<string, number> = {};
          for (const { item, tmId, prices } of quoteRows) {
            if (item.type === "bundle") {
              for (const [labId, p] of Object.entries(prices)) {
                if (p != null) cp[`${tmId}-${labId}`] = p;
              }
            }
          }
          return Object.keys(cp).length > 0 ? cp : undefined;
        })()}
      />
    </div>
  );
}
