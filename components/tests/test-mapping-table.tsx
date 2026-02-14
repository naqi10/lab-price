"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit, Trash2 } from "lucide-react";
import MatchIndicator from "./match-indicator";

export default function TestMappingTable({
  mappings,
  onEdit,
  onDelete,
}: {
  mappings: any[];
  onEdit: (m: any) => void;
  onDelete: (id: string) => void;
}) {
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
        {mappings.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
              Aucune correspondance trouvée
            </TableCell>
          </TableRow>
        ) : (
          mappings.map((m) => (
            <TableRow key={m.id}>
              <TableCell className="font-medium">{m.canonicalName}</TableCell>
              <TableCell>
                {m.category && <Badge variant="outline">{m.category}</Badge>}
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {m.entries?.map((e: any) => (
                    <div key={e.id} className="flex items-center gap-1">
                      <MatchIndicator type={e.matchType} confidence={e.similarity} />
                      <span className="text-xs">
                        {e.laboratory?.name}: {e.localTestName}
                      </span>
                    </div>
                  ))}
                </div>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {m.createdAt
                  ? new Date(m.createdAt).toLocaleDateString("fr-FR")
                  : "—"}
              </TableCell>
              <TableCell className="text-right space-x-1">
                <Button variant="ghost" size="icon" onClick={() => onEdit(m)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onDelete(m.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
