"use client";

import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2 } from "lucide-react";

export default function PriceListTable({
  priceLists,
  onDelete,
}: {
  priceLists: any[];
  onDelete?: (id: string) => void;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Fichier</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Tests</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Statut</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {priceLists.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
              Aucune liste de prix
            </TableCell>
          </TableRow>
        ) : (
          priceLists.map((pl) => (
            <TableRow key={pl.id}>
              <TableCell className="font-medium">{pl.fileName}</TableCell>
              <TableCell><Badge variant="outline">{pl.fileType}</Badge></TableCell>
              <TableCell>{pl._count?.tests || 0}</TableCell>
              <TableCell>{formatDate(new Date(pl.createdAt))}</TableCell>
              <TableCell>
                <Badge variant={pl.isActive ? "success" : "secondary"}>
                  {pl.isActive ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="icon" onClick={() => onDelete?.(pl.id)}>
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
