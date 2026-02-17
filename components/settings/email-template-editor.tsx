"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  Save,
  Trash2,
  FileText,
  Eye,
  Code,
  Loader2,
  CheckCircle,
  AlertCircle,
  Star,
  Copy,
} from "lucide-react";
import {
  renderTemplate,
  buildSampleVariables,
  getVariablesForType,
  getRawHtmlVariableNames,
  type TemplateVariableDescriptor,
} from "@/lib/email/template-renderer";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TemplateType = "QUOTATION" | "COMPARISON" | "GENERAL";

interface EmailTemplate {
  id: string;
  type: TemplateType;
  name: string;
  subject: string;
  htmlBody: string;
  isDefault: boolean;
  variables: TemplateVariableDescriptor[] | null;
  createdAt: string;
  updatedAt: string;
}

interface Feedback {
  success: boolean;
  message: string;
}

const TYPE_LABELS: Record<TemplateType, string> = {
  QUOTATION: "Devis",
  COMPARISON: "Comparaison",
  GENERAL: "Général",
};

const TYPE_ORDER: TemplateType[] = ["QUOTATION", "COMPARISON", "GENERAL"];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function EmailTemplateEditor() {
  // ── Template list state ─────────────────────────────────────────────────
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // ── Editor state ────────────────────────────────────────────────────────
  const [name, setName] = useState("");
  const [type, setType] = useState<TemplateType>("QUOTATION");
  const [subject, setSubject] = useState("");
  const [htmlBody, setHtmlBody] = useState("");
  const [isDefault, setIsDefault] = useState(false);

  // ── UI state ────────────────────────────────────────────────────────────
  const [previewMode, setPreviewMode] = useState<"edit" | "preview">("edit");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const bodyRef = useRef<HTMLTextAreaElement>(null);

  // ── Fetch templates ─────────────────────────────────────────────────────
  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch("/api/settings/email-templates");
      const data = await res.json();
      if (data.success) {
        setTemplates(data.data);
      }
    } catch (err) {
      console.error("Failed to load email templates:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // ── Select template ─────────────────────────────────────────────────────
  const selectTemplate = useCallback((template: EmailTemplate) => {
    setSelectedId(template.id);
    setName(template.name);
    setType(template.type);
    setSubject(template.subject);
    setHtmlBody(template.htmlBody);
    setIsDefault(template.isDefault);
    setIsCreating(false);
    setPreviewMode("edit");
    setFeedback(null);
    setFieldErrors({});
  }, []);

  // ── New template ────────────────────────────────────────────────────────
  const startNewTemplate = useCallback(() => {
    setSelectedId(null);
    setName("");
    setType("QUOTATION");
    setSubject("");
    setHtmlBody("");
    setIsDefault(false);
    setIsCreating(true);
    setPreviewMode("edit");
    setFeedback(null);
    setFieldErrors({});
  }, []);

  // ── Save (create or update) ─────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    setFeedback(null);
    setFieldErrors({});

    try {
      const payload = {
        type,
        name,
        subject,
        htmlBody,
        isDefault,
      };

      const url = isCreating
        ? "/api/settings/email-templates"
        : `/api/settings/email-templates/${selectedId}`;

      const res = await fetch(url, {
        method: isCreating ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        setFeedback({
          success: true,
          message: isCreating
            ? "Template créé avec succès"
            : "Template enregistré avec succès",
        });

        await fetchTemplates();

        if (isCreating && data.data?.id) {
          setSelectedId(data.data.id);
          setIsCreating(false);
        }
      } else {
        if (data.errors) setFieldErrors(data.errors);
        setFeedback({
          success: false,
          message: data.message || "Erreur lors de l'enregistrement",
        });
      }
    } catch (err) {
      setFeedback({
        success: false,
        message: "Erreur réseau lors de l'enregistrement",
      });
      console.error("Save template error:", err);
    } finally {
      setSaving(false);
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  // ── Delete ──────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!selectedId) return;
    setDeleting(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/settings/email-templates/${selectedId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (data.success) {
        setSelectedId(null);
        setIsCreating(false);
        setName("");
        setType("QUOTATION");
        setSubject("");
        setHtmlBody("");
        setIsDefault(false);
        await fetchTemplates();
        setFeedback({ success: true, message: "Template supprimé" });
      } else {
        setFeedback({
          success: false,
          message: data.message || "Erreur lors de la suppression",
        });
      }
    } catch (err) {
      setFeedback({
        success: false,
        message: "Erreur réseau lors de la suppression",
      });
      console.error("Delete template error:", err);
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  // ── Insert variable at cursor ──────────────────────────────────────────
  const insertVariable = (varName: string) => {
    const tag = `{{${varName}}}`;
    const textarea = bodyRef.current;
    if (!textarea) {
      setHtmlBody((prev) => prev + tag);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = htmlBody.slice(0, start);
    const after = htmlBody.slice(end);

    setHtmlBody(before + tag + after);

    requestAnimationFrame(() => {
      textarea.focus();
      const newPos = start + tag.length;
      textarea.setSelectionRange(newPos, newPos);
    });
  };

  // ── Live preview HTML ──────────────────────────────────────────────────
  const getPreviewHtml = useCallback((): string => {
    if (!htmlBody) return "";
    try {
      const descriptors = getVariablesForType(type);
      const sampleVars = buildSampleVariables(descriptors);
      const rawNames = getRawHtmlVariableNames(descriptors);
      return renderTemplate(htmlBody, sampleVars, {
        missingStrategy: "keep",
        rawHtmlVariables: rawNames,
      });
    } catch {
      return htmlBody;
    }
  }, [htmlBody, type]);

  // ── Variable chips for current type ────────────────────────────────────
  const currentVariables: TemplateVariableDescriptor[] =
    getVariablesForType(type);

  // ── Group templates by type ────────────────────────────────────────────
  const groupedTemplates: Record<TemplateType, EmailTemplate[]> = {
    QUOTATION: [],
    COMPARISON: [],
    GENERAL: [],
  };
  for (const t of templates) {
    groupedTemplates[t.type]?.push(t);
  }

  // ── Has editor content ─────────────────────────────────────────────────
  const hasEditorContent = isCreating || selectedId !== null;

  // ── Render ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">
            Chargement des templates...
          </span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
      {/* ── Left panel: Template list ─────────────────────────────────── */}
      <Card className="h-fit">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Templates</CardTitle>
            <Button
              size="sm"
              variant="outline"
              className="gap-1 h-8"
              onClick={startNewTemplate}
            >
              <Plus className="h-3.5 w-3.5" />
              Nouveau
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {templates.length === 0 ? (
            <div className="px-6 pb-6 text-sm text-muted-foreground text-center">
              Aucun template.
              <br />
              Créez votre premier template.
            </div>
          ) : (
            <div className="space-y-1">
              {TYPE_ORDER.map((typeKey) => {
                const group = groupedTemplates[typeKey];
                if (group.length === 0) return null;
                return (
                  <div key={typeKey}>
                    <div className="px-4 py-1.5">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {TYPE_LABELS[typeKey]}
                      </span>
                    </div>
                    {group.map((template) => (
                      <button
                        key={template.id}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-muted/50 flex items-center gap-2 ${
                          selectedId === template.id && !isCreating
                            ? "bg-muted text-foreground"
                            : "text-muted-foreground"
                        }`}
                        onClick={() => selectTemplate(template)}
                      >
                        <FileText className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate flex-1">
                          {template.name}
                        </span>
                        {template.isDefault && (
                          <Star className="h-3 w-3 shrink-0 text-yellow-500 fill-yellow-500" />
                        )}
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Right panel: Editor ────────────────────────────────────────── */}
      <div className="space-y-6">
        {!hasEditorContent ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <FileText className="h-10 w-10 mb-3 opacity-40" />
              <p className="text-sm">
                Sélectionnez un template ou créez-en un nouveau
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* ── Meta fields ──────────────────────────────────────────── */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base">
                  {isCreating ? "Nouveau template" : "Modifier le template"}
                </CardTitle>
                <CardDescription>
                  {isCreating
                    ? "Créez un nouveau modèle d'email personnalisable."
                    : "Modifiez le contenu et les paramètres de ce template."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Name + Type */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tpl-name">
                      Nom <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="tpl-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Mon template devis"
                    />
                    {fieldErrors.name && (
                      <p className="text-xs text-destructive">
                        {fieldErrors.name[0]}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Type <span className="text-destructive">*</span>
                    </Label>
                    <div className="flex gap-2">
                      {TYPE_ORDER.map((t) => (
                        <Button
                          key={t}
                          type="button"
                          variant={type === t ? "default" : "outline"}
                          size="sm"
                          onClick={() => setType(t)}
                        >
                          {TYPE_LABELS[t]}
                        </Button>
                      ))}
                    </div>
                    {fieldErrors.type && (
                      <p className="text-xs text-destructive">
                        {fieldErrors.type[0]}
                      </p>
                    )}
                  </div>
                </div>

                {/* Subject */}
                <div className="space-y-2">
                  <Label htmlFor="tpl-subject">
                    Sujet par défaut <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="tpl-subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Votre devis {{quotationNumber}} est prêt"
                  />
                  <p className="text-xs text-muted-foreground">
                    Vous pouvez utiliser les variables{" "}
                    <code className="text-xs">{`{{variable}}`}</code> dans le
                    sujet.
                  </p>
                  {fieldErrors.subject && (
                    <p className="text-xs text-destructive">
                      {fieldErrors.subject[0]}
                    </p>
                  )}
                </div>

                {/* Is default toggle */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isDefault}
                    onClick={() => setIsDefault(!isDefault)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                      isDefault ? "bg-primary" : "bg-muted"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-background shadow-lg transition-transform ${
                        isDefault ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                  <Label className="text-sm cursor-pointer" onClick={() => setIsDefault(!isDefault)}>
                    Template par défaut pour ce type
                  </Label>
                  {isDefault && (
                    <Badge variant="warning" className="gap-1 text-[11px]">
                      <Star className="h-2.5 w-2.5" />
                      Défaut
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* ── Variable chips ────────────────────────────────────────── */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  Variables disponibles
                </CardTitle>
                <CardDescription>
                  Cliquez sur une variable pour l&apos;insérer à la position du
                  curseur dans le corps HTML.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {currentVariables.map((v) => (
                    <button
                      key={v.name}
                      type="button"
                      onClick={() => insertVariable(v.name)}
                      className="inline-flex items-center gap-1.5 rounded-md border bg-muted/50 px-2.5 py-1.5 text-xs font-mono transition-colors hover:bg-primary/10 hover:border-primary/30 hover:text-primary"
                      title={v.description || v.label}
                    >
                      <Copy className="h-3 w-3 opacity-50" />
                      <span>{`{{${v.name}}}`}</span>
                      {v.isHtml && (
                        <Badge
                          variant="info"
                          className="text-[9px] px-1 py-0 h-3.5"
                        >
                          HTML
                        </Badge>
                      )}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* ── HTML Body + Preview ──────────────────────────────────── */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Corps du template</CardTitle>
                  <div className="flex gap-1 rounded-md border bg-muted p-0.5">
                    <button
                      type="button"
                      onClick={() => setPreviewMode("edit")}
                      className={`inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-xs font-medium transition-colors ${
                        previewMode === "edit"
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Code className="h-3 w-3" />
                      Code
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewMode("preview")}
                      className={`inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-xs font-medium transition-colors ${
                        previewMode === "preview"
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Eye className="h-3 w-3" />
                      Aperçu
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {previewMode === "edit" ? (
                  <div className="space-y-2">
                    <Textarea
                      ref={bodyRef}
                      id="tpl-body"
                      value={htmlBody}
                      onChange={(e) => setHtmlBody(e.target.value)}
                      placeholder="<html>...</html>"
                      className="min-h-[400px] font-mono text-sm leading-relaxed"
                      rows={20}
                    />
                    {fieldErrors.htmlBody && (
                      <p className="text-xs text-destructive">
                        {fieldErrors.htmlBody[0]}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Subject preview */}
                    {subject && (
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">
                          Sujet rendu
                        </Label>
                        <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
                          {(() => {
                            try {
                              const descriptors = getVariablesForType(type);
                              const sampleVars =
                                buildSampleVariables(descriptors);
                              return subject.replace(
                                /\{\{(\w+)\}\}/g,
                                (match, varName) => {
                                  const val = sampleVars[varName];
                                  return val != null ? String(val) : match;
                                },
                              );
                            } catch {
                              return subject;
                            }
                          })()}
                        </div>
                      </div>
                    )}

                    {/* HTML preview */}
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        Aperçu HTML (avec données d&apos;exemple)
                      </Label>
                      {htmlBody ? (
                        <div className="rounded-md border bg-white">
                          <iframe
                            srcDoc={getPreviewHtml()}
                            className="w-full min-h-[400px] rounded-md"
                            sandbox="allow-same-origin"
                            title="Aperçu du template"
                          />
                        </div>
                      ) : (
                        <div className="rounded-md border bg-muted/30 flex items-center justify-center py-16">
                          <p className="text-sm text-muted-foreground">
                            Aucun contenu HTML à prévisualiser
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ── Actions bar ──────────────────────────────────────────── */}
            <div className="flex items-center gap-3">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="gap-2"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {saving
                  ? "Enregistrement..."
                  : isCreating
                    ? "Créer le template"
                    : "Enregistrer"}
              </Button>

              {!isCreating && selectedId && (
                <Button
                  variant="destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                  disabled={deleting}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Supprimer
                </Button>
              )}

              {feedback && (
                <div
                  className={`flex items-center gap-2 text-sm ${
                    feedback.success ? "text-green-500" : "text-destructive"
                  }`}
                >
                  {feedback.success ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  {feedback.message}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── Delete confirmation dialog ─────────────────────────────────── */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer le template</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer le template &quot;{name}
              &quot; ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
              className="gap-2"
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              {deleting ? "Suppression..." : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
