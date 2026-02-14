import { formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Upload } from "lucide-react";

interface PriceListUpdate {
  labId: string;
  labName: string;
  labCode: string;
  lastUpdate: string | null;
  lastFileName: string | null;
  lastFileType: string | null;
}

export default function PriceListUpdates({ updates }: { updates: PriceListUpdate[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Upload className="h-5 w-5" />
          Dernière mise à jour des listes de prix
        </CardTitle>
      </CardHeader>
      <CardContent>
        {updates.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Aucun laboratoire configuré.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Laboratoire</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Fichier</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Dernière mise à jour</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {updates.map((u) => (
                <TableRow key={u.labId}>
                  <TableCell className="font-medium">{u.labName}</TableCell>
                  <TableCell>{u.labCode}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{u.lastFileName || "—"}</TableCell>
                  <TableCell>
                    {u.lastFileType ? (
                      <Badge variant="outline">{u.lastFileType}</Badge>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    {u.lastUpdate ? (
                      formatDate(u.lastUpdate)
                    ) : (
                      <span className="text-muted-foreground text-sm">Jamais</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
