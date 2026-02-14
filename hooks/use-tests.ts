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

export function useTestCart() {
  const [items, setItems] = useState<{ id: string; testMappingId: string; canonicalName: string }[]>([]);

  // Hydrate from sessionStorage on mount
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(CART_KEY);
      if (stored) setItems(JSON.parse(stored));
    } catch { /* ignore */ }
  }, []);

  // Persist to sessionStorage on every change
  useEffect(() => {
    try {
      sessionStorage.setItem(CART_KEY, JSON.stringify(items));
    } catch { /* ignore */ }
  }, [items]);

  const addItem = useCallback((item: { id: string; testMappingId: string; canonicalName: string }) => { setItems(prev => prev.find(i => i.id === item.id) ? prev : [...prev, item]); }, []);
  const removeItem = useCallback((id: string) => { setItems(prev => prev.filter(i => i.id !== id)); }, []);
  const clearCart = useCallback(() => setItems([]), []);
  return { items, addItem, removeItem, clearCart, totalItems: items.length };
}
