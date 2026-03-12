"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { Edit, Trash2, GitCompare, Plus, DollarSign, Clock3 } from "lucide-react";
import MatchIndicator from "./match-indicator";
import { formatTurnaroundShort } from "@/lib/turnaround";

export default function TestMappingTable({
  mappings,
  onEdit,
  onDelete,
  onNew,
}: {
  mappings: any[];
  onEdit: (m: any) => void;
  onDelete: (id: string) => void;
  onNew?: () => void;
}) {
  if (mappings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 border border-border/40 rounded-xl bg-card/30">
        <div className="h-12 w-12 rounded-full bg-muted/40 border border-border/50 flex items-center justify-center">
          <GitCompare className="h-5 w-5 text-muted-foreground/60" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-foreground/70">Aucune correspondance trouvée</p>
          <p className="text-xs text-muted-foreground mt-0.5">Créez une correspondance pour lier les noms de tests entre laboratoires</p>
        </div>
        {onNew && (
          <Button size="sm" variant="outline" onClick={onNew} className="mt-1">
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Nouvelle correspondance
          </Button>
        )}
      </div>
    );
  }

  return (
    <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom canonique</TableHead>
            <TableHead>Catégorie</TableHead>
            <TableHead>Correspondances</TableHead>
            <TableHead>Date de création</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {mappings.map((m) => (
            <TableRow key={m.id}>
              <TableCell className="font-medium">{m.canonicalName}</TableCell>
              <TableCell>
                {m.category ? (
                  <Badge variant="secondary">{m.category}</Badge>
                ) : (
                  <span className="text-muted-foreground text-xs">—</span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1.5">
                  {m.entries?.map((e: any) => (
                    <div key={e.id} className="rounded-lg border border-border/50 bg-card overflow-hidden">
                      {/* Lab name header */}
                      <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-primary/5 border-b border-primary/10">
                        <span className="text-[11px] font-semibold text-primary/80 uppercase tracking-wide">
                          {e.laboratory?.name}
                        </span>
                        <MatchIndicator type={e.matchType} confidence={e.similarity} />
                      </div>
                      {/* Test details */}
                      <div className="px-2.5 py-2">
                        <p className="text-xs font-medium text-foreground/90 leading-snug">{e.localTestName}</p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[11px] text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            {e.price != null ? Number(e.price).toFixed(2) : "—"}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Clock3 className="h-3 w-3" />
                            {formatTurnaroundShort(e.duration)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {m.createdAt ? new Date(m.createdAt).toLocaleDateString("fr-FR") : "—"}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(m)}
                    aria-label="Modifier"
                    title="Modifier"
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(m.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    aria-label="Supprimer"
                    title="Supprimer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
  );
}
