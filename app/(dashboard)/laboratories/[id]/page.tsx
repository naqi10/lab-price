"use client";

import { useParams, useRouter } from "next/navigation";
import Header from "@/components/dashboard/header";
import LabForm from "@/components/laboratories/lab-form";
import PriceListUpload from "@/components/laboratories/price-list-upload";
import PriceListTable from "@/components/laboratories/price-list-table";
import { useLaboratory } from "@/hooks/use-laboratories";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function LaboratoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { laboratory, isLoading, error } = useLaboratory(id);
  const [priceLists, setPriceLists] = useState<any[]>([]);
  const [priceListsLoading, setPriceListsLoading] = useState(true);

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

  useState(() => {
    if (id) fetchPriceLists();
  });

  const handleUpdate = async (data: any) => {
    const res = await fetch(`/api/laboratories/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return await res.json();
  };

  const handleDelete = async () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce laboratoire ?")) return;
    const res = await fetch(`/api/laboratories/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) router.push("/laboratories");
  };

  if (isLoading) return <Skeleton className="h-96" />;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <>
      <div className="flex items-center justify-between">
        <Header title={laboratory?.name || "Laboratoire"} />
        <Button variant="destructive" onClick={handleDelete}>
          Supprimer
        </Button>
      </div>
      <Tabs defaultValue="info" className="mt-6">
        <TabsList>
          <TabsTrigger value="info">Informations</TabsTrigger>
          <TabsTrigger value="pricelists">Listes de prix</TabsTrigger>
          <TabsTrigger value="upload">Importer</TabsTrigger>
        </TabsList>
        <TabsContent value="info" className="max-w-2xl">
          <LabForm laboratory={laboratory} onSubmit={handleUpdate} />
        </TabsContent>
        <TabsContent value="pricelists">
          <PriceListTable
            priceLists={priceLists}
            isLoading={priceListsLoading}
            laboratoryId={id}
            onRefresh={fetchPriceLists}
          />
        </TabsContent>
        <TabsContent value="upload">
          <PriceListUpload laboratoryId={id} onUploadComplete={fetchPriceLists} />
        </TabsContent>
      </Tabs>
    </>
  );
}
