"use client";

import { useState, useCallback } from "react";
import { flushSync } from "react-dom";

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
      flushSync(() => {
        if (data.success) {
          setComparison(data.data);
        } else {
          setError(data.message);
        }
        setIsLoading(false);
      });
    } catch {
      flushSync(() => {
        setError("Erreur lors de la comparaison");
        setIsLoading(false);
      });
    }
  }, []);

  const reset = useCallback(() => {
    flushSync(() => {
      setComparison(null);
      setError(null);
    });
  }, []);

  return { comparison, isLoading, error, compare, reset };
}
