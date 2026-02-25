"use client";

import { useState, useEffect, useCallback } from "react";
import { useDebounce } from "./use-debounce";

export function useTestSearch(query: string) {
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (debouncedQuery.length < 2) { setResults([]); return; }
    setIsLoading(true);
    fetch(`/api/tests?q=${encodeURIComponent(debouncedQuery)}`).then(r => r.json()).then(d => { if (d.success) setResults(d.data); }).finally(() => setIsLoading(false));
  }, [debouncedQuery]);
  return { results, isLoading };
}

export function useTestMappings() {
  const [mappings, setMappings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMappings = useCallback(async () => {
    setIsLoading(true);
    try { const res = await fetch("/api/tests/mappings"); const data = await res.json(); if (data.success) setMappings(data.data.items || data.data || []); else setError(data.message); }
    catch { setError("Erreur"); } finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetchMappings(); }, [fetchMappings]);
  return { mappings, isLoading, error, refetch: fetchMappings };
}

const CART_KEY = "lab-price-test-cart";

type CartItem = { id: string; testMappingId: string; canonicalName: string; tubeType?: string | null };

function persistCart(items: CartItem[]) {
  try { sessionStorage.setItem(CART_KEY, JSON.stringify(items)); } catch { /* ignore */ }
}

export function useTestCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isReady, setIsReady] = useState(false);

  // Hydrate from sessionStorage on mount (read-only, no persist effect)
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(CART_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const seen = new Set<string>();
          const deduped = parsed.filter((item: CartItem) => {
            const key = item.testMappingId;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
          setItems(deduped);
          persistCart(deduped);
        }
      }
    } catch { /* ignore */ }
    setIsReady(true);
  }, []);

  // Persist inline with every mutation — no separate persist effect
  const addItem = useCallback((item: CartItem) => {
    setItems(prev => {
      const duplicate = prev.some((i) => i.testMappingId === item.testMappingId);
      if (duplicate) return prev;
      const next = [...prev, item];
      persistCart(next);
      return next;
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems(prev => {
      const next = prev.filter(i => i.id !== id);
      persistCart(next);
      return next;
    });
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    persistCart([]);
  }, []);

  const loadFromMappingIds = useCallback(async (testMappingIds: string[]) => {
    if (testMappingIds.length === 0) {
      setItems([]);
      persistCart([]);
      return;
    }
    try {
      const res = await fetch("/api/tests/mappings");
      const data = await res.json();
      const mappings = (data.success && data.data) ? data.data : [];
      const idSet = new Set(testMappingIds);
      const byId = mappings.filter((m: { id: string }) => idSet.has(m.id));
      const order = new Map(testMappingIds.map((id, i) => [id, i]));
      byId.sort((a: { id: string }, b: { id: string }) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
      const seenIds = new Set<string>();
      const newItems = byId.reduce((acc: CartItem[], m: { id: string; canonicalName?: string }) => {
        const canonicalName = m.canonicalName ?? m.id;
        if (seenIds.has(m.id)) return acc;
        seenIds.add(m.id);
        acc.push({
          id: m.id,
          testMappingId: m.id,
          canonicalName,
        });
        return acc;
      }, []);
      setItems(newItems);
      persistCart(newItems);
    } catch {
      setItems([]);
      persistCart([]);
    }
  }, []);

  return { items, addItem, removeItem, clearCart, loadFromMappingIds, totalItems: items.length, isReady };
}
