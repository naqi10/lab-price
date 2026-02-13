"use client";

import { useState, useEffect, useCallback } from "react";

export function useLaboratories(search?: string) {
  const [laboratories, setLaboratories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLaboratories = useCallback(async () => {
    setIsLoading(true); setError(null);
    try { const params = new URLSearchParams(); if (search) params.set("search", search); const res = await fetch(`/api/laboratories?${params}`); const data = await res.json(); if (data.success) setLaboratories(data.data); else setError(data.message); }
    catch { setError("Erreur lors du chargement"); } finally { setIsLoading(false); }
  }, [search]);

  useEffect(() => { fetchLaboratories(); }, [fetchLaboratories]);
  return { laboratories, isLoading, error, refetch: fetchLaboratories };
}

export function useLaboratory(id: string) {
  const [laboratory, setLaboratory] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return; setIsLoading(true);
    fetch(`/api/laboratories/${id}`).then(r => r.json()).then(d => { if (d.success) setLaboratory(d.data); else setError(d.message); }).catch(() => setError("Erreur")).finally(() => setIsLoading(false));
  }, [id]);
  return { laboratory, isLoading, error };
}
