"use client";

import { useEffect, useState } from "react";
import { useDashboardTitle } from "@/hooks/use-dashboard-title";
import EstimatesTable from "@/components/estimates/estimates-table";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";

interface Estimate {
  id: string;
  estimateNumber: string;
  totalPrice: number;
  status: string;
  createdAt: string;
  sentAt: string | null;
  validUntil: string | null;
  customer: { name: string; email: string } | null;
  createdBy: { name: string };
  notes: string | null;
}

export default function EstimatesPage() {
  const router = useRouter();
  useDashboardTitle("Estimations");
  
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deletingId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    loadEstimates();
  }, []);

  const loadEstimates = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/estimates?limit=50");
      const data = await res.json();
      if (data.success) {
        setEstimates(data.data.estimates);
      } else {
        setError(data.message || "Erreur lors du chargement");
      }
    } catch (err) {
      setError("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async (estimateId: string) => {
    setDownloadingId(estimateId);
    try {
      const res = await fetch(`/api/estimates/${estimateId}/pdf`);
      if (!res.ok) throw new Error("Erreur lors du téléchargement");

      const blob = await res.blob();
      const estimate = estimates.find((e) => e.id === estimateId);
      const filename = `estimation-${estimate?.estimateNumber || "document"}.pdf`;

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Erreur lors du téléchargement du PDF");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async (estimateId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette estimation ?")) return;

    setDeleteId(estimateId);
    try {
      const res = await fetch(`/api/estimates/${estimateId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setEstimates((prev) => prev.filter((e) => e.id !== estimateId));
      } else {
        alert("Erreur lors de la suppression");
      }
    } catch (err) {
      alert("Erreur de connexion");
    } finally {
      setDeleteId(null);
    }
  };

  if (loading) {
    return (
      <div className="px-6 py-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-6 py-6">
        <Card className="p-6">
          <p className="text-red-500">{error}</p>
          <Button onClick={loadEstimates} variant="outline" className="mt-4">
            Réessayer
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-6 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Estimations sauvegardées</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Gérez toutes vos estimations de prix créées
          </p>
        </div>
        <Button onClick={() => router.push("/comparison")}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle estimation
        </Button>
      </div>

      <EstimatesTable
        estimates={estimates}
        onDownload={handleDownloadPdf}
        onDelete={handleDelete}
        onNew={() => router.push("/comparison")}
        downloadingId={downloadingId}
        deletingId={deletingId}
      />
    </div>
  );
}
