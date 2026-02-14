"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Mail, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";

interface EmailComparisonDialogProps {
  open: boolean;
  onClose: () => void;
  testMappingIds: string[];
  testNames: string[];
}

export default function EmailComparisonDialog({
  open,
  onClose,
  testMappingIds,
  testNames,
}: EmailComparisonDialogProps) {
  const [clientEmail, setClientEmail] = useState("");
  const [clientName, setClientName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    cheapestLab?: string;
    totalPrice?: string;
  } | null>(null);

  const handleSend = async () => {
    if (!clientEmail) return;
    setIsLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/comparison/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testMappingIds,
          clientEmail,
          clientName: clientName || undefined,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setResult({
          success: true,
          message: data.message,
          cheapestLab: data.data?.cheapestLaboratory?.name,
          totalPrice: data.data?.cheapestLaboratory?.formattedTotalPrice,
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
    setClientEmail("");
    setClientName("");
    onClose();
  };

  const isValid = testMappingIds.length > 0 && clientEmail.includes("@");

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Envoyer la comparaison par email
          </DialogTitle>
          <DialogDescription>
            Compare les prix et envoie automatiquement le meilleur tarif au
            client.
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="py-6 text-center space-y-3">
            {result.success ? (
              <>
                <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
                <p className="text-green-400 font-medium">{result.message}</p>
                {result.cheapestLab && (
                  <div className="bg-green-900/20 border border-green-800 rounded-lg p-4 mt-4 text-left">
                    <p className="text-sm text-green-300">
                      <span className="font-semibold">Laboratoire recommandé :</span>{" "}
                      {result.cheapestLab}
                    </p>
                    <p className="text-sm text-green-300 mt-1">
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

            <div className="space-y-2">
              <Label htmlFor="clientEmail">Email du client *</Label>
              <Input
                id="clientEmail"
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="client@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientName">Nom du client (optionnel)</Label>
              <Input
                id="clientName"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Nom du destinataire"
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
                <span>Comparaison en cours...</span>
              </Button>
            ) : (
              <Button onClick={handleSend} disabled={!isValid}>
                <Mail className="mr-2 h-4 w-4" />
                <span>Comparer &amp; Envoyer</span>
              </Button>
            )
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
