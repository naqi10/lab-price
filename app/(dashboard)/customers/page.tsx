"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/dashboard/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useCustomers } from "@/hooks/use-customers";
import { useDebounce } from "@/hooks/use-debounce";
import { Contact, Plus, Pencil, Trash2, Loader2 } from "lucide-react";

export default function CustomersPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const { customers, isLoading, error, refetch } = useCustomers(debouncedSearch);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "" });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

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
        refetch();
      } else {
        setFormError(data.message);
      }
    } catch {
      setFormError("Erreur de connexion");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce client ?")) return;
    try {
      const res = await fetch(`/api/customers/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) refetch();
    } catch {
      /* ignore */
    }
  };

  return (
    <>
      <Header title="Clients" />
      <div className="flex items-center justify-between mt-6 gap-4">
        <Input
          placeholder="Rechercher un client..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nouveau client
        </Button>
      </div>

      <div className="mt-6">
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Contact className="h-5 w-5" />
              Liste des clients
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : customers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                Aucun client trouvé.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Téléphone</TableHead>
                    <TableHead>Entreprise</TableHead>
                    <TableHead>Devis</TableHead>
                    <TableHead>Emails envoyés</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((c: any) => (
                    <TableRow key={c.id}>
                      <TableCell
                        className="font-medium cursor-pointer hover:underline"
                        onClick={() => router.push(`/customers/${c.id}`)}
                      >
                        {c.name}
                      </TableCell>
                      <TableCell>{c.email}</TableCell>
                      <TableCell>{c.phone || "—"}</TableCell>
                      <TableCell>{c.company || "—"}</TableCell>
                      <TableCell>{c._count?.quotations ?? 0}</TableCell>
                      <TableCell>{c._count?.emailLogs ?? 0}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEdit(c)}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(c.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={(o) => !o && setDialogOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Modifier le client" : "Nouveau client"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {formError && (
              <p className="text-sm text-red-500">{formError}</p>
            )}
            <div className="space-y-2">
              <Label>Nom *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Nom du client"
              />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="client@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Téléphone</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+33 1 23 45 67 89"
              />
            </div>
            <div className="space-y-2">
              <Label>Entreprise</Label>
              <Input
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                placeholder="Nom de l'entreprise"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
