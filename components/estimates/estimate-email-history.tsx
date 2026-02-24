"use client";

import { useState } from "react";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { MailCheck, MailX, Clock, Download, Loader2, Mail } from "lucide-react";

const emailStatusConfig: Record<
  string,
  { label: string; variant: "secondary" | "success" | "destructive" | "warning"; icon: typeof MailCheck }
> = {
  SENT: { label: "Envoyé", variant: "success", icon: MailCheck },
  FAILED: { label: "Échoué", variant: "destructive", icon: MailX },
  PENDING: { label: "En cours", variant: "warning", icon: Clock },
};

export default function EstimateEmailHistory({
  estimate,
  estimateId,
}: {
  estimate: any;
  estimateId: string;
}) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownloadPdf = async (emailId: string) => {
    setDownloadingId(emailId);
    try {
      const res = await fetch(`/api/estimates/${estimateId}/pdf`);
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `estimation-${estimate?.estimateNumber || estimateId}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } finally {
      setDownloadingId(null);
    }
  };

  // Merge EstimateEmail records and EmailLog records into a unified list
  const allEmails = [
    ...(estimate?.emails || []).map((e: any) => ({
      id: e.id,
      toEmail: e.toEmail,
      subject: e.subject,
      status: e.status,
      sentAt: e.sentAt || e.createdAt,
      error: e.error,
      source: "estimate_email" as const,
      sentByName: e.sentBy?.name,
    })),
    ...(estimate?.emailLogs || []).map((e: any) => ({
      id: e.id,
      toEmail: e.toEmail,
      subject: e.subject,
      status: e.status,
      sentAt: e.createdAt,
      error: e.error,
      source: e.source || "system",
      sentByName: null as string | null,
    })),
  ]
    // Deduplicate by matching toEmail + subject + close timestamps (within 5s)
    .filter((email, idx, arr) => {
      const isDuplicate = arr.findIndex(
        (other, otherIdx) =>
          otherIdx < idx &&
          other.toEmail === email.toEmail &&
          other.subject === email.subject &&
          Math.abs(new Date(other.sentAt).getTime() - new Date(email.sentAt).getTime()) < 5000
      ) !== -1;
      return !isDuplicate;
    })
    .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());

  return (
    <TooltipProvider>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Mail className="h-4 w-4 text-muted-foreground" />
            Historique des emails
            <span className="ml-1 text-xs font-normal text-muted-foreground">
              ({allEmails.length} envoi{allEmails.length !== 1 ? "s" : ""})
            </span>
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          {allEmails.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="h-12 w-12 rounded-full bg-muted/40 border border-border/50 flex items-center justify-center">
                <Mail className="h-5 w-5 text-muted-foreground/60" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground/70">Aucun email envoyé</p>
                <p className="text-xs text-muted-foreground mt-0.5">Aucun email envoyé pour cette estimation</p>
              </div>
            </div>
          ) : (
            <Table className="w-full">
              <TableHeader>
                <TableRow>
                  <TableHead>Destinataire</TableHead>
                  <TableHead>Envoyé par</TableHead>
                  <TableHead>Sujet</TableHead>
                  <TableHead className="w-px whitespace-nowrap">Statut</TableHead>
                  <TableHead className="w-px whitespace-nowrap">Date d'envoi</TableHead>
                  <TableHead className="w-10 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allEmails.map((email) => {
                  const emailSt = emailStatusConfig[email.status] || emailStatusConfig.PENDING;
                  const EmailIcon = emailSt.icon;

                  return (
                    <TableRow key={email.id}>
                      <TableCell className="text-sm font-medium">{email.toEmail}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {email.sentByName || "Système"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{email.subject}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge variant={emailSt.variant} className="gap-1">
                          <EmailIcon className="h-3 w-3" />
                          {emailSt.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {email.sentAt ? formatDate(new Date(email.sentAt)) : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownloadPdf(email.id)}
                              disabled={downloadingId === email.id}
                            >
                              {downloadingId === email.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Download className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Télécharger PDF</TooltipContent>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
