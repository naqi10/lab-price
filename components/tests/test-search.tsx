"use client";

import { useState, useEffect } from "react";
import { Search, PlusCircle, CheckCircle2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDebounce } from "@/hooks/use-debounce";
import MatchIndicator from "./match-indicator";

interface SearchResult {
  id: string;
  name: string;
  code: string | null;
  category: string | null;
  price: number;
  unit: string | null;
  laboratoryId: string;
  laboratoryName: string;
  laboratoryCode: string;
  testMappingId: string | null;
  canonicalName: string | null;
  similarity?: number;
  matchType?: string;
  confidence?: number;
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
    fetch(`/api/tests?q=${encodeURIComponent(debouncedQuery)}`)
      .then(r => r.json())
      .then(d => { if (d.success) setResults(d.data); })
      .finally(() => setIsLoading(false));
  }, [debouncedQuery]);

  const limited = results.slice(0, 8);

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

      {!isLoading && limited.length > 0 && (
        <div className="w-full rounded-lg border border-border/60 bg-card overflow-hidden">
          <div className="px-4 py-2.5 border-b border-border/40 bg-muted/30">
            <p className="text-xs font-medium text-muted-foreground">
              {results.length > 8
                ? `Top 8 suggestions sur ${results.length} résultats`
                : `${limited.length} suggestion${limited.length > 1 ? "s" : ""}`}
            </p>
          </div>
          <ul className="divide-y divide-border/30">
            {limited.map((test) => {
              const inCart = !!test.testMappingId && !!cartItemIds?.has(test.testMappingId);
              return (
                <li
                  key={test.id}
                  className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-accent/50 transition-colors"
                  style={inCart ? { backgroundColor: "rgba(var(--primary-rgb,59,130,246),0.06)" } : undefined}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{test.name}</p>
                      {test.category && (
                        <Badge variant="secondary" className="text-[10px] shrink-0">{test.category}</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">{test.laboratoryName}</span>
                      {test.canonicalName && (
                        <span className="text-[10px] text-emerald-400 truncate max-w-[160px]">
                          → {test.canonicalName}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {test.matchType && <MatchIndicator type={test.matchType} confidence={test.confidence} compact />}
                    <span className="text-sm font-semibold tabular-nums whitespace-nowrap">
                      {test.price} <span className="text-xs text-muted-foreground font-normal">{test.unit || "MAD"}</span>
                    </span>
                    {onAddToCart && (
                      inCart ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => test.testMappingId && onRemoveFromCart?.(test.testMappingId)}
                          className="h-7 w-7 p-0 text-emerald-400 hover:text-destructive hover:bg-destructive/10"
                          aria-label="Retirer de la sélection"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                      ) : (
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
  );
}
