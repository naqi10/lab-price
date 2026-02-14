"use client";

import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText } from "lucide-react";

const statusMap: Record<string, { label: string; variant: "secondary" | "default" | "destructive" | "outline" }> = {
  DRAFT: { label: "Brouillon", variant: "secondary" },
  SENT: { label: "Envoyé", variant: "default" },
  ACCEPTED: { label: "Accepté", variant: "default" },
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
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="h-5 w-5" />
          Devis récents
        </CardTitle>
      </CardHeader>
      <CardContent>
        {quotations.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Aucun devis pour le moment.</p>
        ) : (
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
                      <Link href={`/quotations/${q.id}`} className="hover:underline">
                        {q.quotationNumber}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">{q.title}</TableCell>
                    <TableCell>{q.laboratory.name}</TableCell>
                    <TableCell>{formatCurrency(q.totalPrice)}</TableCell>
                    <TableCell>
                      <Badge variant={st.variant}>{st.label}</Badge>
                    </TableCell>
                    <TableCell>{formatDate(q.createdAt)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
