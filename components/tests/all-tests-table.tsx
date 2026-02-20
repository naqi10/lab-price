"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Search,
  FlaskConical,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  Link2,
  Link2Off,
  X,
  SlidersHorizontal,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { parseTubeColor } from "@/lib/tube-colors";

interface Test {
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
}

/** Color-codes a turnaround string: same-day → green, ≤3 days → amber, slower → muted */
function TatBadge({ value }: { value: string }) {
  const lower = value.toLowerCase();
  let colorClass = "text-muted-foreground";
  if (
    lower.includes("même jour") ||
    lower.includes("same day") ||
    lower.includes("j0") ||
    lower.includes("urgent")
  ) {
    colorClass = "text-emerald-400";
  } else if (/\b[1-3]\s*(j|jour|day)/.test(lower)) {
    colorClass = "text-amber-400";
  }
  return (
    <div className={`flex items-center gap-1 whitespace-nowrap ${colorClass}`}>
      <Clock className="h-3 w-3 shrink-0" />
      <span className="text-xs">{value}</span>
    </div>
  );
}

interface Meta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface AllTestsTableProps {
  onAddToCart?: (test: Test) => void;
  onRemoveFromCart?: (testMappingId: string) => void;
  cartItemIds?: Set<string>;
  /** Called once labs are loaded so parent can build the color map */
  onLabsLoaded?: (labs: { id: string; name: string }[]) => void;
}

const PAGE_SIZE = 20;

