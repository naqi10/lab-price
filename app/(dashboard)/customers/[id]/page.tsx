"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { useDashboardTitle } from "@/hooks/use-dashboard-title";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate, formatCurrency } from "@/lib/utils";
import CustomerHistoryTable, { type HistoryDataSummary } from "@/components/customers/customer-history-table";
import {
  ArrowLeft, Pencil, Save, X, Mail, FileText, Contact,
  Building2, Phone, Calendar, BarChart3, Loader2,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  createdAt: string;
  _count: { emailLogs: number; estimates: number };
}

const estimateStatusMap: Record<string, { label: string; variant: "default" | "destructive" | "secondary" }> = {
  DRAFT: { label: "Brouillon", variant: "secondary" },
  SENT: { label: "Envoyé", variant: "default" },
  ACCEPTED: { label: "Accepté", variant: "default" },
  REJECTED: { label: "Rejeté", variant: "destructive" },
};

const getStatusBadge = (status: string) => {
  const st = estimateStatusMap[status] || estimateStatusMap.DRAFT;
  return <Badge variant={st.variant}>{st.label}</Badge>;
};

// ─── Skeleton ────────────────────────────────────────────

function DetailSkeleton() {
  return (
    <div className="space-y-6 pt-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <Skeleton className="h-9 w-64" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    </div>
  );
}

// ─── Component ───────────────────────────────────────────

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  // Customer info (only thing the parent fetches now)
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Stats from the history table
  const [stats, setStats] = useState<HistoryDataSummary | null>(null);

  // Editing
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "" });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/customers/${id}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setCustomer(res.data);
          setForm({
            name: res.data.name,
            email: res.data.email,
            phone: res.data.phone || "",
            company: res.data.company || "",
          });
        } else {
          setError(res.message);
        }
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

  const handleDataLoaded = useCallback((summary: HistoryDataSummary) => {
    setStats(summary);
  }, []);

  // ─── Loading / Error ─────────────────────────────────

  if (loading) return <DetailSkeleton />;

  if (error || !customer) {
    return (
      <div className="space-y-4 pt-4">
        <Button variant="outline" size="sm" onClick={() => router.push("/customers")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        <Card className="p-6">
          <p className="text-destructive">{error || "Client non trouvé"}</p>
          <Button onClick={() => router.push("/customers")} variant="outline" className="mt-4">
            Retour aux clients
          </Button>
        </Card>
      </div>
    );
  }

  // ─── Render ──────────────────────────────────────────

  return (
    <div className="space-y-6 pt-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => router.push("/customers")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{customer.name}</h1>
              {customer.company && (
                <Badge variant="outline" className="text-xs font-normal">
                  {customer.company}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{customer.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!editing ? (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              <Pencil className="h-3.5 w-3.5 mr-1.5" />
              Modifier
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setEditing(false); setSaveError(null); }}
              >
                <X className="h-3.5 w-3.5 mr-1.5" />
                Annuler
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                ) : (
                  <Save className="h-3.5 w-3.5 mr-1.5" />
                )}
                Enregistrer
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="details" className="w-full">
        <TabsList>
          <TabsTrigger value="details">Détails</TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
        </TabsList>

        {/* ── Details Tab ──────────────────────────────── */}
        <TabsContent value="details" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customer Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Contact className="h-4 w-4 text-muted-foreground" />
                  Informations
                </CardTitle>
              </CardHeader>
              <CardContent>
                {saveError && (
                  <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 mb-4">
                    <p className="text-sm text-destructive leading-tight">{saveError}</p>
                  </div>
                )}
                {editing ? (
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Nom <span className="text-destructive">*</span></Label>
                      <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Email <span className="text-destructive">*</span></Label>
                      <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Téléphone</Label>
                      <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Entreprise</Label>
                      <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-muted/50 flex items-center justify-center">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Email</p>
                        <p className="text-sm font-medium">{customer.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-muted/50 flex items-center justify-center">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Téléphone</p>
                        <p className="text-sm font-medium">{customer.phone || "—"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-muted/50 flex items-center justify-center">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Entreprise</p>
                        <p className="text-sm font-medium">{customer.company || "—"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-muted/50 flex items-center justify-center">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Client depuis</p>
                        <p className="text-sm font-medium">{formatDate(customer.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  Résumé d'activité
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-lg border border-border/40 bg-muted/20 p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 mb-1">
                          <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        <p className="text-2xl font-bold">{stats.estimateCount}</p>
                        <p className="text-xs text-muted-foreground">Estimations</p>
                      </div>
                      <div className="rounded-lg border border-border/40 bg-muted/20 p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 mb-1">
                          <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        <p className="text-2xl font-bold">{stats.emailCount}</p>
                        <p className="text-xs text-muted-foreground">Emails</p>
                      </div>
                      <div className="rounded-lg border border-border/40 bg-green-500/5 p-4 text-center">
                        <p className="text-2xl font-bold text-green-600">{stats.emailsSent}</p>
                        <p className="text-xs text-muted-foreground">Envoyés</p>
                      </div>
                      <div className="rounded-lg border border-border/40 bg-red-500/5 p-4 text-center">
                        <p className="text-2xl font-bold text-red-600">{stats.emailsFailed}</p>
                        <p className="text-xs text-muted-foreground">Échoués</p>
                      </div>
                    </div>

                    {/* Recent estimates quick list */}
                    {stats.estimates.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-border/40">
                        <p className="text-xs font-medium text-muted-foreground mb-2">Dernières estimations</p>
                        <div className="space-y-2">
                          {stats.estimates.slice(0, 3).map((est) => (
                            <div
                              key={est.id}
                              className="flex items-center justify-between text-sm p-2 rounded-lg hover:bg-muted/30 cursor-pointer transition-colors"
                              onClick={() => router.push(`/estimates/${est.id}`)}
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs text-muted-foreground">{est.estimateNumber}</span>
                                {getStatusBadge(est.status)}
                              </div>
                              <span className="font-medium tabular-nums">{formatCurrency(est.totalPrice)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-20 w-full rounded-lg" />
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── History Tab ──────────────────────────────── */}
        <TabsContent value="history">
          <CustomerHistoryTable
            customerId={id}
            onDataLoaded={handleDataLoaded}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
