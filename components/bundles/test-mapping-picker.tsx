"use client";

import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { X, Search, FlaskConical, Building2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

interface MappingOption {
  id: string;
  uid: string;
  canonicalName: string;
  category?: string;
  cheapestPrice: number | null;
  cheapestLabName: string | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function extractCheapest(entries: any[]): { price: number | null; labName: string | null } {
  if (!entries?.length) return { price: null, labName: null };
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
  const toSlug = (v: string | null | undefined) =>
    (v ?? "na")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
  const uid = `${toSlug(labName)}-${toSlug(m.category ?? "individual")}-${toSlug(m.code ?? m.id)}`;
  return {
    id: m.id,
    uid,
    canonicalName: m.canonicalName,
    category: m.category ?? undefined,
    cheapestPrice: price,
    cheapestLabName: labName,
  };
}

/** Immutable merge: existing items kept in order, new items appended. No duplicates. */
function mergeOptions(prev: MappingOption[], incoming: MappingOption[]): MappingOption[] {
  const map = new Map(prev.map((o) => [o.id, o]));
  for (const item of incoming) {
    map.set(item.id, item);
  }
  return Array.from(map.values());
}

// ── SelectedTestItem ──────────────────────────────────────────────────────────
// Memoized leaf — only re-renders when its own mapping changes.

const SelectedTestItem = memo(function SelectedTestItem({
  mapping,
  onRemove,
}: {
  mapping: MappingOption;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-border/60 bg-muted/30 px-2.5 py-1.5 text-xs">
      <FlaskConical className="h-3 w-3 text-muted-foreground shrink-0" />
      <span className="font-medium flex-1 truncate">{mapping.canonicalName}</span>
      {mapping.cheapestPrice != null && (
        <span className="text-primary font-semibold shrink-0">
          {formatCurrency(mapping.cheapestPrice)}
        </span>
      )}
      {mapping.cheapestLabName && (
        <span className="flex items-center gap-1 text-muted-foreground shrink-0">
          <Building2 className="h-3 w-3" />
          <span className="max-w-[100px] truncate">{mapping.cheapestLabName}</span>
        </span>
      )}
      <button
        type="button"
        onClick={() => onRemove(mapping.id)}
        className="ml-0.5 rounded-sm hover:bg-muted-foreground/20 p-0.5 shrink-0"
        aria-label={`Retirer ${mapping.canonicalName}`}
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
});

// ── SelectedTestsList ─────────────────────────────────────────────────────────
// Always renders the outer div (never null / conditional at root level).
// This keeps the fiber node stable across 0 ↔ N transitions.

const SelectedTestsList = memo(function SelectedTestsList({
  mappings,
  onRemove,
}: {
  mappings: MappingOption[];
  onRemove: (id: string) => void;
}) {
  const unique = useMemo(
    () => Array.from(new Map(mappings.map((m) => [m.uid, m])).values()),
    [mappings]
  );
  return (
    // Always a div — never null — so React never needs to insert/remove this node.
    <div className="flex flex-col gap-1.5">
      {unique.map((m) => (
        <SelectedTestItem key={m.uid} mapping={m} onRemove={onRemove} />
      ))}
    </div>
  );
});

// ── AvailableOptionsList ──────────────────────────────────────────────────────
// KEY FIX: Always renders a <div> as root — never switches between <p>, <></>, etc.
// Previously the component returned 3 different root types (p / p / Fragment).
// React reconciling a parent node whose direct child root-type changes while
// ALSO reconciling SelectedTestsList in the same commit caused the removeChild crash.
// Now: the outer <div> is always the same DOM node. Only its *children* change.

const AvailableOptionsList = memo(function AvailableOptionsList({
  options,
  loading,
  hasSearch,
  onSelect,
}: {
  options: MappingOption[];
  loading: boolean;
  hasSearch: boolean;
  onSelect: (mapping: MappingOption) => void;
}) {
  return (
    <div>
      {loading && (
        <p className="text-center text-xs text-muted-foreground py-4">Chargement...</p>
      )}
      {!loading && options.length === 0 && (
        <p className="text-center text-xs text-muted-foreground py-4">
          {hasSearch ? "Aucun résultat" : "Aucun test disponible"}
        </p>
      )}
      {!loading &&
        options.map((opt) => (
          <button
            key={opt.uid}
            type="button"
            onClick={() => onSelect(opt)}
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
        ))}
    </div>
  );
});

// ── Main picker ────────────────────────────────────────────────────────────────

export default function TestMappingPicker({
  selectedIds,
  onChange,
}: {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [optionsList, setOptionsList] = useState<MappingOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const fetchOptions = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ limit: "50" });
        if (debouncedSearch) params.set("search", debouncedSearch);
        const res = await fetch(`/api/tests/mappings?${params}`, {
          signal: controller.signal,
        });
        const data = await res.json();
        if (data.success) {
          const fetched: MappingOption[] = (data.data.mappings ?? []).map(mapToOption);
          setOptionsList((prev) => mergeOptions(prev, fetched));
        }
      } catch {
        // Includes AbortError — silently ignored
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    fetchOptions();
    return () => controller.abort();
  }, [debouncedSearch]);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const selectedMappings = useMemo<MappingOption[]>(() => {
    const byId = new Map(optionsList.map((o) => [o.id, o]));
    const seen = new Set<string>();
    const result: MappingOption[] = [];
    for (const id of selectedIds) {
      if (seen.has(id)) continue;
      seen.add(id);
      const m = byId.get(id);
      if (m) result.push(m);
    }
    return result;
  }, [selectedIds, optionsList]);

  const availableOptions = useMemo<MappingOption[]>(
    () =>
      optionsList
        .filter((o) => !selectedSet.has(o.id))
        .sort((a, b) => a.canonicalName.localeCompare(b.canonicalName)),
    [optionsList, selectedSet]
  );

  const handleRemove = useCallback(
    (id: string) => {
      onChange(selectedIds.filter((sid) => sid !== id));
    },
    [selectedIds, onChange]
  );

  const handleSelect = useCallback(
    (mapping: MappingOption) => {
      if (selectedSet.has(mapping.id)) return;
      onChange([...selectedIds, mapping.id]);
    },
    [selectedIds, selectedSet, onChange]
  );

  const selectedTotal = useMemo(
    () => selectedMappings.reduce((sum, m) => sum + (m.cheapestPrice ?? 0), 0),
    [selectedMappings]
  );
  const hasAnyPrice = selectedMappings.some((m) => m.cheapestPrice != null);

  return (
    <div className="space-y-2 notranslate" translate="no">
      <SelectedTestsList mappings={selectedMappings} onRemove={handleRemove} />

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
          spellCheck={false}
          data-gramm="false"
        />
      </div>

      <div className="border rounded-md max-h-[200px] overflow-y-auto">
        <AvailableOptionsList
          options={availableOptions}
          loading={loading}
          hasSearch={search.length > 0}
          onSelect={handleSelect}
        />
      </div>

      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>
          {selectedIds.length} test{selectedIds.length !== 1 ? "s" : ""} sélectionné
          {selectedIds.length !== 1 ? "s" : ""}
        </span>
        {hasAnyPrice && selectedMappings.length > 0 && (
          <span className="font-semibold text-foreground">
            Total : {formatCurrency(selectedTotal)}
          </span>
        )}
      </div>
    </div>
  );
}
