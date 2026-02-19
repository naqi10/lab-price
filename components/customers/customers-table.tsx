"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Edit, Trash2, Contact, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function CustomersTable({
  customers,
  onEdit,
  onDelete,
  onNew,
}: {
  customers: any[];
  onEdit: (c: any) => void;
  onDelete: (id: string) => void;
  onNew?: () => void;
}) {
  const router = useRouter();

  if (customers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 border border-border/40 rounded-xl bg-card/30">
        <div className="h-12 w-12 rounded-full bg-muted/40 border border-border/50 flex items-center justify-center">
          <Contact className="h-5 w-5 text-muted-foreground/60" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-foreground/70">Aucun client trouvé</p>
          <p className="text-xs text-muted-foreground mt-0.5">Créez un client pour commencer</p>
        </div>
        {onNew && (
          <Button size="sm" variant="outline" onClick={onNew} className="mt-1">
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Nouveau client
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
            <TableHead>Nom</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Téléphone</TableHead>
            <TableHead>Entreprise</TableHead>
            <TableHead>Estimations</TableHead>
            <TableHead>Emails envoyés</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((c) => (
            <TableRow
              key={c.id}
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => router.push(`/customers/${c.id}`)}
            >
              <TableCell className="font-medium">{c.name}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{c.email}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{c.phone || "—"}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{c.company || "—"}</TableCell>
              <TableCell>
                <span className="inline-flex items-center justify-center h-6 min-w-[1.5rem] rounded-full bg-primary/10 text-primary text-xs font-medium px-2">
                  {c._count?.estimates ?? 0}
                </span>
              </TableCell>
              <TableCell>
                <span className="text-sm text-muted-foreground">{c._count?.emailLogs ?? 0}</span>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(c)}
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
                        onClick={() => onDelete(c.id)}
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
