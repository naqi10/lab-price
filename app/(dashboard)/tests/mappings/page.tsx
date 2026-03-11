"use client";

import { useState, useEffect, useCallback } from "react";
import TestMappingTable from "@/components/tests/test-mapping-table";
import TestMappingForm from "@/components/tests/test-mapping-form";
import { useDashboardTitle } from "@/hooks/use-dashboard-title";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";

const PAGE_SIZE = 20;

export default function TestMappingsPage() {
  useDashboardTitle("Gestion des correspondances");
  const [mappings, setMappings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingMapping, setEditingMapping] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [laboratories, setLaboratories] = useState<{ id: string; name: string }[]>([]);

  // Search, filter & pagination state
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [filterLab, setFilterLab] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, pages: 0 });

  const fetchMappings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (filterLab) params.set("lab", filterLab);
      params.set("page", String(page));
      params.set("limit", String(PAGE_SIZE));
      const res = await fetch(`/api/tests/mappings?${params}`);
      const data = await res.json();
      if (data.success) {
        setMappings(data.data.mappings || []);
        setPagination(data.data.pagination);
      } else {
        setError(data.message);
      }
    } catch {
      setError("Erreur lors du chargement");
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, filterLab, page]);

  useEffect(() => { fetchMappings(); }, [fetchMappings]);

  // Reset to page 1 when search or lab filter changes
  useEffect(() => { setPage(1); }, [debouncedSearch, filterLab]);

  useEffect(() => {
    fetch("/api/laboratories")
      .then((r) => r.json())
      .then((d) => { if (d.success) setLaboratories(d.data); })
      .catch(console.error);
  }, []);

  const handleCreate = async (data: any) => {
    const res = await fetch("/api/tests/mappings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (result.success) {
      setShowForm(false);
      fetchMappings();
    }
    return result;
  };

  const handleUpdate = async (data: any) => {
    const res = await fetch(`/api/tests/mappings/${editingMapping.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (result.success) {
      setEditingMapping(null);
      fetchMappings();
    }
    return result;
  };

  const handleDelete = (id: string) => setDeletingId(id);

  const confirmDelete = async () => {
    if (!deletingId) return;
    await fetch(`/api/tests/mappings/${deletingId}`, { method: "DELETE" });
    setDeletingId(null);
    fetchMappings();
  };

   return (
     <>
       <ConfirmDialog
         open={!!deletingId}
         onOpenChange={(o) => !o && setDeletingId(null)}
         title="Supprimer cette correspondance ?"
         description="Cette action est irréversible. La correspondance sera définitivement supprimée."
         confirmLabel="Supprimer"
         onConfirm={confirmDelete}
       />

      {/* Search bar + filter + action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom de test..."
            className="pl-9"
          />
        </div>
        <select
          value={filterLab}
          onChange={(e) => setFilterLab(e.target.value)}
          className="flex h-10 rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground transition-colors hover:border-border/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background cursor-pointer"
        >
          <option value="">Tous les laboratoires</option>
          {laboratories.map((lab) => (
            <option key={lab.id} value={lab.id}>{lab.name}</option>
          ))}
        </select>
        <Button onClick={() => setShowForm(true)}>+ Nouvelle correspondance</Button>
      </div>

      {error && <p className="text-red-400 text-sm mt-4">{error}</p>}

      <div className="mt-6">
        {isLoading ? (
          <p className="text-center text-muted-foreground py-8">Chargement...</p>
        ) : (
          <TestMappingTable
            mappings={mappings}
            onEdit={setEditingMapping}
            onDelete={handleDelete}
          />
        )}
      </div>

      {/* Pagination */}
      {pagination.total > 0 && (
        <div className="flex items-center justify-between border-t border-border/40 px-4 py-3 mt-2">
          <p className="text-xs text-muted-foreground">
            {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} sur{" "}
            {pagination.total.toLocaleString("fr-FR")} correspondances
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline" size="sm" className="h-7 w-7 p-0"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={pagination.page <= 1 || isLoading || pagination.pages <= 1}
              aria-label="Page précédente"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>

            {Array.from({ length: Math.min(pagination.pages, 5) }, (_, i) => {
              let pageNum: number;
              if (pagination.pages <= 5)                          pageNum = i + 1;
              else if (pagination.page <= 3)                      pageNum = i + 1;
              else if (pagination.page >= pagination.pages - 2)   pageNum = pagination.pages - 4 + i;
              else                                                pageNum = pagination.page - 2 + i;
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
              disabled={pagination.page >= pagination.pages || isLoading || pagination.pages <= 1}
              aria-label="Page suivante"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      <TestMappingForm
        open={showForm || !!editingMapping}
        laboratories={laboratories}
        onSubmit={editingMapping ? handleUpdate : handleCreate}
        onClose={() => {
          setShowForm(false);
          setEditingMapping(null);
        }}
        editData={editingMapping || undefined}
      />
    </>
  );
}
