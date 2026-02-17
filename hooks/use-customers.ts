"use client";

import { useState, useEffect, useCallback } from "react";

export function useCustomers(search?: string) {
  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomers = useCallback(async () => {
    setIsLoading(true); setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const res = await fetch(`/api/customers?${params}`);
      const data = await res.json();
      if (data.success) setCustomers(data.data);
      else setError(data.message);
    } catch {
      setError("Erreur lors du chargement");
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);
  return { customers, isLoading, error, refetch: fetchCustomers };
}

export function useCustomer(id: string) {
  const [customer, setCustomer] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    fetch(`/api/customers/${id}`)
      .then(r => r.json())
      .then(d => { if (d.success) setCustomer(d.data); else setError(d.message); })
      .catch(() => setError("Erreur"))
      .finally(() => setIsLoading(false));
  }, [id]);
  return { customer, isLoading, error };
}