export default function AllTestsTable({
  onAddToCart,
  onRemoveFromCart,
  cartItemIds,
  onLabsLoaded,
}: AllTestsTableProps) {
  const [tests, setTests] = useState<Test[]>([]);
  const [meta, setMeta] = useState<Meta>({
    total: 0,
    page: 1,
    limit: PAGE_SIZE,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [q, setQ] = useState("");
  const [labId, setLabId] = useState("");
  const [category, setCategory] = useState("");
  const [mapped, setMapped] = useState<"" | "yes" | "no">("");
  const [page, setPage] = useState(1);

  // Filter options
  const [labs, setLabs] = useState<{ id: string; name: string }[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const debouncedQ = useDebounce(q, 350);
  const abortRef = useRef<AbortController | null>(null);

  // Load labs once
  useEffect(() => {
    fetch("/api/laboratories")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setLabs(d.data);
          onLabsLoaded?.(d.data);
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchTests = useCallback(
    async (p: number) => {
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          browse: "true",
          page: String(p),
          limit: String(PAGE_SIZE),
        });
        if (debouncedQ) params.set("q", debouncedQ);
        if (labId) params.set("labId", labId);
        if (category) params.set("category", category);
        if (mapped) params.set("mapped", mapped);

        const res = await fetch(`/api/tests?${params}`, {
          signal: abortRef.current.signal,
        });
        const data = await res.json();
        if (data.success) {
          setTests(data.data);
          setMeta(data.meta);
          const cats = Array.from(
            new Set<string>(
              (data.data as Test[])
                .map((t) => t.category)
                .filter(Boolean) as string[],
            ),
          ).sort();
          if (cats.length > 0)
            setCategories((prev) =>
              Array.from(new Set([...prev, ...cats])).sort(),
            );
        } else {
          setError(data.message || "Erreur de chargement");
        }
      } catch (err: any) {
        if (err.name !== "AbortError") setError("Erreur de connexion");
      } finally {
        setLoading(false);
      }
    },
    [debouncedQ, labId, category, mapped],
  );

  useEffect(() => {
    setPage(1);
  }, [debouncedQ, labId, category, mapped]);
  useEffect(() => {
    fetchTests(page);
  }, [fetchTests, page]);

  const hasActiveFilters = labId || category || mapped || debouncedQ;

  const clearFilters = () => {
    setQ("");
    setLabId("");
    setCategory("");
    setMapped("");
  };

  return (
    <TooltipProvider>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <FlaskConical className="h-4 w-4 text-muted-foreground" />
              Tous les tests
              {!loading && (
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  ({meta.total.toLocaleString("fr-FR")} au total)
                </span>
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="h-7 text-xs gap-1"
                >
                  <X className="h-3 w-3" />
                  Effacer les filtres
                </Button>
              )}
              <Button
                variant={showFilters ? "secondary" : "outline"}
                size="sm"
                className="h-7 text-xs gap-1.5"
                onClick={() => setShowFilters((v) => !v)}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Filtres
              </Button>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Filtrer par nom de test..."
              className="pl-9 h-9"
            />
            {q && (
              <button
                onClick={() => setQ("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Expanded filters */}
          {showFilters && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2">
              <select
                value={labId}
                onChange={(e) => setLabId(e.target.value)}
                className="col-span-1 flex h-9 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
              >
                <option value="">Tous les laboratoires</option>
                {labs.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>

              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="col-span-1 flex h-9 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
              >
                <option value="">Toutes les catégories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <select
                value={mapped}
                onChange={(e) => setMapped(e.target.value as "" | "yes" | "no")}
                className="col-span-1 flex h-9 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
              >
                <option value="">Tous (mappés ou non)</option>
                <option value="yes">Mappés uniquement</option>
                <option value="no">Non mappés uniquement</option>
              </select>
            </div>
          )}
        </CardHeader>

        <CardContent className="p-0">
          {error && (
            <p className="text-sm text-destructive px-6 py-4">{error}</p>
          )}

          {loading ? (
            <div className="px-6 pb-6 space-y-2">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : tests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="h-12 w-12 rounded-full bg-muted/40 border border-border/50 flex items-center justify-center">
                <FlaskConical className="h-5 w-5 text-muted-foreground/60" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground/70">
                  Aucun test trouvé
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {hasActiveFilters
                    ? "Essayez de modifier vos filtres"
                    : "Aucun test disponible pour le moment"}
                </p>
              </div>
              {hasActiveFilters && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={clearFilters}
                  className="mt-1"
                >
                  Effacer les filtres
                </Button>
              )}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom du test</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Laboratoire</TableHead>
                    <TableHead className="w-px whitespace-nowrap">
                      Prix
                    </TableHead>
                    <TableHead className="w-px whitespace-nowrap">
                      Délai
                    </TableHead>
                    <TableHead>Correspondance</TableHead>
                    {onAddToCart && <TableHead className="w-10" />}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tests.map((test) => {
                    const inCart =
                      !!test.testMappingId &&
                      !!cartItemIds?.has(test.testMappingId);
                    const tube = parseTubeColor(test.tubeType);
                    return (
                      <TableRow
                        key={test.id}
                        style={
                          inCart
                            ? {
                                backgroundColor:
                                  "rgba(var(--primary-rgb,59,130,246),0.06)",
                              }
                            : undefined
                        }
                      >
                        <TableCell className="font-medium max-w-[220px]">
                          <div className="flex items-center gap-1.5">
                            {tube && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span
                                    className="inline-block h-2.5 w-2.5 rounded-full shrink-0 ring-1 ring-white/10"
                                    style={{ backgroundColor: tube.color }}
                                  />
                                </TooltipTrigger>
                                <TooltipContent side="top">
                                  {tube.label}
                                </TooltipContent>
                              </Tooltip>
                            )}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="block truncate cursor-default">
                                  {test.name}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent side="right">
                                {test.name}
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </TableCell>

                        <TableCell>
                          {test.code ? (
                            <code className="rounded bg-muted/50 px-1.5 py-0.5 text-xs font-mono text-muted-foreground">
                              {test.code}
                            </code>
                          ) : (
                            <span className="text-muted-foreground/50 text-xs">
                              —
                            </span>
                          )}
                        </TableCell>

                        <TableCell>
                          {test.category ? (
                            <Badge variant="secondary" className="text-xs">
                              {test.category}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground/50 text-xs">
                              —
                            </span>
                          )}
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold shrink-0">
                              {test.laboratoryCode}
                            </span>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="block text-sm truncate max-w-[120px] cursor-default">
                                  {test.laboratoryName}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                {test.laboratoryName}
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </TableCell>

                        <TableCell className="font-medium tabular-nums text-sm text-nowrap">
                          {test.price.toLocaleString("fr-FR", {
                            minimumFractionDigits: 0,
                          })}
                          <span className="text-muted-foreground text-xs ml-1">
                            {test.unit || "MAD"}
                          </span>
                        </TableCell>

                        <TableCell>
                          {test.turnaroundTime ? (
                            <TatBadge value={test.turnaroundTime} />
                          ) : (
                            <span className="text-muted-foreground/40 text-xs text-nowrap">
                              —
                            </span>
                          )}
                        </TableCell>

                        <TableCell>
                          {test.canonicalName ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-1.5 cursor-default">
                                  <Link2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                                  <span className="text-xs text-emerald-400 truncate max-w-[130px]">
                                    {test.canonicalName}
                                  </span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                Correspondance : {test.canonicalName}
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <Link2Off className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                              <span className="text-xs text-muted-foreground/50">
                                Non mappé
                              </span>
                            </div>
                          )}
                        </TableCell>

                        {onAddToCart && (
                          <TableCell className="text-right pr-4">
                            {inCart ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      test.testMappingId &&
                                      onRemoveFromCart?.(test.testMappingId)
                                    }
                                    className="h-7 w-7 p-0 text-emerald-400 hover:text-destructive hover:bg-destructive/10"
                                    aria-label="Retirer de la sélection"
                                  >
                                    <CheckCircle2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  Retirer de la sélection
                                </TooltipContent>
                              </Tooltip>
                            ) : (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onAddToCart(test)}
                                    disabled={!test.testMappingId}
                                    className="h-7 w-7 p-0 disabled:opacity-30"
                                    aria-label="Ajouter à la comparaison"
                                  >
                                    <PlusCircle className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {test.testMappingId
                                    ? "Ajouter à la comparaison"
                                    : "Créez une correspondance d'abord"}
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between border-t border-border/40 px-4 py-3">
                <p className="text-xs text-muted-foreground">
                  {(meta.page - 1) * meta.limit + 1}–
                  {Math.min(meta.page * meta.limit, meta.total)} sur{" "}
                  {meta.total.toLocaleString("fr-FR")} tests
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={meta.page <= 1 || loading}
                    aria-label="Page précédente"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>

                  {Array.from(
                    { length: Math.min(meta.totalPages, 5) },
                    (_, i) => {
                      let pageNum: number;
                      if (meta.totalPages <= 5) pageNum = i + 1;
                      else if (meta.page <= 3) pageNum = i + 1;
                      else if (meta.page >= meta.totalPages - 2)
                        pageNum = meta.totalPages - 4 + i;
                      else pageNum = meta.page - 2 + i;
                      return (
                        <Button
                          key={pageNum}
                          variant={pageNum === meta.page ? "default" : "ghost"}
                          size="sm"
                          className="h-7 w-7 p-0 text-xs"
                          onClick={() => setPage(pageNum)}
                          disabled={loading}
                        >
                          {pageNum}
                        </Button>
                      );
                    },
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() =>
                      setPage((p) => Math.min(meta.totalPages, p + 1))
                    }
                    disabled={meta.page >= meta.totalPages || loading}
                    aria-label="Page suivante"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
