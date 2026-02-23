"use client";

import { useState, useEffect, useCallback } from "react";
import BundleDealTable from "@/components/bundles/bundle-deal-table";
import BundleDealForm from "@/components/bundles/bundle-deal-form";
import { useDashboardTitle } from "@/hooks/use-dashboard-title";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";

const PAGE_SIZE = 20;

export default function BundleDealsPage() {
  useDashboardTitle("Gestion des offres groupées");
  const [deals, setDeals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingDeal, setEditingDeal] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, pages: 0 });

  const fetchDeals = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("search", debouncedSearch);
      params.set("page", String(page));
      params.set("limit", String(PAGE_SIZE));
      const res = await fetch(`/api/tests/deals?${params}`);
      const data = await res.json();
      if (data.success) {
        setDeals(data.data.deals || []);
        setPagination(data.data.pagination);
      } else {
        setError(data.message);
      }
    } catch {
      setError("Erreur lors du chargement");
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, page]);

  useEffect(() => { fetchDeals(); }, [fetchDeals]);
  useEffect(() => { setPage(1); }, [debouncedSearch]);

  const handleCreate = async (data: any) => {
    const res = await fetch("/api/tests/deals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (result.success) {
      setShowForm(false);
      fetchDeals();
    }
    return result;
  };

  const handleUpdate = async (data: any) => {
    const res = await fetch(`/api/tests/deals/${editingDeal.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (result.success) {
      setEditingDeal(null);
      fetchDeals();
    }
    return result;
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    await fetch(`/api/tests/deals/${deletingId}`, { method: "DELETE" });
    setDeletingId(null);
    fetchDeals();
  };

  return (
    <>
      <ConfirmDialog
        open={!!deletingId}
        onOpenChange={(o) => !o && setDeletingId(null)}
        title="Supprimer cette offre ?"
        description="Cette action est irréversible. L'offre groupée sera définitivement supprimée."
        confirmLabel="Supprimer"
        onConfirm={confirmDelete}
      />

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une offre..."
            className="pl-9"
          />
        </div>
        <Button onClick={() => setShowForm(true)}>+ Nouvelle offre</Button>
      </div>

      {error && <p className="text-red-400 text-sm mt-4">{error}</p>}

      <div className="mt-6">
        {isLoading ? (
          <p className="text-center text-muted-foreground py-8">Chargement...</p>
        ) : (
          <BundleDealTable
            deals={deals}
            onEdit={setEditingDeal}
            onDelete={(id) => setDeletingId(id)}
            onNew={() => setShowForm(true)}
          />
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between border-t border-border/40 px-4 py-3 mt-2">
          <p className="text-xs text-muted-foreground">
            {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} sur{" "}
            {pagination.total.toLocaleString("fr-FR")} offres
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline" size="sm" className="h-7 w-7 p-0"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={pagination.page <= 1 || isLoading}
              aria-label="Page précédente"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            {Array.from({ length: Math.min(pagination.pages, 5) }, (_, i) => {
              let pageNum: number;
              if (pagination.pages <= 5) pageNum = i + 1;
              else if (pagination.page <= 3) pageNum = i + 1;
              else if (pagination.page >= pagination.pages - 2) pageNum = pagination.pages - 4 + i;
              else pageNum = pagination.page - 2 + i;
              return (
                <Button
                  key={pageNum}
                  variant={pageNum === pagination.page ? "default" : "ghost"}
                  size="sm"
                  className="h-7 w-7 p-0 text-xs"
                  onClick={() => setPage(pageNum)}
                  disabled={isLoading}
                >
                  {pageNum}
                </Button>
              );
            })}
            <Button
              variant="outline" size="sm" className="h-7 w-7 p-0"
              onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
              disabled={pagination.page >= pagination.pages || isLoading}
              aria-label="Page suivante"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      <BundleDealForm
        open={showForm || !!editingDeal}
        onSubmit={editingDeal ? handleUpdate : handleCreate}
        onClose={() => {
          setShowForm(false);
          setEditingDeal(null);
        }}
        editData={editingDeal || undefined}
      />
    </>
  );
}
