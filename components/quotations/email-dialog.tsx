"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Mail,
  Loader2,
  Eye,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Send,
} from "lucide-react";
import CustomerCombobox from "@/components/customers/customer-combobox";

type Step = "compose" | "preview" | "success" | "error";

interface QuotationData {
  id: string;
  quotationNumber: string;
  title: string;
  clientName?: string | null;
  clientEmail?: string | null;
  totalPrice: number;
  validUntil: string;
  laboratory?: { id: string; name: string; code?: string };
  items?: { id: string }[];
}

export default function EmailDialog({
  open,
  onClose,
  quotationId,
  quotation,
  defaultTo,
}: {
  open: boolean;
  onClose: () => void;
  quotationId: string;
  quotation?: QuotationData | null;
  defaultTo?: string;
}) {
  const [selectedCustomer, setSelectedCustomer] = useState<{
    id: string;
    name: string;
    email: string;
  } | null>(null);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("Veuillez trouver ci-joint votre devis.");
  const [step, setStep] = useState<Step>("compose");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewSubject, setPreviewSubject] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [templateLoaded, setTemplateLoaded] = useState(false);

  // Load default QUOTATION template on open to pre-fill subject
  const loadDefaultTemplate = useCallback(async () => {
    if (templateLoaded) return;
    try {
      const res = await fetch("/api/settings/email-templates?type=QUOTATION");
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        const defaultTemplate = data.data.find(
          (t: { type: string; isDefault: boolean }) =>
            t.type === "QUOTATION" && t.isDefault
        );
        if (defaultTemplate) {
          setSubject(defaultTemplate.subject || "Votre devis - Lab Price Comparator");
        } else if (data.data.length > 0) {
          const firstQuotation = data.data.find(
            (t: { type: string }) => t.type === "QUOTATION"
          );
          if (firstQuotation) {
            setSubject(firstQuotation.subject || "Votre devis - Lab Price Comparator");
          }
        }
      }
    } catch {
      // Fallback subject already set
    }
    setTemplateLoaded(true);
  }, [templateLoaded]);

  useEffect(() => {
    if (open) {
      loadDefaultTemplate();
    }
  }, [open, loadDefaultTemplate]);

  // Set default subject when no template loaded
  useEffect(() => {
    if (open && !subject) {
      setSubject("Votre devis - Lab Price Comparator");
    }
  }, [open, subject]);

  // Build template variables from quotation data
  const buildTemplateVariables = useCallback(() => {
    const vars: Record<string, string> = {};

    if (quotation) {
      vars.quotationNumber = quotation.quotationNumber || "";
      vars.title = quotation.title || "";
      vars.clientName =
        selectedCustomer?.name || quotation.clientName || "";
      vars.clientEmail =
        selectedCustomer?.email || quotation.clientEmail || "";
      vars.laboratoryName = quotation.laboratory?.name || "";
      vars.totalPrice = new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "MAD",
      }).format(quotation.totalPrice || 0);
      if (quotation.validUntil) {
        vars.validUntil = new Date(quotation.validUntil).toLocaleDateString(
          "fr-FR"
        );
      }
      vars.itemCount = String(quotation.items?.length || 0);
    }

    if (message) {
      vars.customMessage = message;
    }

    return vars;
  }, [quotation, selectedCustomer, message]);

  // Fetch rendered preview from the API
  const handlePreview = async () => {
    if (!selectedCustomer) return;
    setIsLoadingPreview(true);
    setErrorMessage("");

    try {
      const variables = buildTemplateVariables();
      const res = await fetch("/api/settings/email-templates/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "QUOTATION",
          variables,
          subject,
          // If there's a default template, the API will use it
          // Otherwise it falls back to the inline htmlBody
          ...(await getDefaultTemplateId()),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setPreviewHtml(data.data.html);
        setPreviewSubject(data.data.subject);
        setStep("preview");
      } else {
        setErrorMessage(
          data.message || "Erreur lors de la génération de l'aperçu"
        );
      }
    } catch {
      setErrorMessage("Erreur de connexion au serveur");
    } finally {
      setIsLoadingPreview(false);
    }
  };

  // Helper to get the default template ID for QUOTATION type
  const getDefaultTemplateId = async (): Promise<{
    templateId?: string;
    htmlBody?: string;
  }> => {
    try {
      const res = await fetch("/api/settings/email-templates?type=QUOTATION");
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        const defaultTemplate = data.data.find(
          (t: { type: string; isDefault: boolean }) =>
            t.type === "QUOTATION" && t.isDefault
        );
        if (defaultTemplate) {
          return { templateId: defaultTemplate.id };
        }
        const firstQuotation = data.data.find(
          (t: { type: string }) => t.type === "QUOTATION"
        );
        if (firstQuotation) {
          return { templateId: firstQuotation.id };
        }
      }
    } catch {
      // Fall through to fallback
    }
    // Fallback: provide a minimal HTML body so the preview API doesn't reject
    return {
      htmlBody: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <h2>{{quotationNumber}} — {{title}}</h2>
        <p>Bonjour {{clientName}},</p>
        <p>{{customMessage}}</p>
        <p><strong>Laboratoire :</strong> {{laboratoryName}}</p>
        <p><strong>Montant total :</strong> {{totalPrice}}</p>
        <p><strong>Valide jusqu'au :</strong> {{validUntil}}</p>
        {{signatureHtml}}
      </div>`,
    };
  };

  const handleSend = async () => {
    if (!selectedCustomer) return;
    setIsLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch(`/api/quotations/${quotationId}/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quotationId,
          to: [selectedCustomer.email],
          subject: previewSubject || subject,
          message,
          customerId: selectedCustomer.id,
        }),
      });

      if (res.ok) {
        setStep("success");
        setTimeout(() => {
          handleClose();
        }, 2500);
      } else {
        const data = await res.json().catch(() => null);
        setErrorMessage(
          data?.message || "Erreur lors de l'envoi de l'email"
        );
        setStep("error");
      }
    } catch {
      setErrorMessage("Erreur de connexion au serveur");
      setStep("error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setStep("compose");
    setPreviewHtml("");
    setPreviewSubject("");
    setErrorMessage("");
    setSelectedCustomer(null);
    setTemplateLoaded(false);
    setSubject("");
    setMessage("Veuillez trouver ci-joint votre devis.");
    onClose();
  };

  const handleBackToCompose = () => {
    setStep("compose");
    setPreviewHtml("");
    setPreviewSubject("");
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            {step === "compose" && "Envoyer le devis par email"}
            {step === "preview" && "Aperçu de l'email"}
            {step === "success" && "Email envoyé"}
            {step === "error" && "Erreur d'envoi"}
          </DialogTitle>
          {step === "compose" && (
            <DialogDescription>
              Sélectionnez un destinataire, personnalisez le message puis
              prévisualisez avant d'envoyer.
            </DialogDescription>
          )}
          {step === "preview" && (
            <DialogDescription>
              Vérifiez le contenu de l'email avant de confirmer l'envoi.
            </DialogDescription>
          )}
        </DialogHeader>

        {/* Step indicators */}
        {(step === "compose" || step === "preview") && (
          <div className="flex items-center gap-2 px-1 py-2">
            <StepIndicator
              number={1}
              label="Composer"
              active={step === "compose"}
              completed={step === "preview"}
            />
            <div className="flex-1 h-px bg-border" />
            <StepIndicator
              number={2}
              label="Aperçu"
              active={step === "preview"}
              completed={false}
            />
            <div className="flex-1 h-px bg-border" />
            <StepIndicator number={3} label="Envoyer" active={false} completed={false} />
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {/* COMPOSE STEP */}
          {step === "compose" && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Destinataire *</Label>
                <CustomerCombobox
                  selectedCustomer={selectedCustomer}
                  onSelect={setSelectedCustomer}
                />
              </div>
              <div className="space-y-2">
                <Label>Sujet</Label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Sujet de l'email"
                />
              </div>
              <div className="space-y-2">
                <Label>Message personnalisé</Label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  placeholder="Message qui sera inclus dans l'email"
                />
              </div>
              {quotation && (
                <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">
                    Résumé du devis
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">N° :</span>{" "}
                    {quotation.quotationNumber}
                  </p>
                  {quotation.laboratory && (
                    <p className="text-sm">
                      <span className="font-medium">Laboratoire :</span>{" "}
                      {quotation.laboratory.name}
                    </p>
                  )}
                  <p className="text-sm">
                    <span className="font-medium">Montant :</span>{" "}
                    {new Intl.NumberFormat("fr-FR", {
                      style: "currency",
                      currency: "MAD",
                    }).format(quotation.totalPrice || 0)}
                  </p>
                </div>
              )}
              {errorMessage && (
                <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-sm text-destructive">
                  {errorMessage}
                </div>
              )}
            </div>
          )}

          {/* PREVIEW STEP */}
          {step === "preview" && (
            <div className="space-y-4 py-2">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">À :</span>{" "}
                  {selectedCustomer?.name} &lt;{selectedCustomer?.email}&gt;
                </p>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">Sujet :</span>{" "}
                  {previewSubject || subject}
                </p>
              </div>
              <div className="border rounded-lg overflow-hidden bg-white">
                <div className="max-h-[400px] overflow-y-auto">
                  <iframe
                    srcDoc={previewHtml}
                    title="Aperçu de l'email"
                    className="w-full border-0"
                    style={{ minHeight: 300 }}
                    sandbox="allow-same-origin"
                    onLoad={(e) => {
                      const iframe = e.target as HTMLIFrameElement;
                      if (iframe.contentDocument?.body) {
                        const height =
                          iframe.contentDocument.body.scrollHeight + 20;
                        iframe.style.height = `${Math.min(height, 400)}px`;
                      }
                    }}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Le PDF du devis sera joint automatiquement à l'email.
              </p>
            </div>
          )}

          {/* SUCCESS STEP */}
          {step === "success" && (
            <div className="py-8 text-center space-y-3">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
              <p className="text-green-400 font-medium text-lg">
                Email envoyé avec succès !
              </p>
              <p className="text-sm text-muted-foreground">
                Le devis a été envoyé à {selectedCustomer?.email}
              </p>
            </div>
          )}

          {/* ERROR STEP */}
          {step === "error" && (
            <div className="py-8 text-center space-y-3">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
              <p className="text-red-400 font-medium text-lg">
                Échec de l'envoi
              </p>
              <p className="text-sm text-muted-foreground">{errorMessage}</p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {step === "compose" && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Annuler
              </Button>
              <Button
                onClick={handlePreview}
                disabled={isLoadingPreview || !selectedCustomer}
              >
                {isLoadingPreview ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Chargement...
                  </>
                ) : (
                  <>
                    <Eye className="mr-2 h-4 w-4" />
                    Aperçu
                  </>
                )}
              </Button>
            </>
          )}

          {step === "preview" && (
            <>
              <Button variant="outline" onClick={handleBackToCompose}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Modifier
              </Button>
              <Button onClick={handleSend} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Confirmer l'envoi
                  </>
                )}
              </Button>
            </>
          )}

          {(step === "success" || step === "error") && (
            <>
              {step === "error" && (
                <Button variant="outline" onClick={handleBackToCompose}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Réessayer
                </Button>
              )}
              <Button onClick={handleClose}>
                Fermer
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Small step indicator component for the compose/preview flow. */
function StepIndicator({
  number,
  label,
  active,
  completed,
}: {
  number: number;
  label: string;
  active: boolean;
  completed: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium transition-colors ${
          completed
            ? "bg-primary text-primary-foreground"
            : active
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
        }`}
      >
        {completed ? "✓" : number}
      </div>
      <span
        className={`text-xs font-medium ${
          active || completed ? "text-foreground" : "text-muted-foreground"
        }`}
      >
        {label}
      </span>
    </div>
  );
}
