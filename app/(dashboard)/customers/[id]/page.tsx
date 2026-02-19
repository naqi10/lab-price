"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useDashboardTitle } from "@/hooks/use-dashboard-title";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatCurrency } from "@/lib/utils";
import { ExpandableEstimateRow } from "@/components/estimates/expandable-estimate-row";
import ExpandableEmailRow from "@/components/email/expandable-email-row";
import { ArrowLeft, Pencil, Save, X, Mail, FileText, Loader2 } from "lucide-react";

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

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  createdAt: string;
  _count: { emailLogs: number; estimates: number };
}

interface EmailHistoryItem {
  id: string;
  toEmail: string;
  subject: string;
  status: string;
  source: string;
  error: string | null;
  createdAt: string;
  estimateNumber?: string | null;
  estimateId?: string | null;
  estimate?: {
    testMappingIds: string[];
    selections?: Record<string, string> | null;
    customPrices?: Record<string, number>;
    testMappingDetails?: TestMappingDetail[];
  };
}

interface EstimateHistoryItem {
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

const statusMap: Record<string, { label: string; variant: "default" | "destructive" | "secondary" }> = {
  SENT: { label: "Envoyé", variant: "default" },
  FAILED: { label: "Échoué", variant: "destructive" },
  PENDING: { label: "En attente", variant: "secondary" },
};

const estimateStatusMap: Record<string, { label: string; variant: "default" | "destructive" | "secondary" | "outline" }> = {
  DRAFT: { label: "Brouillon", variant: "secondary" },
  SENT: { label: "Envoyé", variant: "default" },
  ACCEPTED: { label: "Accepté", variant: "default" },
  REJECTED: { label: "Rejeté", variant: "destructive" },
};

const getStatusBadge = (status: string) => {
  const st = estimateStatusMap[status] || estimateStatusMap.DRAFT;
  return (
    <Badge variant={st.variant as "default" | "destructive" | "secondary" | "outline"}>
      {st.label}
    </Badge>
  );
};

const sourceMap: Record<string, string> = {
  comparison: "Comparaison",
  estimate: "Estimation",
  system: "Système",
};

type TimelineItem = 
  | { type: "email"; data: EmailHistoryItem; timestamp: number }
  | { type: "estimate"; data: EstimateHistoryItem; timestamp: number };

const getTimelineTimestamp = (item: TimelineItem): number => {
  if (item.type === "email") {
    return new Date(item.data.createdAt).getTime();
  }
  return new Date(item.data.sentAt || item.data.createdAt).getTime();
};

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
   const { id } = use(params);
   const router = useRouter();

