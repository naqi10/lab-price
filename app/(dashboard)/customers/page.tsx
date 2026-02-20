"use client";

import { useState, useRef } from "react";
import { useDashboardTitle } from "@/hooks/use-dashboard-title";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Loader2 } from "lucide-react";
import CustomersTable, { type CustomersTableRef } from "@/components/customers/customers-table";

export default function CustomersPage() {
  useDashboardTitle("Clients");
  const tableRef = useRef<CustomersTableRef>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "" });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const openCreate = () => {
    setEditingId(null);
    setForm({ name: "", email: "", phone: "", company: "" });
    setFormError(null);
    setDialogOpen(true);
  };

  const openEdit = (customer: any) => {
    setEditingId(customer.id);
    setForm({
      name: customer.name,
      email: customer.email,
      phone: customer.phone || "",
      company: customer.company || "",
    });
    setFormError(null);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.email) {
      setFormError("Le nom et l'email sont requis");
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const url = editingId ? `/api/customers/${editingId}` : "/api/customers";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone || null,
          company: form.company || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setDialogOpen(false);
        tableRef.current?.refetch();
      } else {
        setFormError(data.message);
      }
    } catch {
      setFormError("Erreur de connexion");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/customers/${deleteId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setDeleteId(null);
        tableRef.current?.refetch();
      }
    } catch (error) {
      console.error("Error deleting customer:", error);
    }
  };

  return (
    <>
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Supprimer ce client ?"
        description="Cette action est irréversible. Toutes les données associées à ce client seront définitivement supprimées."
        confirmLabel="Supprimer"
        onConfirm={handleDelete}
      />

      <div className="mt-4">
        <CustomersTable
          ref={tableRef}
          onEdit={openEdit}
          onDelete={(id) => setDeleteId(id)}
          onNew={openCreate}
        />
      </div>

      <Dialog open={dialogOpen} onOpenChange={(o) => !o && setDialogOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Modifier le client" : "Nouveau client"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-3">
            {formError && (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5">
                <p className="text-sm text-destructive leading-tight">{formError}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs font-medium">Nom <span className="text-destructive">*</span></Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Nom du client"
                  autoFocus
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs font-medium">Email <span className="text-destructive">*</span></Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="client@example.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Téléphone</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+33 1 23 45 67 89"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Entreprise</Label>
                <Input
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  placeholder="Nom de l'entreprise"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : editingId ? (
                "Mettre à jour"
              ) : (
                "Créer"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
