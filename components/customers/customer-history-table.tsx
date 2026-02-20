"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Search, Mail, ChevronLeft, ChevronRight, X, FileText,
  RotateCcw, ExternalLink, Loader2,
} from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { useRouter } from "next/navigation";
import { formatDate, formatCurrency } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────

interface TestMappingDetail {
  id: string;
  canonicalName: string;
  entries?: Array<{
    laboratoryId: string;
    laboratoryName: string;
    laboratoryCode: string;
    price: number;
    customPrice?: number;
  }>;
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

type TimelineItem =
  | { type: "email"; data: EmailHistoryItem; timestamp: number }
  | { type: "estimate"; data: EstimateHistoryItem; timestamp: number };

export interface HistoryDataSummary {
  emailCount: number;
  emailsSent: number;
  emailsFailed: number;
  estimateCount: number;
  estimates: EstimateHistoryItem[];
}

interface CustomerHistoryTableProps {
  customerId: string;
  onDataLoaded?: (summary: HistoryDataSummary) => void;
}

// ─── Helpers ─────────────────────────────────────────────

const emailStatusMap: Record<string, { label: string; variant: "default" | "destructive" | "secondary" }> = {
  SENT: { label: "Envoyé", variant: "default" },
  FAILED: { label: "Échoué", variant: "destructive" },
  PENDING: { label: "En attente", variant: "secondary" },
};

const estimateStatusMap: Record<string, { label: string; variant: "default" | "destructive" | "secondary" }> = {
  DRAFT: { label: "Brouillon", variant: "secondary" },
  SENT: { label: "Envoyé", variant: "default" },
  ACCEPTED: { label: "Accepté", variant: "default" },
  REJECTED: { label: "Rejeté", variant: "destructive" },
};

function getStatusBadge(type: "email" | "estimate", status: string) {
  const map = type === "email" ? emailStatusMap : estimateStatusMap;
  const st = map[status] || { label: status, variant: "secondary" as const };
  return <Badge variant={st.variant}>{st.label}</Badge>;
}

function matchesSearch(item: TimelineItem, query: string): boolean {
  const q = query.toLowerCase();
  if (item.type === "email") {
    const e = item.data as EmailHistoryItem;
    return (
      e.toEmail.toLowerCase().includes(q) ||
      e.subject.toLowerCase().includes(q) ||
      (e.estimateNumber?.toLowerCase().includes(q) ?? false)
    );
  } else {
    const e = item.data as EstimateHistoryItem;
    return (
      e.estimateNumber.toLowerCase().includes(q) ||
      (e.customer?.name.toLowerCase().includes(q) ?? false) ||
      (e.customer?.email.toLowerCase().includes(q) ?? false) ||
      (e.notes?.toLowerCase().includes(q) ?? false)
    );
  }
}

const PAGE_SIZE = 15;

// ─── Component ───────────────────────────────────────────

export default function CustomerHistoryTable({
  customerId,
  onDataLoaded,
}: CustomerHistoryTableProps) {
  const router = useRouter();

  // Raw data
  const [emails, setEmails] = useState<EmailHistoryItem[]>([]);
  const [estimates, setEstimates] = useState<EstimateHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  // Resend
  const [resendingId, setResendingId] = useState<string | null>(null);

  const debouncedQ = useDebounce(q, 350);
  const abortRef = useRef<AbortController | null>(null);
  const onDataLoadedRef = useRef(onDataLoaded);
  onDataLoadedRef.current = onDataLoaded;

  const fetchHistory = useCallback(async () => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    setError(null);
    try {
      const [historyRes, estimatesRes] = await Promise.all([
        fetch(`/api/customers/${customerId}/history`, { signal: abortRef.current.signal }).then((r) => r.json()),
        fetch(`/api/estimates?customerId=${customerId}&limit=50`, { signal: abortRef.current.signal }).then((r) => r.json()),
      ]);

      const emailData: EmailHistoryItem[] = historyRes.success ? historyRes.data : [];
      const estData: EstimateHistoryItem[] = estimatesRes.success ? (estimatesRes.data.estimates || []) : [];

      setEmails(emailData);
      setEstimates(estData);

      onDataLoadedRef.current?.({
        emailCount: emailData.length,
        emailsSent: emailData.filter((e) => e.status === "SENT").length,
        emailsFailed: emailData.filter((e) => e.status === "FAILED").length,
        estimateCount: estData.length,
        estimates: estData,
      });
    } catch (err: any) {
      if (err.name !== "AbortError") setError("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  // Build combined + sorted timeline
  const allItems = useMemo<TimelineItem[]>(() => {
    const items: TimelineItem[] = [
      ...emails.map((item) => ({
        type: "email" as const,
        data: item,
        timestamp: new Date(item.createdAt).getTime(),
      })),
      ...estimates.map((est) => ({
        type: "estimate" as const,
        data: est,
        timestamp: new Date(est.sentAt || est.createdAt).getTime(),
      })),
    ];
    return items.sort((a, b) => b.timestamp - a.timestamp);
  }, [emails, estimates]);

  // Filter by search
  const filtered = useMemo(() => {
    if (!debouncedQ) return allItems;
    return allItems.filter((item) => matchesSearch(item, debouncedQ));
  }, [allItems, debouncedQ]);

  // Pagination (client-side)
  const total = filtered.length;
  const pages = Math.ceil(total / PAGE_SIZE);
  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  // Reset page when search changes
  useEffect(() => { setPage(1); }, [debouncedQ]);

  const hasActiveFilters = !!debouncedQ;
  const clearFilters = () => { setQ(""); };

  const handleResendEmail = async (emailId: string) => {
    const email = emails.find((e) => e.id === emailId);
    if (!email || !email.estimateId) {
      alert("Impossible de renvoyer cet email");
      return;
    }

    setResendingId(emailId);
    try {
      const res = await fetch(`/api/estimates/${email.estimateId}/resend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerIds: [customerId] }),
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

  return (
    <TooltipProvider>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Mail className="h-4 w-4 text-muted-foreground" />
              Historique
              {!loading && (
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  ({total} au total)
                </span>
              )}
            </CardTitle>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 text-xs gap-1">
                <X className="h-3 w-3" />
                Effacer
              </Button>
            )}
          </div>

          {/* Search */}
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher par email, sujet, numéro..."
              className="pl-9 h-9"
            />
            {q && (
              <button
                onClick={() => setQ("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {error && <p className="text-sm text-destructive px-6 py-4">{error}</p>}

          {loading ? (
            <div className="px-6 pb-6 space-y-2">
              {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : paginated.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="h-12 w-12 rounded-full bg-muted/40 border border-border/50 flex items-center justify-center">
                <Mail className="h-5 w-5 text-muted-foreground/60" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground/70">Aucune activité</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {hasActiveFilters
                    ? "Essayez de modifier vos filtres"
                    : "L'historique apparaîtra ici lorsque des emails seront envoyés"}
                </p>
              </div>
              {hasActiveFilters && (
                <Button size="sm" variant="outline" onClick={clearFilters} className="mt-1">
                  Effacer les filtres
                </Button>
              )}
            </div>
          ) : (
            <>
              <Table className="w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-px whitespace-nowrap">Type</TableHead>
                    <TableHead>Référence</TableHead>
                    <TableHead>Détails</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-px whitespace-nowrap">Statut</TableHead>
                    <TableHead>Prix</TableHead>
                    <TableHead className="w-10 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((item) => {
                    if (item.type === "email") {
                      const e = item.data as EmailHistoryItem;
                      const testCount = e.estimate?.testMappingIds.length || 0;
                      return (
                        <TableRow
                          key={`email-${e.id}`}
                          className={e.estimateId ? "cursor-pointer hover:bg-muted/50 transition-colors" : "transition-colors"}
                          onClick={() => e.estimateId && router.push(`/estimates/${e.estimateId}`)}
                        >
                          <TableCell>
                            <Badge variant="outline" className="text-xs gap-1 font-normal">
                              <Mail className="h-3 w-3" />
                              Email
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-xs text-muted-foreground">
                              {e.estimateNumber || "—"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-[240px]">
                              <p className="text-sm font-medium truncate">{e.subject}</p>
                              <p className="text-xs text-muted-foreground truncate">{e.toEmail}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                            {formatDate(e.createdAt)}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge("email", e.status)}
                          </TableCell>
                          <TableCell>
                            {testCount > 0 ? (
                              <span className="text-xs text-muted-foreground">{testCount} test{testCount !== 1 ? "s" : ""}</span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1" onClick={(ev) => ev.stopPropagation()}>
                              {e.status === "SENT" && e.estimateId && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleResendEmail(e.id)}
                                      disabled={resendingId === e.id}
                                      aria-label="Renvoyer"
                                    >
                                      {resendingId === e.id ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                      ) : (
                                        <RotateCcw className="h-3.5 w-3.5" />
                                      )}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Renvoyer</TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    } else {
                      const est = item.data as EstimateHistoryItem;
                      const testCount = est.testMappingIds?.length || 0;
                      return (
                        <TableRow
                          key={`estimate-${est.id}`}
                          className="cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => router.push(`/estimates/${est.id}`)}
                        >
                          <TableCell>
                            <Badge variant="outline" className="text-xs gap-1 font-normal">
                              <FileText className="h-3 w-3" />
                              Estimation
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-xs font-medium">
                              {est.estimateNumber}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-[240px]">
                              <p className="text-sm font-medium truncate">
                                {testCount} test{testCount !== 1 ? "s" : ""}
                              </p>
                              {est.createdBy && (
                                <p className="text-xs text-muted-foreground truncate">
                                  Par {est.createdBy.name}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                            {formatDate(est.sentAt || est.createdAt)}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge("estimate", est.status)}
                          </TableCell>
                          <TableCell>
                            <span className="font-medium tabular-nums text-sm">
                              {formatCurrency(est.totalPrice)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1" onClick={(ev) => ev.stopPropagation()}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => router.push(`/estimates/${est.id}`)}
                                    aria-label="Voir"
                                  >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Voir l'estimation</TooltipContent>
                              </Tooltip>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    }
                  })}
                </TableBody>
              </Table>

              {/* Pagination */}
              {pages > 1 && (
                <div className="flex items-center justify-between border-t border-border/40 px-4 py-3">
                  <p className="text-xs text-muted-foreground">
                    {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, total)} sur{" "}
                    {total} événement{total !== 1 ? "s" : ""}
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline" size="sm" className="h-7 w-7 p-0"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                      aria-label="Page précédente"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </Button>

                    {Array.from({ length: Math.min(pages, 5) }, (_, i) => {
                      let pageNum: number;
                      if (pages <= 5)                   pageNum = i + 1;
                      else if (page <= 3)               pageNum = i + 1;
                      else if (page >= pages - 2)       pageNum = pages - 4 + i;
                      else                              pageNum = page - 2 + i;
                      return (
                        <Button
                          key={pageNum}
                          variant={pageNum === page ? "default" : "ghost"}
                          size="sm"
                          className="h-7 w-7 p-0 text-xs"
                          onClick={() => setPage(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}

                    <Button
                      variant="outline" size="sm" className="h-7 w-7 p-0"
                      onClick={() => setPage((p) => Math.min(pages, p + 1))}
                      disabled={page >= pages}
                      aria-label="Page suivante"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
