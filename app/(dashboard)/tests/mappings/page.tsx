"use client";

import { useState } from "react";
import Header from "@/components/dashboard/header";
import TestMappingTable from "@/components/tests/test-mapping-table";
import TestMappingForm from "@/components/tests/test-mapping-form";
import { useTestMappings } from "@/hooks/use-tests";
import { Button } from "@/components/ui/button";

export default function TestMappingsPage() {
  const { mappings, isLoading, error, refetch } = useTestMappings();
  const [showForm, setShowForm] = useState(false);
  const [editingMapping, setEditingMapping] = useState<any>(null);

  const handleCreate = async (data: any) => {
    const res = await fetch("/api/tests/mappings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (result.success) {
      setShowForm(false);
      refetch();
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
      refetch();
    }
    return result;
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette correspondance ?")) return;
    await fetch(`/api/tests/mappings/${id}`, { method: "DELETE" });
    refetch();
  };

  return (
    <>
      <Header title="Correspondances de tests" />
      <div className="flex items-center justify-end mt-4">
        <Button onClick={() => setShowForm(true)}>+ Nouvelle correspondance</Button>
      </div>
      {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
      <div className="mt-6">
        <TestMappingTable
          mappings={mappings}
          isLoading={isLoading}
          onEdit={setEditingMapping}
          onDelete={handleDelete}
        />
      </div>
      {(showForm || editingMapping) && (
        <TestMappingForm
          mapping={editingMapping}
          onSubmit={editingMapping ? handleUpdate : handleCreate}
          onClose={() => {
            setShowForm(false);
            setEditingMapping(null);
          }}
        />
      )}
    </>
  );
}
