import Link from "next/link";
import { FlaskConical, FileSpreadsheet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function LabCard({
  laboratory,
  onSelect,
}: {
  laboratory: { id: string; name: string; code: string; isActive: boolean; _count?: { priceLists: number } };
  onSelect?: (id: string) => void;
}) {
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onSelect?.(laboratory.id)}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="flex items-center gap-2"><FlaskConical className="h-5 w-5 text-primary" /><CardTitle className="text-lg">{laboratory.name}</CardTitle></div>
        <Badge variant={laboratory.isActive ? "success" : "secondary"}>{laboratory.isActive ? "Actif" : "Inactif"}</Badge>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-3">Code: {laboratory.code}</p>
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
          <span className="flex items-center gap-1"><FileSpreadsheet className="h-4 w-4" />{laboratory._count?.priceLists || 0} listes de prix</span>
        </div>
        <Link href={`/laboratories/${laboratory.id}`}><Button variant="outline" size="sm" className="w-full">Voir détails</Button></Link>
      </CardContent>
    </Card>
  );
}
