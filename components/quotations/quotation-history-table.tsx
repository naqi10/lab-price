"use client";

import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, Download, Mail } from "lucide-react";

const statusLabels: Record<string, { label: string; variant: "secondary" | "success" | "info" }> = { DRAFT: { label: "Brouillon", variant: "secondary" }, SENT: { label: "Envoyé", variant: "success" }, RESENT: { label: "Renvoyé", variant: "info" } };

export default function QuotationHistoryTable({ quotations, onSendEmail }: { quotations: any[]; onSendEmail?: (id: string) => void }) {
  return (
    <Table>
      <TableHeader><TableRow><TableHead>Numéro</TableHead><TableHead>Client</TableHead><TableHead>Laboratoire</TableHead><TableHead>Montant</TableHead><TableHead>Statut</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
      <TableBody>
        {quotations.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Aucun devis</TableCell></TableRow> : quotations.map(q => {
          const st = statusLabels[q.status] || statusLabels.DRAFT;
          return (<TableRow key={q.id}><TableCell className="font-medium">{q.quotationNumber}</TableCell><TableCell><p className="text-sm">{q.clientName}</p><p className="text-xs text-muted-foreground">{q.clientEmail}</p></TableCell><TableCell>{q.laboratory?.name || "-"}</TableCell><TableCell>{formatCurrency(q.totalAmount)}</TableCell><TableCell><Badge variant={st.variant}>{st.label}</Badge></TableCell><TableCell>{formatDate(new Date(q.createdAt))}</TableCell><TableCell className="text-right space-x-1"><Link href={`/quotations/${q.id}`}><Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button></Link><a href={`/api/quotations/${q.id}/pdf`} target="_blank"><Button variant="ghost" size="icon"><Download className="h-4 w-4" /></Button></a><Button variant="ghost" size="icon" onClick={() => onSendEmail?.(q.id)}><Mail className="h-4 w-4" /></Button></TableCell></TableRow>);
        })}
      </TableBody>
    </Table>
  );
}
