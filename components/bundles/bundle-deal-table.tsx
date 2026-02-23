"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Edit, Trash2, Package, Plus } from "lucide-react";
import { CATEGORY_COLORS, DEFAULT_CATEGORY_COLOR } from "@/lib/data/bundles";
import { formatCurrency } from "@/lib/utils";

export default function BundleDealTable({
  deals,
  onEdit,
  onDelete,
  onNew,
}: {
  deals: any[];
  onEdit: (d: any) => void;
  onDelete: (id: string) => void;
  onNew?: () => void;
}) {
  if (deals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 border border-border/40 rounded-xl bg-card/30">
        <div className="h-12 w-12 rounded-full bg-muted/40 border border-border/50 flex items-center justify-center">
          <Package className="h-5 w-5 text-muted-foreground/60" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-foreground/70">Aucune offre groupée trouvée</p>
          <p className="text-xs text-muted-foreground mt-0.5">Créez une offre pour proposer des packs de tests</p>
        </div>
        {onNew && (
          <Button size="sm" variant="outline" onClick={onNew} className="mt-1">
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Nouvelle offre
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
            <TableHead className="w-[40px]"></TableHead>
            <TableHead>Nom</TableHead>
            <TableHead>Catégorie</TableHead>
            <TableHead className="text-center">Tests</TableHead>
            <TableHead className="text-right">Prix</TableHead>
            <TableHead className="text-center">Actif</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {deals.map((d) => {
            const colors = CATEGORY_COLORS[d.category] ?? DEFAULT_CATEGORY_COLOR;
            return (
              <TableRow key={d.id}>
                <TableCell>
                  <span className="text-lg" role="img">{d.icon}</span>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium text-sm">{d.dealName}</p>
                    {d.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1">{d.description}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={`text-[10px] border ${colors.badge}`}>
                    {d.category}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="secondary" className="text-xs">
                    {d.testMappingIds?.length ?? 0}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(d.customRate)}
                </TableCell>
                <TableCell className="text-center">
                  {d.isActive ? (
                    <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                  ) : (
                    <span className="inline-block h-2 w-2 rounded-full bg-muted-foreground/30" />
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="sm" onClick={() => onEdit(d)} aria-label="Modifier">
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
                          onClick={() => onDelete(d.id)}
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
            );
          })}
        </TableBody>
      </Table>
    </TooltipProvider>
  );
}
