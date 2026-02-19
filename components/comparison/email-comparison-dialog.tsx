"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Mail, Loader2, CheckCircle2, AlertTriangle, Zap } from "lucide-react";
import CustomerCombobox from "@/components/customers/customer-combobox";

interface EmailComparisonDialogProps {
  open: boolean;
  onClose: () => void;
  testMappingIds: string[];
  testNames: string[];
  /** Per-test lab selections (testMappingId → labId). When provided, sends as multi-lab selection. */
  selections?: Record<string, string>;
  /** Lab lookup for display in multi-lab mode */
  laboratories?: { id: string; name: string }[];
}

export default function EmailComparisonDialog({
  open,
  onClose,
  testMappingIds,
  testNames,
  selections,
  laboratories,
}: EmailComparisonDialogProps) {
  const [selectedCustomer, setSelectedCustomer] = useState<{
    id: string;
    name: string;
    email: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    cheapestLab?: string;
    totalPrice?: string;
    isMultiLab?: boolean;
  } | null>(null);

  const hasSelections = selections && Object.keys(selections).length > 0;

  const handleSend = async () => {
    if (!selectedCustomer || isLoading) return;
    setIsLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/comparison/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testMappingIds,
          clientEmail: selectedCustomer.email,
          clientName: selectedCustomer.name,
          customerId: selectedCustomer.id,
          selections: hasSelections ? selections : undefined,
        }),
      });

      const data = await res.json();

      if (data.success) {
        const ml = data.data?.multiLabSelection;
        setResult({
          success: true,
          message: data.message,
          cheapestLab: ml
            ? ml.laboratories.map((l: { name: string }) => l.name).join(", ")
            : data.data?.cheapestLaboratory?.name,
          totalPrice: ml
            ? ml.formattedTotalPrice
            : data.data?.cheapestLaboratory?.formattedTotalPrice,
          isMultiLab: !!ml,
        });
      } else {
        setResult({ success: false, message: data.message });
      }
    } catch {
      setResult({ success: false, message: "Erreur de connexion au serveur" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setResult(null);
    setSelectedCustomer(null);
    onClose();
  };

  const isValid = testMappingIds.length > 0 && selectedCustomer !== null;

  const labNameMap = new Map(laboratories?.map((l) => [l.id, l.name]) ?? []);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Envoyer la comparaison par email
          </DialogTitle>
          <DialogDescription>
            {hasSelections
              ? "Envoie la sélection optimisée multi-laboratoires au client."
              : "Compare les prix et envoie automatiquement le meilleur tarif au client."}
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="py-6 text-center space-y-3">
            {result.success ? (
              <>
                <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
                <p className="text-green-400 font-medium">{result.message}</p>
                {result.cheapestLab && (
                  <div className={`${result.isMultiLab ? "bg-blue-900/20 border-blue-800" : "bg-green-900/20 border-green-800"} border rounded-lg p-4 mt-4 text-left`}>
                    <p className={`text-sm ${result.isMultiLab ? "text-blue-300" : "text-green-300"}`}>
                      <span className="font-semibold">
                        {result.isMultiLab ? "Laboratoires :" : "Laboratoire recommandé :"}
                      </span>{" "}
                      {result.cheapestLab}
                    </p>
                    <p className={`text-sm mt-1 ${result.isMultiLab ? "text-blue-300" : "text-green-300"}`}>
                      <span className="font-semibold">Prix total :</span>{" "}
                      {result.totalPrice}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <>
                <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
                <p className="text-red-400 font-medium">{result.message}</p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {hasSelections && (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-blue-500" />
                  <p className="text-xs font-semibold text-blue-400">Sélection optimisée</p>
                </div>
                {testNames.map((name, i) => {
                  const labId = selections![testMappingIds[i]];
                  const labName = labId ? labNameMap.get(labId) : undefined;
                  return (
                    <div key={i} className="flex items-center justify-between text-sm py-0.5">
                      <span className="font-medium">{name}</span>
                      {labName && <Badge variant="outline" className="text-xs">{labName}</Badge>}
                    </div>
                  );
                })}
              </div>
            )}

            {!hasSelections && (
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground font-medium mb-1">
                  Tests sélectionnés
                </p>
                {testNames.map((name, i) => (
                  <p key={i} className="text-sm font-medium">
                    {i + 1}. {name}
                  </p>
                ))}
              </div>
            )}

            <div className="space-y-2">
              <Label>Client *</Label>
              <CustomerCombobox
                selectedCustomer={selectedCustomer}
                onSelect={setSelectedCustomer}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {result ? "Fermer" : "Annuler"}
          </Button>
          {!result && (
            isLoading ? (
              <Button disabled>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>Envoi en cours...</span>
              </Button>
            ) : (
              <Button onClick={handleSend} disabled={!isValid}>
                <Mail className="mr-2 h-4 w-4" />
                <span>{hasSelections ? "Envoyer la sélection" : "Comparer & Envoyer"}</span>
              </Button>
            )
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
