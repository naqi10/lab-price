import { formatCurrency, cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy } from "lucide-react";

export default function LabCostSummary({ labs, bestLabId }: { labs: { id: string; name: string; total: number; missingTests: number; isComplete: boolean }[]; bestLabId: string }) {
  const sorted = [...labs].sort((a, b) => { if (a.isComplete && !b.isComplete) return -1; if (!a.isComplete && b.isComplete) return 1; return a.total - b.total; });
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {sorted.map(lab => (
        <Card key={lab.id} className={cn(lab.id === bestLabId && "border-green-500 border-2")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-lg">{lab.name}</CardTitle>{lab.id === bestLabId && <Trophy className="h-5 w-5 text-green-600" />}</CardHeader>
          <CardContent><p className="text-3xl font-bold">{formatCurrency(lab.total)}</p>{lab.missingTests > 0 && <Badge variant="destructive" className="mt-2">{lab.missingTests} test(s) manquant(s)</Badge>}{lab.isComplete && lab.id === bestLabId && <Badge variant="success" className="mt-2">Recommandé</Badge>}</CardContent>
        </Card>
      ))}
    </div>
  );
}
