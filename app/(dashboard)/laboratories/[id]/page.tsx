"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useDashboardTitle } from "@/hooks/use-dashboard-title";
import LabForm from "@/components/laboratories/lab-form";

import PriceListTable from "@/components/laboratories/price-list-table";
import { useLaboratory } from "@/hooks/use-laboratories";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ArrowLeft, Trash2 } from "lucide-react";

export default function LaboratoryDetailPage() {
   const params = useParams();
   const router = useRouter();
   const id = params.id as string;
   const { laboratory, isLoading, error } = useLaboratory(id);
   const [priceLists, setPriceLists] = useState<any[]>([]);
   const [priceListsLoading, setPriceListsLoading] = useState(true);
   const [showDeleteLab, setShowDeleteLab] = useState(false);
   const [deletingPriceListId, setDeletingPriceListId] = useState<string | null>(null);
   useDashboardTitle(laboratory?.name || "Laboratoire");

  const fetchPriceLists = async () => {
    setPriceListsLoading(true);
    try {
      const res = await fetch(`/api/laboratories/${id}/price-lists`);
      const data = await res.json();
      if (data.success) setPriceLists(data.data || []);
    } finally {
      setPriceListsLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchPriceLists();
  }, [id]);

  const handleUpdate = async (data: any) => {
    const res = await fetch(`/api/laboratories/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return await res.json();
  };

  const handleDelete = async () => {
    const res = await fetch(`/api/laboratories/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) router.push("/laboratories");
  };

  const handleDeletePriceList = async () => {
    if (!deletingPriceListId) return;
    await fetch(`/api/laboratories/${id}/price-lists/${deletingPriceListId}`, { method: "DELETE" });
    setDeletingPriceListId(null);
    fetchPriceLists();
  };

  if (isLoading) return <Skeleton className="h-96" />;
  if (error) return <p className="text-red-400">{error}</p>;

   return (
     <>
       <div className="flex items-center justify-between mt-4">
        <Button variant="ghost" onClick={() => router.push("/laboratories")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Retour
        </Button>
        <Button variant="destructive" size="sm" onClick={() => setShowDeleteLab(true)}>
          <Trash2 className="mr-2 h-4 w-4" /> Supprimer
        </Button>
      </div>

      <ConfirmDialog
        open={showDeleteLab}
        onOpenChange={setShowDeleteLab}
        title="Supprimer ce laboratoire ?"
        description="Toutes les listes de prix et correspondances associées seront définitivement supprimées."
        confirmLabel="Supprimer"
        onConfirm={handleDelete}
      />
      <ConfirmDialog
        open={!!deletingPriceListId}
        onOpenChange={(o) => !o && setDeletingPriceListId(null)}
        title="Supprimer cette liste de prix ?"
        description="Cette liste de prix et tous ses tests importés seront définitivement supprimés."
        confirmLabel="Supprimer"
        onConfirm={handleDeletePriceList}
      />
      <Tabs defaultValue="info" className="mt-4">
        <TabsList>
          <TabsTrigger value="info">Informations</TabsTrigger>
          <TabsTrigger value="pricelists">Listes de prix</TabsTrigger>
        </TabsList>
        <TabsContent value="info" className="max-w-2xl">
          <LabForm defaultValues={laboratory} onSubmit={handleUpdate} />
        </TabsContent>
        <TabsContent value="pricelists">
          {priceListsLoading ? (
            <p className="text-center text-muted-foreground py-8">Chargement...</p>
          ) : (
            <PriceListTable
              labId={id}
              priceLists={priceLists}
              onDelete={(listId) => setDeletingPriceListId(listId)}
              onActivate={fetchPriceLists}
            />
          )}
        </TabsContent>
      </Tabs>
    </>
  );
}
