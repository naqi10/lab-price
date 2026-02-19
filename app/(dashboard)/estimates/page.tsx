"use client";

import { useEffect, useState } from "react";
import { useDashboardTitle } from "@/hooks/use-dashboard-title";
import EstimatesTable from "@/components/estimates/estimates-table";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { Plus, Loader2, Send, X } from "lucide-react";

interface TestMappingEntry {
  id: string;
  localTestName: string;
  laboratory: { id: string; name: string };
  price?: number | null;
}

interface TestMappingDetail {
  id: string;
  canonicalName: string;
  entries: TestMappingEntry[];
}

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
  testMappingIds: string[];
  selections?: Record<string, string> | null;
  customPrices?: Record<string, number>;
  testMappingDetails?: TestMappingDetail[];
}

export default function EstimatesPage() {
  const router = useRouter();
  useDashboardTitle("Estimations");
  
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deletingId, setDeleteId] = useState<string | null>(null);
  
  // Multi-select state
  const [selectedEstimates, setSelectedEstimates] = useState<Set<string>>(new Set());
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [availableCustomers, setAvailableCustomers] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);

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

  const handleSelectEstimate = (estimateId: string) => {
    setSelectedEstimates((prev) => {
      const updated = new Set(prev);
      if (updated.has(estimateId)) {
        updated.delete(estimateId);
      } else {
        updated.add(estimateId);
      }
      return updated;
    });
  };

  const handleSelectAllEstimates = (all: boolean) => {
    if (all) {
      setSelectedEstimates(new Set(estimates.map((e) => e.id)));
    } else {
      setSelectedEstimates(new Set());
    }
  };

  const handleOpenSendDialog = async () => {
    setShowSendDialog(true);
    // Fetch all customers for selection
    try {
      const res = await fetch("/api/customers");
      const data = await res.json();
      if (data.success) {
        setAvailableCustomers(data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch customers", err);
    }
  };

  const handleSendEstimates = async () => {
    if (selectedCustomers.size === 0) {
      alert("Veuillez sélectionner au moins un client");
      return;
    }

    setSending(true);
    try {
      const customerIds = Array.from(selectedCustomers);
      
      // Send each selected estimate to selected customers
      for (const estimateId of selectedEstimates) {
        const res = await fetch(`/api/estimates/${estimateId}/resend`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ customerIds }),
        });
        
        if (!res.ok) {
          throw new Error(`Failed to send estimate ${estimateId}`);
        }
      }
      
      alert(`${selectedEstimates.size} estimation(s) envoyée(s) à ${selectedCustomers.size} client(s)`);
      setSelectedEstimates(new Set());
      setSelectedCustomers(new Set());
      setShowSendDialog(false);
    } catch (err) {
      alert("Erreur lors de l'envoi des estimations");
      console.error(err);
    } finally {
      setSending(false);
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
      {/* Selection toolbar */}
      {selectedEstimates.size > 0 && (
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
          <span className="text-sm font-medium text-blue-900">
            {selectedEstimates.size} estimation{selectedEstimates.size > 1 ? "s" : ""} sélectionnée{selectedEstimates.size > 1 ? "s" : ""}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedEstimates(new Set())}
            >
              Désélectionner
            </Button>
            <Button
              size="sm"
              onClick={handleOpenSendDialog}
              disabled={selectedEstimates.size === 0}
            >
              <Send className="mr-2 h-4 w-4" />
              Envoyer à des clients
            </Button>
          </div>
        </div>
      )}

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
        selectedEstimates={selectedEstimates}
        onSelectEstimate={handleSelectEstimate}
        onSelectAll={handleSelectAllEstimates}
      />

      {/* Send dialog */}
      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Envoyer les estimations à des clients</DialogTitle>
            <DialogDescription>
              Sélectionnez les clients auxquels vous souhaitez envoyer les {selectedEstimates.size} estimation(s) sélectionnée(s)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="search">Chercher un client</Label>
              <Input
                id="search"
                placeholder="Nom ou email..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                className="mt-1"
              />
            </div>

            <div className="border rounded-lg p-3 space-y-2 max-h-64 overflow-y-auto">
              {availableCustomers
                .filter((c) =>
                  c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
                  c.email.toLowerCase().includes(customerSearch.toLowerCase())
                )
                .map((customer) => (
                  <label
                    key={customer.id}
                    className="flex items-center gap-2 p-2 hover:bg-muted rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCustomers.has(customer.id)}
                      onChange={(e) => {
                        setSelectedCustomers((prev) => {
                          const updated = new Set(prev);
                          if (e.target.checked) {
                            updated.add(customer.id);
                          } else {
                            updated.delete(customer.id);
                          }
                          return updated;
                        });
                      }}
                      className="rounded"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{customer.name}</div>
                      <div className="text-xs text-muted-foreground">{customer.email}</div>
                    </div>
                  </label>
                ))}
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowSendDialog(false)}
                disabled={sending}
              >
                Annuler
              </Button>
              <Button
                onClick={handleSendEstimates}
                disabled={sending || selectedCustomers.size === 0}
              >
                {sending ? "Envoi en cours..." : "Envoyer"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
