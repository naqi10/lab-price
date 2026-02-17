"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, RotateCcw, Download, Loader2 } from "lucide-react";

interface PriceListActionsProps {
  priceListId: string;
  laboratoryId: string;
  isActive: boolean;
  onDelete?: (id: string) => void;
  onActivate?: () => void;
}

export default function PriceListActions({
  priceListId,
  laboratoryId,
  isActive,
  onDelete,
  onActivate,
}: PriceListActionsProps) {
  const [activating, setActivating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleActivate = async () => {
    if (!onActivate) return;
    setActivating(true);
    try {
      const res = await fetch(
        `/api/laboratories/${laboratoryId}/price-lists/${priceListId}/activate`,
        { method: "POST" }
      );
      const data = await res.json();
      if (data.success) {
        onActivate();
      }
    } finally {
      setActivating(false);
    }
  };

  const handleExport = () => {
    window.open(
      `/api/laboratories/${laboratoryId}/price-lists/${priceListId}/export`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    setDeleting(true);
    try {
      await onDelete(priceListId);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex items-center justify-end gap-1">
      <Button
        variant="ghost"
        size="icon"
        onClick={handleExport}
        aria-label="Exporter en Excel"
        className="text-muted-foreground hover:text-foreground"
      >
        <Download className="h-4 w-4" />
      </Button>
      {!isActive && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleActivate}
          disabled={activating}
          aria-label="Réactiver cette liste"
          className="text-muted-foreground hover:text-foreground"
        >
          {activating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RotateCcw className="h-4 w-4" />
          )}
        </Button>
      )}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleDelete}
        disabled={deleting}
        aria-label="Supprimer"
        className="text-muted-foreground hover:text-destructive"
      >
        {deleting ? (
          <Loader2 className="h-4 w-4 animate-spin text-destructive" />
        ) : (
          <Trash2 className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
