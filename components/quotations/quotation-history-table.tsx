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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Eye,
  Download,
  Mail,
  MailCheck,
  MailX,
  Clock,
  RefreshCw,
  FileText,
  Plus,
} from "lucide-react";

const statusLabels: Record<
  string,
  { label: string; variant: "secondary" | "success" | "info" | "warning" | "destructive" }
> = {
  DRAFT: { label: "Brouillon", variant: "secondary" },
  SENT: { label: "Envoyé", variant: "info" as any },
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
  if (quotations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 border border-border/40 rounded-xl bg-card/30">
        <div className="h-12 w-12 rounded-full bg-muted/40 border border-border/50 flex items-center justify-center">
          <FileText className="h-5 w-5 text-muted-foreground/60" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-foreground/70">Aucun devis</p>
          <p className="text-xs text-muted-foreground mt-0.5">Les devis créés pour ce client apparaîtront ici</p>
        </div>
        <Link href="/quotations/new">
          <Button size="sm" variant="outline" className="mt-1">
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Nouveau devis
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <TooltipProvider>
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
          {quotations.map((q) => {
            const st = statusLabels[q.status] || statusLabels.DRAFT;
            const latestEmail = q.emails?.[0];
            const emailSt = latestEmail ? emailStatusConfig[latestEmail.status] : null;
            const EmailIcon = emailSt?.icon || Mail;
            const hasBeenSent = latestEmail?.status === "SENT";

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
                  <p className="text-sm font-medium">{q.customer?.name || q.clientName || "—"}</p>
                  <p className="text-xs text-muted-foreground">{q.customer?.email || q.clientEmail || ""}</p>
                  {q.customer?.company && (
                    <p className="text-xs text-muted-foreground/70">{q.customer.company}</p>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">{q.laboratory?.name || "—"}</TableCell>
                <TableCell className="font-medium tabular-nums">
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
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground/50">—</span>
                  )}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {formatDate(new Date(q.createdAt))}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-0.5">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link href={`/quotations/${q.id}`}>
                          <Button variant="ghost" size="sm" aria-label="Voir le devis">
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent>Voir le devis</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <a href={`/api/quotations/${q.id}/pdf`} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="sm" aria-label="Télécharger le PDF">
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                        </a>
                      </TooltipTrigger>
                      <TooltipContent>Télécharger PDF</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        {hasBeenSent ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            aria-label="Renvoyer l'email"
                            onClick={() => onResendEmail?.(q.id)}
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            aria-label="Envoyer par email"
                            onClick={() => onSendEmail?.(q.id)}
                          >
                            <Mail className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </TooltipTrigger>
                      <TooltipContent>
                        {hasBeenSent ? "Renvoyer l'email" : "Envoyer par email"}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TooltipProvider>
  );
}
