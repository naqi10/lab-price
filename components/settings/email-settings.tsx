"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Mail,
  Server,
  Globe,
  Send,
  CheckCircle,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  Image,
  FileSignature,
  Database,
  HardDrive,
  Save,
} from "lucide-react";

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

interface EmailSettingsData {
  id: string | null;
  mode: "API" | "SMTP";
  smtpHost: string | null;
  smtpPort: number | null;
  smtpUser: string | null;
  smtpPass: string | null;
  apiKey: string | null;
  fromEmail: string | null;
  fromName: string | null;
  companyLogoUrl: string | null;
  signatureHtml: string | null;
  configSource: "database" | "env" | "none";
  updatedAt: string | null;
}

// --------------------------------------------------------------------------
// Component
// --------------------------------------------------------------------------

export default function EmailSettings() {
  // ── State ──────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [configSource, setConfigSource] = useState<"database" | "env" | "none">("none");

  // Form fields
  const [mode, setMode] = useState<"API" | "SMTP">("SMTP");
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState("587");
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPass, setSmtpPass] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [fromEmail, setFromEmail] = useState("");
  const [fromName, setFromName] = useState("");
  const [companyLogoUrl, setCompanyLogoUrl] = useState("");
  const [signatureHtml, setSignatureHtml] = useState("");

  // Password visibility
  const [showSmtpPass, setShowSmtpPass] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  // Test email
  const [testEmail, setTestEmail] = useState("");
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Save feedback
  const [saveResult, setSaveResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Field-level validation errors
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  // ── Fetch settings ─────────────────────────────────────────────────────
  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/settings/email");
      const data = await res.json();
      if (data.success) {
        const s: EmailSettingsData = data.data;
        setMode(s.mode);
        setSmtpHost(s.smtpHost || "");
        setSmtpPort(String(s.smtpPort ?? 587));
        setSmtpUser(s.smtpUser || "");
        setSmtpPass(s.smtpPass || "");
        setApiKey(s.apiKey || "");
        setFromEmail(s.fromEmail || "");
        setFromName(s.fromName || "");
        setCompanyLogoUrl(s.companyLogoUrl || "");
        setSignatureHtml(s.signatureHtml || "");
        setConfigSource(s.configSource);
      }
    } catch (err) {
      console.error("Failed to load email settings:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // ── Save settings ──────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    setSaveResult(null);
    setFieldErrors({});

    try {
      const payload = {
        mode,
        smtpHost: smtpHost || null,
        smtpPort: smtpPort ? parseInt(smtpPort, 10) : null,
        smtpUser: smtpUser || null,
        smtpPass: smtpPass || null,
        apiKey: apiKey || null,
        fromEmail: fromEmail || null,
        fromName: fromName || null,
        companyLogoUrl: companyLogoUrl || null,
        signatureHtml: signatureHtml || null,
      };

      const res = await fetch("/api/settings/email", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        const s: EmailSettingsData = data.data;
        setSmtpPass(s.smtpPass || "");
        setApiKey(s.apiKey || "");
        setConfigSource(s.configSource);
        setSaveResult({
          success: true,
          message: "Configuration enregistrée avec succès",
        });
      } else {
        if (data.errors) setFieldErrors(data.errors);
        setSaveResult({
          success: false,
          message: data.message || "Erreur lors de l'enregistrement",
        });
      }
    } catch (err) {
      setSaveResult({
        success: false,
        message: "Erreur réseau lors de l'enregistrement",
      });
      console.error("Save email settings error:", err);
    } finally {
      setSaving(false);
      setTimeout(() => setSaveResult(null), 5000);
    }
  };

  // ── Send test email ────────────────────────────────────────────────────
  const handleTestEmail = async () => {
    if (!testEmail) return;
    setTestSending(true);
    setTestResult(null);

    try {
      const res = await fetch("/api/settings/email/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: testEmail }),
      });

      const data = await res.json();
      setTestResult({
        success: data.success,
        message: data.message,
      });
    } catch (err) {
      setTestResult({
        success: false,
        message: "Erreur réseau lors de l'envoi du test",
      });
      console.error("Test email error:", err);
    } finally {
      setTestSending(false);
      setTimeout(() => setTestResult(null), 8000);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">
            Chargement de la configuration...
          </span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Config Source Badge ─────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">
          Source de la configuration active :
        </span>
        {configSource === "database" && (
          <Badge variant="info" className="gap-1">
            <Database className="h-3 w-3" />
            Base de données
          </Badge>
        )}
        {configSource === "env" && (
          <Badge variant="warning" className="gap-1">
            <HardDrive className="h-3 w-3" />
            Variables d&apos;environnement
          </Badge>
        )}
        {configSource === "none" && (
          <Badge variant="destructive" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            Non configuré
          </Badge>
        )}
      </div>

      {/* ── Mode Toggle + Transport Config ─────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Server className="h-4 w-4" />
            Transport email
          </CardTitle>
          <CardDescription>
            Choisissez entre l&apos;API Brevo ou un serveur SMTP pour l&apos;envoi
            des emails.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Mode selector */}
          <div className="space-y-2">
            <Label>Mode d&apos;envoi</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={mode === "SMTP" ? "default" : "outline"}
                size="sm"
                onClick={() => setMode("SMTP")}
                className="gap-2"
              >
                <Server className="h-4 w-4" />
                SMTP
              </Button>
              <Button
                type="button"
                variant={mode === "API" ? "default" : "outline"}
                size="sm"
                onClick={() => setMode("API")}
                className="gap-2"
              >
                <Globe className="h-4 w-4" />
                API Brevo
              </Button>
            </div>
          </div>

          <Separator />

          {/* SMTP fields */}
          {mode === "SMTP" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtpHost">
                    Hôte SMTP <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="smtpHost"
                    value={smtpHost}
                    onChange={(e) => setSmtpHost(e.target.value)}
                    placeholder="smtp-relay.brevo.com"
                  />
                  {fieldErrors.smtpHost && (
                    <p className="text-xs text-destructive">
                      {fieldErrors.smtpHost[0]}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpPort">Port</Label>
                  <Input
                    id="smtpPort"
                    type="number"
                    value={smtpPort}
                    onChange={(e) => setSmtpPort(e.target.value)}
                    placeholder="587"
                  />
                  {fieldErrors.smtpPort && (
                    <p className="text-xs text-destructive">
                      {fieldErrors.smtpPort[0]}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtpUser">
                    Utilisateur SMTP <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="smtpUser"
                    value={smtpUser}
                    onChange={(e) => setSmtpUser(e.target.value)}
                    placeholder="login@example.com"
                  />
                  {fieldErrors.smtpUser && (
                    <p className="text-xs text-destructive">
                      {fieldErrors.smtpUser[0]}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpPass">
                    Mot de passe SMTP <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="smtpPass"
                      type={showSmtpPass ? "text" : "password"}
                      value={smtpPass}
                      onChange={(e) => setSmtpPass(e.target.value)}
                      placeholder="••••••••"
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowSmtpPass(!showSmtpPass)}
                      tabIndex={-1}
                    >
                      {showSmtpPass ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  {fieldErrors.smtpPass && (
                    <p className="text-xs text-destructive">
                      {fieldErrors.smtpPass[0]}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* API fields */}
          {mode === "API" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="apiKey">
                  Clé API Brevo <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="apiKey"
                    type={showApiKey ? "text" : "password"}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="xkeysib-..."
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowApiKey(!showApiKey)}
                    tabIndex={-1}
                  >
                    {showApiKey ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                {fieldErrors.apiKey && (
                  <p className="text-xs text-destructive">
                    {fieldErrors.apiKey[0]}
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Sender Info ────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Mail className="h-4 w-4" />
            Expéditeur
          </CardTitle>
          <CardDescription>
            Adresse et nom affichés comme expéditeur des emails.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fromEmail">Email d&apos;expédition</Label>
              <Input
                id="fromEmail"
                type="email"
                value={fromEmail}
                onChange={(e) => setFromEmail(e.target.value)}
                placeholder="noreply@example.com"
              />
              {fieldErrors.fromEmail && (
                <p className="text-xs text-destructive">
                  {fieldErrors.fromEmail[0]}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="fromName">Nom d&apos;expéditeur</Label>
              <Input
                id="fromName"
                value={fromName}
                onChange={(e) => setFromName(e.target.value)}
                placeholder="Lab Price Comparator"
              />
              {fieldErrors.fromName && (
                <p className="text-xs text-destructive">
                  {fieldErrors.fromName[0]}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Company Logo ───────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Image className="h-4 w-4" />
            Logo de l&apos;entreprise
          </CardTitle>
          <CardDescription>
            URL du logo affiché dans l&apos;en-tête des emails. Utilisez une
            URL publiquement accessible.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="companyLogoUrl">URL du logo</Label>
            <Input
              id="companyLogoUrl"
              type="url"
              value={companyLogoUrl}
              onChange={(e) => setCompanyLogoUrl(e.target.value)}
              placeholder="https://example.com/logo.png"
            />
            {fieldErrors.companyLogoUrl && (
              <p className="text-xs text-destructive">
                {fieldErrors.companyLogoUrl[0]}
              </p>
            )}
          </div>
          {companyLogoUrl && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Aperçu</Label>
              <div className="rounded-md border bg-muted/30 p-4 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={companyLogoUrl}
                  alt="Aperçu du logo"
                  className="max-h-16 max-w-[200px] object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Signature ──────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileSignature className="h-4 w-4" />
            Signature email
          </CardTitle>
          <CardDescription>
            Bloc HTML affiché en pied de page des emails. Supporte le HTML pour
            la mise en forme.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="signatureHtml">Signature (HTML)</Label>
            <Textarea
              id="signatureHtml"
              value={signatureHtml}
              onChange={(e) => setSignatureHtml(e.target.value)}
              placeholder={'<p>Cordialement,<br/><strong>Votre équipe</strong></p>'}
              className="min-h-[120px] font-mono text-sm"
              rows={6}
            />
            {fieldErrors.signatureHtml && (
              <p className="text-xs text-destructive">
                {fieldErrors.signatureHtml[0]}
              </p>
            )}
          </div>
          {signatureHtml && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Aperçu</Label>
              <div
                className="rounded-md border bg-muted/30 p-4 text-sm"
                dangerouslySetInnerHTML={{ __html: signatureHtml }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Save Button + Feedback ─────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? "Enregistrement..." : "Enregistrer la configuration"}
        </Button>

        {saveResult && (
          <div
            className={`flex items-center gap-2 text-sm ${
              saveResult.success ? "text-green-500" : "text-destructive"
            }`}
          >
            {saveResult.success ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            {saveResult.message}
          </div>
        )}
      </div>

      <Separator />

      {/* ── Test Email ─────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Send className="h-4 w-4" />
            Tester la configuration
          </CardTitle>
          <CardDescription>
            Envoyez un email de test pour vérifier que la configuration
            fonctionne correctement. Enregistrez d&apos;abord vos modifications
            si nécessaire.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="test@example.com"
              />
            </div>
            <Button
              onClick={handleTestEmail}
              disabled={testSending || !testEmail}
              variant="outline"
              className="gap-2"
            >
              {testSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {testSending ? "Envoi..." : "Envoyer un test"}
            </Button>
          </div>

          {testResult && (
            <div
              className={`mt-3 flex items-center gap-2 text-sm ${
                testResult.success ? "text-green-500" : "text-destructive"
              }`}
            >
              {testResult.success ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              {testResult.message}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
