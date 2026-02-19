"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/dashboard/header";
import TestMappingTable from "@/components/tests/test-mapping-table";
import TestMappingForm from "@/components/tests/test-mapping-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Search } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";

export default function TestMappingsPage() {
  const [mappings, setMappings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingMapping, setEditingMapping] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [laboratories, setLaboratories] = useState<{ id: string; name: string }[]>([]);

  // Search & filter state
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [filterLab, setFilterLab] = useState("");

  const fetchMappings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("search", debouncedSearch);
      const url = `/api/tests/mappings${params.toString() ? `?${params}` : ""}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) setMappings(data.data.items || data.data || []);
      else setError(data.message);
    } catch {
      setError("Erreur lors du chargement");
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => { fetchMappings(); }, [fetchMappings]);

  useEffect(() => {
    fetch("/api/laboratories")
      .then((r) => r.json())
      .then((d) => { if (d.success) setLaboratories(d.data); })
      .catch(console.error);
  }, []);

  // Filter mappings by selected laboratory (client-side)
  const filteredMappings = filterLab
    ? mappings.filter((m) =>
        m.entries?.some((e: any) =>
          (e.laboratoryId === filterLab) || (e.laboratory?.id === filterLab)
        )
      )
    : mappings;

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
      <Header title="Correspondances de tests" />
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
            mappings={filteredMappings}
            onEdit={setEditingMapping}
            onDelete={handleDelete}
          />
        )}
      </div>

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
