"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, Loader2, FolderOpen, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Draft {
  id: string;
  name: string;
  testMappingIds: string[];
  createdAt: string;
  updatedAt: string;
}

interface DraftManagerProps {
  currentTestMappingIds: string[];
  onLoad: (testMappingIds: string[]) => void;
}

export default function DraftManager({ currentTestMappingIds, onLoad }: DraftManagerProps) {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingDraftId, setDeletingDraftId] = useState<string | null>(null);

  const fetchDrafts = useCallback(async () => {
    try {
      const res = await fetch("/api/comparison/drafts");
      const data = await res.json();
      if (data.success) setDrafts(data.data ?? []);
    } catch {
      setDrafts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDrafts();
  }, [fetchDrafts]);

  const handleSave = async () => {
    if (!draftName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/comparison/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: draftName.trim(),
          testMappingIds: currentTestMappingIds,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setDraftName("");
        setSaveDialogOpen(false);
        fetchDrafts();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleLoad = (ids: string[]) => {
    onLoad(ids);
  };

  const handleDelete = async (id: string) => {
    setDeletingDraftId(id);
    try {
      const res = await fetch(`/api/comparison/drafts/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) fetchDrafts();
    } finally {
      setDeletingDraftId(null);
    }
  };

  return (
    <div className="space-y-4 rounded-lg border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-medium">Brouillons de comparaison</h3>
        <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" disabled={currentTestMappingIds.length === 0}>
              <Save className="mr-2 h-4 w-4" />
              Sauvegarder la sélection
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nom du brouillon</DialogTitle>
            </DialogHeader>
            <div className="grid gap-2 py-2">
              <Label htmlFor="draft-name">Nom</Label>
              <Input
                id="draft-name"
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                placeholder="Ex. Panier client XYZ"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleSave} disabled={saving || !draftName.trim()}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Sauvegarder
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Chargement des brouillons...</p>
      ) : drafts.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucun brouillon enregistré.</p>
      ) : (
        <ul className="space-y-2">
          {drafts.map((draft) => (
            <li
              key={draft.id}
              className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
            >
              <div className="min-w-0 flex-1">
                <span className="font-medium truncate block">{draft.name}</span>
                <span className="text-xs text-muted-foreground">
                  {draft.testMappingIds.length} test{draft.testMappingIds.length !== 1 ? "s" : ""} ·{" "}
                  {formatDate(new Date(draft.updatedAt))}
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0 ml-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleLoad(draft.testMappingIds)}
                  title="Charger"
                >
                  <FolderOpen className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(draft.id)}
                  disabled={deletingDraftId === draft.id}
                  title="Supprimer"
                  className="text-destructive hover:text-destructive"
                >
                  {deletingDraftId === draft.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
