import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { GitCompare } from "lucide-react";

interface RecentMapping {
  id: string;
  canonicalName: string;
  category: string | null;
  createdAt: string;
  _count: { entries: number };
}

export default function RecentMappings({ mappings }: { mappings: RecentMapping[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <GitCompare className="h-5 w-5" />
          Correspondances récentes
        </CardTitle>
      </CardHeader>
      <CardContent>
        {mappings.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Aucune correspondance créée.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom canonique</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Laboratoires liés</TableHead>
                <TableHead>Date de création</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mappings.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">
                    <Link href="/tests" className="hover:underline">
                      {m.canonicalName}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {m.category ? (
                      <Badge variant="outline">{m.category}</Badge>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>{m._count.entries}</TableCell>
                  <TableCell>{formatDate(m.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
