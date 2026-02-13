"use client";

import { useState, useCallback } from "react";

export function useComparison() {
  const [comparison, setComparison] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const compare = useCallback(async (testMappingIds: string[]) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/comparison", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testMappingIds }),
      });
      const data = await res.json();
      if (data.success) {
        setComparison(data.data);
      } else {
        setError(data.message);
      }
    } catch {
      setError("Erreur lors de la comparaison");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setComparison(null);
    setError(null);
  }, []);

  return { comparison, isLoading, error, compare, reset };
}