   const [customer, setCustomer] = useState<Customer | null>(null);
   const [history, setHistory] = useState<EmailHistoryItem[]>([]);
   const [estimates, setEstimates] = useState<EstimateHistoryItem[]>([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);

   const [editing, setEditing] = useState(false);
   const [form, setForm] = useState({ name: "", email: "", phone: "", company: "" });
   const [saving, setSaving] = useState(false);
   const [saveError, setSaveError] = useState<string | null>(null);
   
   // Resend state
   const [resendingId, setResendingId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`/api/customers/${id}`).then((r) => r.json()),
      fetch(`/api/customers/${id}/history`).then((r) => r.json()),
      fetch(`/api/estimates?customerId=${id}&limit=50`).then((r) => r.json()),
    ])
      .then(([customerRes, historyRes, estimatesRes]) => {
        if (customerRes.success) {
          setCustomer(customerRes.data);
          setForm({
            name: customerRes.data.name,
            email: customerRes.data.email,
            phone: customerRes.data.phone || "",
            company: customerRes.data.company || "",
          });
        } else {
          setError(customerRes.message);
        }
        if (historyRes.success) setHistory(historyRes.data);
        if (estimatesRes.success) setEstimates(estimatesRes.data.estimates || []);
      })
      .catch(() => setError("Erreur de connexion"))
      .finally(() => setLoading(false));
  }, [id]);

  useDashboardTitle(customer?.name || "Détail client");

   const handleSave = async () => {
     setSaving(true);
     setSaveError(null);
     try {
       const res = await fetch(`/api/customers/${id}`, {
         method: "PUT",
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
         setCustomer(data.data);
         setEditing(false);
       } else {
         setSaveError(data.message);
       }
     } catch {
       setSaveError("Erreur de connexion");
     } finally {
       setSaving(false);
     }
   };

   const handleResendEmail = async (emailId: string) => {
   const email = history.find((e) => e.id === emailId);
      if (!email || !email.estimateId) {
        alert("Impossible de renvoyer cet email");
        return;
      }

      setResendingId(emailId);
      try {
        const res = await fetch(`/api/estimates/${email.estimateId}/resend`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ customerIds: [id] }),
        });

       if (res.ok) {
         alert("Email renvoyé avec succès");
       } else {
         alert("Erreur lors du renvoi de l'email");
       }
     } catch (err) {
       alert("Erreur de connexion");
       console.error(err);
     } finally {
       setResendingId(null);
     }
   };

   if (loading) {
     return (
       <>
         <div className="flex justify-center py-12">
           <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
         </div>
       </>
     );
   }

   if (error || !customer) {
     return (
       <>
         <p className="text-red-500 mt-6">{error || "Client non trouvé"}</p>
       </>
     );
   }

   return (
     <>
       <div className="mt-4">
        <Button variant="ghost" size="sm" onClick={() => router.push("/customers")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour à la liste
        </Button>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Customer info */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Informations</CardTitle>
            {!editing ? (
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                <Pencil className="mr-1 h-3 w-3" /> Modifier
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => { setEditing(false); setSaveError(null); }}>
                  <X className="mr-1 h-3 w-3" /> Annuler
                </Button>
                <Button size="sm" onClick={handleSave} disabled={saving}>
                  <Save className="mr-1 h-3 w-3" /> {saving ? "..." : "Enregistrer"}
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {saveError && <p className="text-sm text-red-500 mb-3">{saveError}</p>}
            {editing ? (
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">Nom</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Email</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Téléphone</Label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Entreprise</Label>
                  <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Email</span>
                  <span className="text-sm font-medium">{customer.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Téléphone</span>
                  <span className="text-sm font-medium">{customer.phone || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Entreprise</span>
                  <span className="text-sm font-medium">{customer.company || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Créé le</span>
                  <span className="text-sm font-medium">{formatDate(customer.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Emails envoyés</span>
                  <span className="text-sm font-medium">{customer._count.emailLogs}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

         {/* Stats */}
         <Card>
           <CardHeader>
             <CardTitle className="text-base flex items-center gap-2">
               <Mail className="h-4 w-4" />
               Résumé
             </CardTitle>
           </CardHeader>
           <CardContent>
             <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
               <div className="text-center">
                 <p className="text-2xl font-bold">{estimates.length}</p>
                 <p className="text-xs text-muted-foreground">Estimations</p>
               </div>
               <div className="text-center">
                 <p className="text-2xl font-bold">{history.length}</p>
                 <p className="text-xs text-muted-foreground">Emails</p>
               </div>
               <div className="text-center">
                 <p className="text-2xl font-bold text-green-600">
                   {history.filter((h) => h.status === "SENT").length}
                 </p>
                 <p className="text-xs text-muted-foreground">Envoyés</p>
               </div>
               <div className="text-center">
                 <p className="text-2xl font-bold text-red-600">
                   {history.filter((h) => h.status === "FAILED").length}
                 </p>
                 <p className="text-xs text-muted-foreground">Échoués</p>
               </div>
             </div>
           </CardContent>
         </Card>
      </div>

       {/* Combined Timeline */}
       <Card className="mt-6">
         <CardHeader>
           <CardTitle className="text-base flex items-center gap-2">
             <Mail className="h-4 w-4" />
             Historique combiné
           </CardTitle>
         </CardHeader>
         <CardContent>
           {history.length === 0 && estimates.length === 0 ? (
             <p className="text-sm text-muted-foreground text-center py-6">
               Aucune activité pour ce client.
             </p>
           ) : (
             <div className="space-y-0 border rounded-lg overflow-hidden">
               {history.map((item, idx) => {
                 if (item.source === "comparison" || item.source === "estimate" || item.source === "system") {
                   // This is an email item
                   const emailItem = item as EmailHistoryItem;
                   return (
                      <ExpandableEmailRow
                        key={emailItem.id}
                        email={{
                          id: emailItem.id,
                          toEmail: emailItem.toEmail,
                          subject: emailItem.subject,
                          status: (emailItem.status as "SENT" | "FAILED"),
                          error: emailItem.error,
                          source: emailItem.source,
                          createdAt: new Date(emailItem.createdAt),
                          estimate: (emailItem as any).estimate,
                        }}
                        onResend={() => handleResendEmail(emailItem.id)}
                        resendingId={resendingId}
                      />
                   );
                 }
                 return null;
               })}
               
               {estimates.map((est) => (
                 <div key={est.id} className="border-b last:border-b-0 hover:bg-muted/30 transition-colors">
                   <ExpandableEstimateRow
                     estimate={est}
                     getStatusBadge={getStatusBadge}
                     onRowClick={() => router.push(`/estimates/${est.id}`)}
                   />
                 </div>
               ))}
             </div>
           )}
         </CardContent>
       </Card>
    </>
  );
}
