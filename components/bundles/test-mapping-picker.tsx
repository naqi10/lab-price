"use client";

import { useState, useEffect, useMemo } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { X, Search, FlaskConical, Building2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface TestMappingPickerProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

interface MappingOption {
  id: string;
  canonicalName: string;
  category?: string;
  cheapestPrice: number | null;
  cheapestLabName: string | null;
}

function extractCheapest(entries: any[]): { price: number | null; labName: string | null } {
  if (!entries || entries.length === 0) return { price: null, labName: null };

  let best: { price: number; labName: string } | null = null;
  for (const e of entries) {
    if (e.price != null && (best === null || e.price < best.price)) {
      best = { price: e.price, labName: e.laboratory?.name ?? null };
    }
  }
  return best ?? { price: null, labName: null };
}

function mapToOption(m: any): MappingOption {
  const { price, labName } = extractCheapest(m.entries ?? []);
  return {
    id: m.id,
    canonicalName: m.canonicalName,
    category: m.category,
    cheapestPrice: price,
    cheapestLabName: labName,
  };
}

export default function TestMappingPicker({ selectedIds, onChange }: TestMappingPickerProps) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [options, setOptions] = useState<Record<string, MappingOption>>({});
  const [loading, setLoading] = useState(false);

  // Search for mappings (stable + race-safe)
  useEffect(() => {
    const controller = new AbortController();

    const fetchOptions = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ limit: "50" });
        if (debouncedSearch) params.set("search", debouncedSearch);
        const res = await fetch(`/api/tests/mappings?${params}`, { signal: controller.signal });
        const data = await res.json();
        if (data.success) {
          const mapped = (data.data.mappings || []).map(mapToOption) as MappingOption[];
          setOptions((prev) => {
            const next = { ...prev };
            for (const m of mapped) {
              next[m.id] = m;
            }
            return next;
          });
        }
      } catch {
        // silent
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    fetchOptions();
    return () => controller.abort();
  }, [debouncedSearch]);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const selectedMappings = useMemo(() => {
    return selectedIds
      .map((id) => options[id])
      .filter((m): m is MappingOption => Boolean(m));
  }, [selectedIds, options]);

  const toggleMapping = (mapping: MappingOption) => {
    const nextIds = new Set(selectedSet);
    if (nextIds.has(mapping.id)) nextIds.delete(mapping.id);
    else nextIds.add(mapping.id);
    onChange(Array.from(nextIds));
  };

  const removeMapping = (id: string) => {
    onChange(selectedIds.filter((sid) => sid !== id));
  };

  const availableOptions = useMemo(() => {
    return Object.values(options)
      .filter((o) => !selectedSet.has(o.id))
      .sort((a, b) => a.canonicalName.localeCompare(b.canonicalName));
  }, [options, selectedSet]);

  return (
    <div className="space-y-2">
      {/* Selected pills — always rendered (never conditional) to avoid React 19
          insertBefore-inside-portal bugs when transitioning from 0→1 items */}
      <div className="flex flex-col gap-1.5">
        {selectedMappings.map((m) => (
          <div
            key={m.id}
            className="flex items-center gap-2 rounded-md border border-border/60 bg-muted/30 px-2.5 py-1.5 text-xs"
          >
            <FlaskConical className="h-3 w-3 text-muted-foreground shrink-0" />
            <span className="font-medium flex-1 truncate">{m.canonicalName}</span>
            {m.cheapestPrice != null && (
              <span className="text-primary font-semibold shrink-0">
                {formatCurrency(m.cheapestPrice)}
              </span>
            )}
            {m.cheapestLabName && (
              <span className="flex items-center gap-1 text-muted-foreground shrink-0">
                <Building2 className="h-3 w-3" />
                <span className="max-w-[100px] truncate">{m.cheapestLabName}</span>
              </span>
            )}
            <button
              type="button"
              onClick={() => removeMapping(m.id)}
              className="ml-0.5 rounded-sm hover:bg-muted-foreground/20 p-0.5 shrink-0"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>

      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          id="test-mapping-search"
          name="testMappingSearch"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un test..."
          className="pl-9"
          autoComplete="off"
        />
      </div>

      {/* Options list */}
      <div className="border rounded-md max-h-[200px] overflow-y-auto">
        {loading ? (
          <p className="text-center text-xs text-muted-foreground py-4">Chargement...</p>
        ) : availableOptions.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground py-4">
            {search ? "Aucun resultat" : "Aucun test disponible"}
          </p>
        ) : (
          availableOptions.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => toggleMapping(opt)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent text-left transition-colors"
            >
              <FlaskConical className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="flex-1 truncate">{opt.canonicalName}</span>
              {opt.cheapestPrice != null && (
                <span className="text-xs font-semibold text-primary shrink-0">
                  {formatCurrency(opt.cheapestPrice)}
                </span>
              )}
              {opt.cheapestLabName && (
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground shrink-0">
                  <Building2 className="h-3 w-3" />
                  <span className="max-w-[80px] truncate">{opt.cheapestLabName}</span>
                </span>
              )}
              {opt.category && (
                <Badge variant="outline" className="text-[10px] shrink-0">
                  {opt.category}
                </Badge>
              )}
            </button>
          ))
        )}
      </div>

      {/* Summary: count + total */}
      {(() => {
        const total = selectedMappings.reduce((sum, m) => sum + (m.cheapestPrice ?? 0), 0);
        const hasAnyPrice = selectedMappings.some((m) => m.cheapestPrice != null);
        return (
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>
              {selectedIds.length} test{selectedIds.length !== 1 ? "s" : ""} sélectionné{selectedIds.length !== 1 ? "s" : ""}
            </span>
            {hasAnyPrice && selectedMappings.length > 0 && (
              <span className="font-semibold text-foreground">
                Total : {formatCurrency(total)}
              </span>
            )}
          </div>
        );
      })()}
    </div>
  );
}
