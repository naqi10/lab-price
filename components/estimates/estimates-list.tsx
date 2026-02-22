"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download, Mail, Edit2, Trash2, Loader2, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

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

interface EstimatesListProps {
  onRefresh?: () => void;
}

export default function EstimatesList({ onRefresh }: EstimatesListProps) {
  const router = useRouter();
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

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
    setDownloading(estimateId);
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
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Erreur lors du téléchargement du PDF");
    } finally {
      setDownloading(null);
    }
  };

  const handleDelete = async (estimateId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette estimation ?")) return;

    setDeleting(estimateId);
    try {
      const res = await fetch(`/api/estimates/${estimateId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setEstimates((prev) => prev.filter((e) => e.id !== estimateId));
        if (onRefresh) onRefresh();
      } else {
        alert("Erreur lors de la suppression");
      }
    } catch (err) {
      alert("Erreur de connexion");
    } finally {
      setDeleting(null);
    }
  };

  const handleMarkAsSent = async (estimateId: string) => {
    try {
      const res = await fetch(`/api/estimates/${estimateId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "SENT" }),
      });
      if (res.ok) {
        const data = await res.json();
        setEstimates((prev) =>
          prev.map((e) => (e.id === estimateId ? data.data : e))
        );
      } else {
        alert("Erreur lors de la mise à jour");
      }
    } catch (err) {
      alert("Erreur de connexion");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <p className="text-red-500">{error}</p>
        <Button onClick={loadEstimates} variant="outline" className="mt-4">
          Réessayer
        </Button>
      </Card>
    );
  }

  if (estimates.length === 0) {
    return (
      <Card className="p-12 text-center">
        <p className="text-muted-foreground">Aucune estimation créée pour le moment</p>
        <p className="text-sm text-muted-foreground mt-2">
          Créez une estimation depuis la page de comparaison des prix
        </p>
      </Card>
    );
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      DRAFT: "secondary",
      SENT: "default",
      ACCEPTED: "default",
      REJECTED: "destructive",
    };
    const labels: Record<string, string> = {
      DRAFT: "Brouillon",
      SENT: "Envoyé",
      ACCEPTED: "Accepté",
      REJECTED: "Rejeté",
    };
    return (
      <Badge variant={variants[status] || "secondary"}>
        {labels[status] || status}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Numéro</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Créé le</TableHead>
              <TableHead>Prix</TableHead>
              <TableHead>Validité</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
           <TableBody>
             {estimates.map((estimate) => {
               const isExpired =
                 estimate.validUntil && new Date(estimate.validUntil) < new Date();
               return (
                 <TableRow 
                   key={estimate.id} 
                   className={cn(
                     "cursor-pointer hover:bg-muted/50 transition-colors",
                     isExpired ? "opacity-50" : ""
                   )}
                   onClick={() => router.push(`/estimates/${estimate.id}`)}
                 >
                   <TableCell className="font-medium">
                     {estimate.estimateNumber}
                     {isExpired && (
                       <span className="ml-2 text-xs text-red-600">(Expiré)</span>
                     )}
                   </TableCell>
                   <TableCell>
                     <div>
                       <p className="font-medium">
                         {estimate.customer?.name || "—"}
                       </p>
                       <p className="text-sm text-muted-foreground">
                         {estimate.customer?.email || ""}
                       </p>
                     </div>
                   </TableCell>
                   <TableCell className="text-sm">
                     {formatDate(new Date(estimate.createdAt))}
                   </TableCell>
                   <TableCell className="font-medium">
                     {formatCurrency(estimate.totalPrice)}
                   </TableCell>
                   <TableCell className="text-sm">
                     {estimate.validUntil
                       ? formatDate(new Date(estimate.validUntil))
                       : "—"}
                   </TableCell>
                   <TableCell>{getStatusBadge(estimate.status)}</TableCell>
                   <TableCell className="text-right">
                     <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                       <Button
                         variant="ghost"
                         size="sm"
                         onClick={() => handleDownloadPdf(estimate.id)}
                         disabled={downloading === estimate.id}
                         title="Télécharger PDF"
                       >
                         {downloading === estimate.id ? (
                           <Loader2 className="h-4 w-4 animate-spin" />
                         ) : (
                           <Download className="h-4 w-4" />
                         )}
                       </Button>
                       {estimate.status === "DRAFT" && (
                         <Button
                           variant="ghost"
                           size="sm"
                           onClick={() => handleMarkAsSent(estimate.id)}
                           title="Marquer comme envoyé"
                         >
                           <Mail className="h-4 w-4" />
                         </Button>
                       )}
                       <Button
                         variant="ghost"
                         size="sm"
                         onClick={() => handleDelete(estimate.id)}
                         disabled={deleting === estimate.id}
                         className="text-red-600 hover:text-red-700"
                         title="Supprimer"
                       >
                         {deleting === estimate.id ? (
                           <Loader2 className="h-4 w-4 animate-spin" />
                         ) : (
                           <Trash2 className="h-4 w-4" />
                         )}
                       </Button>
                     </div>
                   </TableCell>
                 </TableRow>
               );
             })}
           </TableBody>
        </Table>
      </div>
    </div>
  );
}
