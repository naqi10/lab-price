import { formatCurrency, cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy } from "lucide-react";

export default function LabCostSummary({
  labs,
  bestLabId,
}: {
  labs: {
    id: string;
    name: string;
    total: number;
    missingTests: number;
    isComplete: boolean;
  }[];
  bestLabId: string;
}) {
  const bestLab = labs.find((l) => l.id === bestLabId);
  const sorted = [...labs].sort((a, b) => {
    if (a.isComplete && !b.isComplete) return -1;
    if (!a.isComplete && b.isComplete) return 1;
    return a.total - b.total;
  });

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {sorted.map((lab) => {
        const isBest = lab.id === bestLabId;
        const diff = !isBest && bestLab ? lab.total - bestLab.total : 0;
        const pct =
          bestLab && bestLab.total > 0 && !isBest
            ? Math.round((diff / bestLab.total) * 100)
            : 0;

        return (
          <Card
            key={lab.id}
            className={cn(isBest && "border-green-500 border-2")}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg">{lab.name}</CardTitle>
              {isBest && <Trophy className="h-5 w-5 text-green-600" />}
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{formatCurrency(lab.total)}</p>
              {!isBest && bestLab && diff > 0 && (
                <p className="text-sm text-muted-foreground mt-1">
                  +{formatCurrency(diff)} vs {bestLab.name} ({pct}% plus cher)
                </p>
              )}
              {lab.missingTests > 0 && (
                <Badge variant="destructive" className="mt-2">
                  {lab.missingTests} test(s) manquant(s)
                </Badge>
              )}
              {lab.isComplete && isBest && (
                <Badge variant="success" className="mt-2">
                  Recommandé
                </Badge>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
