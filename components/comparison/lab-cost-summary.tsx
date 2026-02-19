import { formatCurrency, cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Clock, Zap } from "lucide-react";

interface LabCostSummaryProps {
  labs: {
    id: string;
    name: string;
    total: number;
    missingTests: number;
    isComplete: boolean;
    turnaroundTimes: { testName: string; tat: string }[];
  }[];
  bestLabId: string;
  /** Per-test lab selections (testMappingId → labId) */
  selections?: Record<string, string>;
  selectionTotal?: number;
  testNames?: string[];
  testMappingIds?: string[];
  laboratories?: { id: string; name: string }[];
}

export default function LabCostSummary({
  labs,
  bestLabId,
  selections,
  selectionTotal = 0,
  testNames = [],
  testMappingIds = [],
  laboratories = [],
}: LabCostSummaryProps) {
  const bestLab = labs.find((l) => l.id === bestLabId);
  const sorted = [...labs].sort((a, b) => {
    if (a.isComplete && !b.isComplete) return -1;
    if (!a.isComplete && b.isComplete) return 1;
    return a.total - b.total;
  });

  const hasSelections = selections && Object.keys(selections).length > 0;

  const labNameMap = new Map(laboratories.map((l) => [l.id, l.name]));

  // Count how many labs are involved in the selection
  const involvedLabIds = hasSelections
    ? [...new Set(Object.values(selections!))]
    : [];
  const isMultiLab = involvedLabIds.length > 1;

  return (
    <div key={hasSelections ? "summary-sel" : "summary-def"} className="space-y-4">
      {/* Selection summary card */}
      {hasSelections && (
        <Card className="border-blue-500 border-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-500" />
              {isMultiLab ? "Sélection optimisée multi-laboratoires" : "Sélection personnalisée"}
            </CardTitle>
            <Badge variant="info">{involvedLabIds.length} labo{involvedLabIds.length > 1 ? "s" : ""}</Badge>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(selectionTotal)}</p>
            {bestLab && selectionTotal < bestLab.total && (
              <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                -{formatCurrency(bestLab.total - selectionTotal)} vs {bestLab.name} ({Math.round(((bestLab.total - selectionTotal) / bestLab.total) * 100)}% d&apos;économie)
              </p>
            )}
            {bestLab && selectionTotal > bestLab.total && (
              <p className="text-sm text-muted-foreground mt-1">
                +{formatCurrency(selectionTotal - bestLab.total)} vs {bestLab.name} (optimisé pour la rapidité)
              </p>
            )}
            <div className="mt-3 space-y-1">
              {testMappingIds.map((tmId, i) => {
                const labId = selections![tmId];
                const labName = labId ? labNameMap.get(labId) ?? "—" : "—";
                return (
                  <div key={tmId} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{testNames[i] ?? tmId}</span>
                    <Badge variant="outline" className="text-xs">{labName}</Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Per-lab cards */}
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
              className={cn(isBest && !hasSelections && "border-green-500 border-2")}
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
                {lab.turnaroundTimes.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {lab.turnaroundTimes.map(({ testName, tat }) => (
                      <div key={testName} className="flex items-start gap-1.5 text-sm text-muted-foreground">
                        <Clock className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                        <span>
                          <span className="font-medium text-foreground">{testName}</span>
                          {" — "}
                          {tat}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                {lab.missingTests > 0 && (
                  <Badge variant="destructive" className="mt-2">
                    {lab.missingTests} test(s) manquant(s)
                  </Badge>
                )}
                {lab.isComplete && isBest && !hasSelections && (
                  <Badge variant="success" className="mt-2">
                    Recommandé
                  </Badge>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
