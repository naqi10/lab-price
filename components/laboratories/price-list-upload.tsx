"use client";

import { useState, useCallback } from "react";
import { Upload, FileSpreadsheet, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import PriceListPreview from "@/components/laboratories/price-list-preview";

type PreviewData = { headers: string[]; rows: string[][]; totalRows: number } | null;

export default function PriceListUpload({
  laboratoryId,
  onUploadComplete,
}: {
  laboratoryId: string;
  onUploadComplete?: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) setFile(e.dataTransfer.files[0]);
  }, []);

  const handleShowPreview = async () => {
    if (!file) return;
    setPreviewError(null);
    setPreviewData(null);
    setIsLoadingPreview(true);
    setPreviewOpen(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/laboratories/${laboratoryId}/price-lists/preview`, {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) {
        setPreviewError(json.message ?? "Erreur lors de l'aperçu");
        return;
      }
      setPreviewData(json.data);
    } catch {
      setPreviewError("Erreur lors de l'aperçu du fichier");
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleConfirmUpload = async () => {
    if (!file) return;
    setPreviewOpen(false);
    setPreviewData(null);
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (notes) formData.append("notes", notes);
      const res = await fetch(`/api/laboratories/${laboratoryId}/price-lists`, {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        setFile(null);
        setNotes("");
        onUploadComplete?.();
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleClosePreview = useCallback(() => {
    setPreviewOpen(false);
    setPreviewData(null);
    setPreviewError(null);
  }, []);

  const FileIcon = file?.name.endsWith(".pdf") ? FileText : FileSpreadsheet;

  return (
    <div className="space-y-4">
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"
        }`}
      >
        <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground mb-2">Glissez-déposez votre fichier ici ou</p>
        <label className="cursor-pointer">
          <span className="text-sm text-primary hover:underline">parcourir vos fichiers</span>
          <input
            type="file"
            accept=".xlsx,.xls,.pdf"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])}
          />
        </label>
        <p className="text-xs text-muted-foreground mt-2">Formats acceptés: .xlsx, .xls, .pdf</p>
      </div>

      {file && (
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <FileIcon className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} Ko</p>
              </div>
            </div>
            <button type="button" onClick={() => setFile(null)}>
              <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
            </button>
          </CardContent>
        </Card>
      )}

      {file && (
        <div className="space-y-2">
          <Label>Notes (optionnel)</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes sur cette liste de prix..."
          />
        </div>
      )}

      {file && (
        <Button
          onClick={handleShowPreview}
          disabled={isLoadingPreview}
          className="w-full"
        >
          {isLoadingPreview ? "Préparation de l'aperçu..." : "Télécharger la liste de prix"}
        </Button>
      )}

      <PriceListPreview
        open={previewOpen}
        onClose={handleClosePreview}
        onConfirm={handleConfirmUpload}
        data={previewData}
        isLoading={isUploading}
        error={previewError}
      />
    </div>
  );
}
