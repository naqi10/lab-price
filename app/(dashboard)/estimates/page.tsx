"use client";

import { useState } from "react";
import { useDashboardTitle } from "@/hooks/use-dashboard-title";
import EstimatesTable from "@/components/estimates/estimates-table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { Plus, Send } from "lucide-react";

export default function EstimatesPage() {
  const router = useRouter();
  useDashboardTitle("Estimations");

  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Multi-select state
  const [selectedEstimates, setSelectedEstimates] = useState<Set<string>>(new Set());
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [availableCustomers, setAvailableCustomers] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);

  const handleDownloadPdf = async (estimateId: string) => {
    setDownloadingId(estimateId);
    try {
      const res = await fetch(`/api/estimates/${estimateId}/pdf`);
      if (!res.ok) throw new Error("Erreur lors du téléchargement");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `estimation-${estimateId}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Erreur lors du téléchargement du PDF");
    } finally {
      setDownloadingId(null);
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
    // Note: select-all only works for currently visible page — the table owns the data
    // For now, toggle the set. A more robust approach would pass visible IDs from the table.
    if (!all) {
      setSelectedEstimates(new Set());
    }
  };

  const handleOpenSendDialog = async () => {
    setShowSendDialog(true);
    try {
      const res = await fetch("/api/customers");
      const data = await res.json();
      if (data.success) {
        setAvailableCustomers(data.data.customers || []);
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

  return (
    <>
      {/* Top action bar — matches tests page pattern */}
      <div className="flex items-center justify-between mt-4">
        <div>
          {selectedEstimates.size > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-muted-foreground">
                {selectedEstimates.size} sélectionnée{selectedEstimates.size > 1 ? "s" : ""}
              </span>
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
              >
                <Send className="h-4 w-4" />
                Envoyer à des clients
              </Button>
            </div>
          )}
        </div>
        <Button onClick={() => router.push("/tests")}>
          <Plus className="h-4 w-4" />
          Nouvelle estimation
        </Button>
      </div>

      {/* Table — full width, matches tests page grid */}
      <div className="mt-4">
        <EstimatesTable
          onDownload={handleDownloadPdf}
          downloadingId={downloadingId}
          selectedEstimates={selectedEstimates}
          onSelectEstimate={handleSelectEstimate}
          onSelectAll={handleSelectAllEstimates}
        />
      </div>

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
    </>
  );
}
