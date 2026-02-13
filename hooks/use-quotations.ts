"use client";

import { useState, useEffect, useCallback } from "react";

export function useQuotations() {
  const [quotations, setQuotations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQuotations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/quotations");
      const data = await res.json();
      if (data.success) setQuotations(data.data.items || data.data || []);
      else setError(data.message);
    } catch {
      setError("Erreur lors du chargement");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuotations();
  }, [fetchQuotations]);

  return { quotations, isLoading, error, refetch: fetchQuotations };
}

export function useQuotation(id: string) {
  const [quotation, setQuotation] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    fetch(`/api/quotations/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setQuotation(d.data);
        else setError(d.message);
      })
      .catch(() => setError("Erreur"))
      .finally(() => setIsLoading(false));
  }, [id]);

  return { quotation, isLoading, error };
}

export function useQuotationEmail(quotationId: string) {
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendEmail = useCallback(
    async (emailData: { to: string; subject: string; message?: string }) => {
      setIsSending(true);
      setError(null);
      try {
        const res = await fetch(`/api/quotations/${quotationId}/email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(emailData),
        });
        const data = await res.json();
        if (!data.success) setError(data.message);
        return data.success;
      } catch {
        setError("Erreur lors de l'envoi");
        return false;
      } finally {
        setIsSending(false);
      }
    },
    [quotationId]
  );

  return { sendEmail, isSending, error };
}
