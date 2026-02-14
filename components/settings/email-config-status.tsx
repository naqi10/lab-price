"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, CheckCircle2, XCircle } from "lucide-react";

export default function EmailConfigStatus() {
  const [status, setStatus] = useState<{
    configured: boolean;
    mode: string | null;
    fromEmail: string | null;
  } | null>(null);

  useEffect(() => {
    fetch("/api/settings/email-status")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setStatus(d.data);
      })
      .catch(() => setStatus({ configured: false, mode: null, fromEmail: null }));
  }, []);

  const modeLabel = status?.mode === "api" ? "Brevo HTTP API" : status?.mode === "smtp" ? "SMTP Relay" : "Non configuré";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Mail className="h-5 w-5" />
          Configuration email
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!status ? (
          <p className="text-sm text-muted-foreground">Chargement...</p>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Statut</span>
              {status.configured ? (
                <Badge variant="default" className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Configuré
                </Badge>
              ) : (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <XCircle className="h-3 w-3" /> Non configuré
                </Badge>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Mode de transport</span>
              <span className="text-sm font-medium">{modeLabel}</span>
            </div>
            {status.fromEmail && (
              <div className="flex items-center justify-between">
                <span className="text-sm">Email expéditeur</span>
                <span className="text-sm font-medium">{status.fromEmail}</span>
              </div>
            )}
            {!status.configured && (
              <p className="text-xs text-muted-foreground mt-2">
                Configurez les variables d&apos;environnement BREVO_API_KEY + EMAIL_FROM (API Brevo)
                ou SMTP_HOST + SMTP_USER + SMTP_PASS + FROM_EMAIL (SMTP) dans le fichier .env pour activer l&apos;envoi d&apos;emails.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
