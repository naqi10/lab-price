"use client";

import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const statusMap: Record<string, { label: string; variant: "secondary" | "default" | "destructive" | "outline" | "success" | "warning" }> = {
  DRAFT: { label: "Brouillon", variant: "secondary" },
  SENT: { label: "Envoyé", variant: "info" as any },
  ACCEPTED: { label: "Accepté", variant: "success" },
  REJECTED: { label: "Rejeté", variant: "destructive" },
  CANCELLED: { label: "Annulé", variant: "outline" },
};

interface RecentQuotation {
  id: string;
  quotationNumber: string;
  title: string;
  totalPrice: number;
  status: string;
  createdAt: string;
  laboratory: { name: string };
  createdBy: { name: string };
}

export default function RecentQuotations({ quotations }: { quotations: RecentQuotation[] }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <FileText className="h-4 w-4 text-muted-foreground" />
          Devis récents
        </CardTitle>
        <Link href="/quotations">
          <Button variant="ghost" size="sm" className="text-xs h-7">
            Voir tout
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {quotations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <div className="h-12 w-12 rounded-full bg-muted/40 border border-border/50 flex items-center justify-center">
              <FileText className="h-5 w-5 text-muted-foreground/60" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground/70">Aucun devis pour le moment</p>
              <p className="text-xs text-muted-foreground mt-0.5">Créez votre premier devis pour commencer</p>
            </div>
            <Link href="/quotations/new">
              <Button size="sm" variant="outline" className="mt-1">
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Nouveau devis
              </Button>
            </Link>
          </div>
        ) : (
          <TooltipProvider>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numéro</TableHead>
                  <TableHead>Titre</TableHead>
                  <TableHead>Laboratoire</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotations.map((q) => {
                  const st = statusMap[q.status] || statusMap.DRAFT;
                  return (
                    <TableRow key={q.id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/quotations/${q.id}`}
                          className="text-primary hover:underline focus-visible:underline focus-visible:outline-none"
                        >
                          {q.quotationNumber}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="block max-w-[180px] truncate cursor-default text-foreground/80">
                              {q.title}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>{q.title}</TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{q.laboratory.name}</TableCell>
                      <TableCell className="font-medium tabular-nums">{formatCurrency(q.totalPrice)}</TableCell>
                      <TableCell>
                        <Badge variant={st.variant}>{st.label}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">{formatDate(q.createdAt)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TooltipProvider>
        )}
      </CardContent>
    </Card>
  );
}
