"use client";

import { useState, useEffect, useCallback, useRef, useImperativeHandle, forwardRef } from "react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Search, Contact, ChevronLeft, ChevronRight, X, Plus, Edit, Trash2,
} from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { useRouter } from "next/navigation";

// ─── Types ───────────────────────────────────────────────

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  _count?: { estimates: number; emailLogs: number };
}

interface Meta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface CustomersTableRef {
  refetch: () => void;
}

interface CustomersTableProps {
  onEdit: (customer: Customer) => void;
  onDelete: (id: string) => void;
  onNew?: () => void;
}

const PAGE_SIZE = 20;

// ─── Component ───────────────────────────────────────────

const CustomersTable = forwardRef<CustomersTableRef, CustomersTableProps>(
  function CustomersTable({ onEdit, onDelete, onNew }, ref) {
    const router = useRouter();

    // Data
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [meta, setMeta] = useState<Meta>({ page: 1, limit: PAGE_SIZE, total: 0, pages: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [q, setQ] = useState("");
    const [page, setPage] = useState(1);

    const debouncedQ = useDebounce(q, 350);
    const abortRef = useRef<AbortController | null>(null);

    const fetchCustomers = useCallback(async (p: number) => {
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          page: String(p),
          limit: String(PAGE_SIZE),
        });
        if (debouncedQ) params.set("search", debouncedQ);

        const res = await fetch(`/api/customers?${params}`, { signal: abortRef.current.signal });
        const data = await res.json();
        if (data.success) {
          setCustomers(data.data.customers);
          setMeta(data.data.pagination);
        } else {
          setError(data.message || "Erreur de chargement");
        }
      } catch (err: any) {
        if (err.name !== "AbortError") setError("Erreur de connexion");
      } finally {
        setLoading(false);
      }
    }, [debouncedQ]);

    // Reset page when search changes
    useEffect(() => { setPage(1); }, [debouncedQ]);
    useEffect(() => { fetchCustomers(page); }, [fetchCustomers, page]);

    // Expose refetch to parent
    useImperativeHandle(ref, () => ({
      refetch: () => fetchCustomers(page),
    }), [fetchCustomers, page]);

    const hasActiveFilters = !!debouncedQ;

    const clearFilters = () => {
      setQ("");
    };

    return (
      <TooltipProvider>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Contact className="h-4 w-4 text-muted-foreground" />
                Clients
                {!loading && (
                  <span className="ml-1 text-xs font-normal text-muted-foreground">
                    ({meta.total.toLocaleString("fr-FR")} au total)
                  </span>
                )}
              </CardTitle>
              <div className="flex items-center gap-2">
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 text-xs gap-1">
                    <X className="h-3 w-3" />
                    Effacer
                  </Button>
                )}
                {onNew && (
                  <Button size="sm" onClick={onNew} className="h-7 text-xs gap-1">
                    <Plus className="h-3 w-3" />
                    Nouveau client
                  </Button>
                )}
              </div>
            </div>

            {/* Search */}
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Rechercher par nom, email, entreprise..."
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
            ) : customers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="h-12 w-12 rounded-full bg-muted/40 border border-border/50 flex items-center justify-center">
                  <Contact className="h-5 w-5 text-muted-foreground/60" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground/70">Aucun client trouvé</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {hasActiveFilters ? "Essayez de modifier vos filtres" : "Créez un client pour commencer"}
                  </p>
                </div>
                {hasActiveFilters ? (
                  <Button size="sm" variant="outline" onClick={clearFilters} className="mt-1">
                    Effacer les filtres
                  </Button>
                ) : onNew ? (
                  <Button size="sm" variant="outline" onClick={onNew} className="mt-1">
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    Nouveau client
                  </Button>
                ) : null}
              </div>
            ) : (
              <>
                <Table className="w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Téléphone</TableHead>
                      <TableHead>Entreprise</TableHead>
                      <TableHead>Estimations</TableHead>
                      <TableHead>Emails envoyés</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.map((c) => (
                      <TableRow
                        key={c.id}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => router.push(`/customers/${c.id}`)}
                      >
                        <TableCell className="font-medium">{c.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{c.email}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{c.phone || "—"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{c.company || "—"}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center justify-center h-6 min-w-[1.5rem] rounded-full bg-primary/10 text-primary text-xs font-medium px-2">
                            {c._count?.estimates ?? 0}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">{c._count?.emailLogs ?? 0}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onEdit(c)}
                                  aria-label="Modifier"
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Modifier</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onDelete(c.id)}
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                  aria-label="Supprimer"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Supprimer</TooltipContent>
                            </Tooltip>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {meta.pages > 1 && (
                  <div className="flex items-center justify-between border-t border-border/40 px-4 py-3">
                    <p className="text-xs text-muted-foreground">
                      {((meta.page - 1) * meta.limit) + 1}–{Math.min(meta.page * meta.limit, meta.total)} sur{" "}
                      {meta.total.toLocaleString("fr-FR")} clients
                    </p>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline" size="sm" className="h-7 w-7 p-0"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={meta.page <= 1 || loading}
                        aria-label="Page précédente"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </Button>

                      {Array.from({ length: Math.min(meta.pages, 5) }, (_, i) => {
                        let pageNum: number;
                        if (meta.pages <= 5)                        pageNum = i + 1;
                        else if (meta.page <= 3)                    pageNum = i + 1;
                        else if (meta.page >= meta.pages - 2)       pageNum = meta.pages - 4 + i;
                        else                                        pageNum = meta.page - 2 + i;
                        return (
                          <Button
                            key={pageNum}
                            variant={pageNum === meta.page ? "default" : "ghost"}
                            size="sm"
                            className="h-7 w-7 p-0 text-xs"
                            onClick={() => setPage(pageNum)}
                            disabled={loading}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}

                      <Button
                        variant="outline" size="sm" className="h-7 w-7 p-0"
                        onClick={() => setPage((p) => Math.min(meta.pages, p + 1))}
                        disabled={meta.page >= meta.pages || loading}
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
);

export default CustomersTable;
