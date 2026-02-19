"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Edit, Trash2, GitCompare, Plus } from "lucide-react";
import MatchIndicator from "./match-indicator";

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
    <TooltipProvider>
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
                <div className="flex flex-col gap-1">
                  {m.entries?.map((e: any) => (
                    <div key={e.id} className="flex items-center gap-1.5">
                      <MatchIndicator type={e.matchType} confidence={e.similarity} />
                      <span className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground/80">{e.laboratory?.name}</span>
                        {": "}
                        {e.localTestName}
                      </span>
                    </div>
                  ))}
                </div>
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {m.createdAt ? new Date(m.createdAt).toLocaleDateString("fr-FR") : "—"}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(m)}
                        aria-label="Modifier"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Modifier</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(m.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        aria-label="Supprimer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Supprimer</TooltipContent>
                  </Tooltip>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TooltipProvider>
  );
}
