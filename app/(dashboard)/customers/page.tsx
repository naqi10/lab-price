"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDashboardTitle } from "@/hooks/use-dashboard-title";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useCustomers } from "@/hooks/use-customers";
import { useDebounce } from "@/hooks/use-debounce";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Contact, Plus, Pencil, Trash2, Loader2 } from "lucide-react";

export default function CustomersPage() {
   const router = useRouter();
   const [search, setSearch] = useState("");
   const debouncedSearch = useDebounce(search, 300);
   const { customers, isLoading, error, refetch } = useCustomers(debouncedSearch);
   useDashboardTitle("Clients");

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

  const handleDelete = async () => {
    if (!deleteId) return;
    const res = await fetch(`/api/customers/${deleteId}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) {
      setDeleteId(null);
      refetch();
    }
  };

   return (
     <>
       <div className="flex items-center justify-between mt-4 gap-3">
        <div className="relative max-w-sm flex-1">
          <Contact className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Rechercher un client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
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
              <div className="flex flex-col items-center justify-center py-14 gap-3">
                <div className="h-12 w-12 rounded-full bg-muted/40 border border-border/50 flex items-center justify-center">
                  <Contact className="h-5 w-5 text-muted-foreground/60" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground/70">
                    {search ? "Aucun client trouvé" : "Aucun client pour le moment"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {search ? "Essayez un autre terme de recherche" : "Ajoutez votre premier client pour commencer"}
                  </p>
                </div>
                {!search && (
                  <button
                    onClick={openCreate}
                    className="mt-1 inline-flex items-center gap-1.5 rounded-md border border-border/60 px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Nouveau client
                  </button>
                )}
              </div>
            ) : (
              <TooltipProvider>
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
                     <TableRow 
                       key={c.id}
                       className="cursor-pointer hover:bg-muted/50 transition-colors"
                       onClick={() => router.push(`/customers/${c.id}`)}
                     >
                       <TableCell className="font-medium">{c.name}</TableCell>
                       <TableCell className="text-muted-foreground">{c.email}</TableCell>
                       <TableCell className="text-muted-foreground">{c.phone || "—"}</TableCell>
                       <TableCell className="text-muted-foreground">{c.company || "—"}</TableCell>
                       <TableCell>
                         <span className="inline-flex items-center justify-center h-6 min-w-[1.5rem] rounded-full bg-primary/10 text-primary text-xs font-medium px-2">
                           {c._count?.quotations ?? 0}
                         </span>
                       </TableCell>
                       <TableCell>
                         <span className="text-muted-foreground text-sm">{c._count?.emailLogs ?? 0}</span>
                       </TableCell>
                       <TableCell className="text-right">
                         <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                           <Tooltip>
                             <TooltipTrigger asChild>
                               <Button variant="ghost" size="sm" onClick={() => openEdit(c)}>
                                 <Pencil className="h-3.5 w-3.5" />
                               </Button>
                             </TooltipTrigger>
                             <TooltipContent>Modifier</TooltipContent>
                           </Tooltip>
                           <Tooltip>
                             <TooltipTrigger asChild>
                               <Button
                                 variant="ghost"
                                 size="sm"
                                 onClick={() => setDeleteId(c.id)}
                                 className="text-destructive hover:text-destructive hover:bg-destructive/10"
                               >
                                 <Trash2 className="h-3.5 w-3.5" />
                               </Button>
                             </TooltipTrigger>
                             <TooltipContent>Supprimer</TooltipContent>
                           </Tooltip>
                         </div>
                       </TableCell>
                     </TableRow>
                   ))}
                 </TableBody>
              </Table>
              </TooltipProvider>
            )}
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Supprimer ce client ?"
        description="Cette action est irréversible. Toutes les données associées à ce client seront définitivement supprimées."
        confirmLabel="Supprimer"
        onConfirm={handleDelete}
      />

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
