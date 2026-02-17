"use client";

import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Eye,
  Download,
  Mail,
  MailCheck,
  MailX,
  Clock,
  RefreshCw,
} from "lucide-react";

const statusLabels: Record<
  string,
  { label: string; variant: "secondary" | "success" | "info" | "warning" | "destructive" }
> = {
  DRAFT: { label: "Brouillon", variant: "secondary" },
  SENT: { label: "Envoyé", variant: "success" },
  ACCEPTED: { label: "Accepté", variant: "success" },
  REJECTED: { label: "Refusé", variant: "destructive" },
  CANCELLED: { label: "Annulé", variant: "warning" },
};

const emailStatusConfig: Record<
  string,
  { label: string; variant: "secondary" | "success" | "destructive" | "warning"; icon: typeof MailCheck }
> = {
  SENT: { label: "Envoyé", variant: "success", icon: MailCheck },
  FAILED: { label: "Échoué", variant: "destructive", icon: MailX },
  PENDING: { label: "En cours", variant: "warning", icon: Clock },
};

export default function QuotationHistoryTable({
  quotations,
  onSendEmail,
  onResendEmail,
}: {
  quotations: any[];
  onSendEmail?: (id: string) => void;
  onResendEmail?: (id: string) => void;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Numéro</TableHead>
          <TableHead>Client</TableHead>
          <TableHead>Laboratoire</TableHead>
          <TableHead>Montant</TableHead>
          <TableHead>Statut</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Date</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {quotations.length === 0 ? (
          <TableRow>
            <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
              Aucun devis
            </TableCell>
          </TableRow>
        ) : (
          quotations.map((q) => {
            const st = statusLabels[q.status] || statusLabels.DRAFT;
            const latestEmail = q.emails?.[0];
            const emailSt = latestEmail
              ? emailStatusConfig[latestEmail.status]
              : null;
            const EmailIcon = emailSt?.icon || Mail;
            const hasBeenSent = latestEmail?.status === "SENT";

            return (
              <TableRow key={q.id}>
                <TableCell className="font-medium">{q.quotationNumber}</TableCell>
                <TableCell>
                  <p className="text-sm">{q.clientName}</p>
                  <p className="text-xs text-muted-foreground">{q.clientEmail}</p>
                </TableCell>
                <TableCell>{q.laboratory?.name || "-"}</TableCell>
                <TableCell>
                  {formatCurrency(q.totalPrice ?? q.totalAmount ?? 0)}
                </TableCell>
                <TableCell>
                  <Badge variant={st.variant}>{st.label}</Badge>
                </TableCell>
                <TableCell>
                  {emailSt ? (
                    <div className="flex items-center gap-1.5">
                      <Badge variant={emailSt.variant} className="gap-1">
                        <EmailIcon className="h-3 w-3" />
                        {emailSt.label}
                      </Badge>
                      {latestEmail.toEmail && (
                        <span className="text-xs text-muted-foreground hidden lg:inline">
                          {latestEmail.toEmail}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>{formatDate(new Date(q.createdAt))}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Link href={`/quotations/${q.id}`}>
                      <Button variant="ghost" size="icon" aria-label="Voir le devis">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    <a href={`/api/quotations/${q.id}/pdf`} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="icon" aria-label="Télécharger le PDF">
                        <Download className="h-4 w-4" />
                      </Button>
                    </a>
                    {hasBeenSent ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Renvoyer l'email"
                        onClick={() => onResendEmail?.(q.id)}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Envoyer par email"
                        onClick={() => onSendEmail?.(q.id)}
                      >
                        <Mail className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}
