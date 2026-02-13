"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Mail, Loader2 } from "lucide-react";

export default function EmailDialog({ open, onClose, quotationId, defaultTo }: { open: boolean; onClose: () => void; quotationId: string; defaultTo?: string }) {
  const [to, setTo] = useState(defaultTo || "");
  const [subject, setSubject] = useState("Votre devis - Lab Price Comparator");
  const [message, setMessage] = useState("Veuillez trouver ci-joint votre devis.");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSend = async () => {
    setIsLoading(true);
    try { const res = await fetch(`/api/quotations/${quotationId}/email`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ to, subject, message }) }); if (res.ok) { setSuccess(true); setTimeout(() => { setSuccess(false); onClose(); }, 2000); } }
    finally { setIsLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Mail className="h-5 w-5" /> Envoyer le devis par email</DialogTitle></DialogHeader>
        {success ? <div className="text-center py-6 text-green-600 font-medium">Email envoyé avec succès !</div> : (
          <div className="space-y-4">
            <div className="space-y-2"><Label>Destinataire *</Label><Input type="email" value={to} onChange={e => setTo(e.target.value)} placeholder="client@example.com" /></div>
            <div className="space-y-2"><Label>Sujet</Label><Input value={subject} onChange={e => setSubject(e.target.value)} /></div>
            <div className="space-y-2"><Label>Message</Label><Textarea value={message} onChange={e => setMessage(e.target.value)} rows={4} /></div>
          </div>
        )}
        <DialogFooter><Button variant="outline" onClick={onClose}>Annuler</Button><Button onClick={handleSend} disabled={isLoading || !to}>{isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Envoi...</> : "Envoyer"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
