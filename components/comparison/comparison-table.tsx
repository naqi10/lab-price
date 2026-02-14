"use client";

import { formatCurrency, cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import MatchIndicator from "@/components/tests/match-indicator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Link2 } from "lucide-react";

interface ComparisonTableData {
  tests: {
    id: string;
    canonicalName: string;
    prices: Record<string, number | null>;
  }[];
  laboratories: { id: string; name: string }[];
  totals: Record<string, number>;
  bestLabId: string;
  matchMatrix?: Record<
    string,
    Record<string, { matchType: string; similarity: number; localTestName: string } | null>
  >;
  /** Callback when user wants to create/fix a manual mapping */
  onCreateMapping?: (testMappingId: string, laboratoryId: string) => void;
}

export default function ComparisonTable({
  data,
}: {
  data: ComparisonTableData;
}) {
  return (
    <TooltipProvider delayDuration={200}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Test</TableHead>
            {data.laboratories.map((lab) => (
              <TableHead
                key={lab.id}
                className={cn(lab.id === data.bestLabId && "bg-green-900/30")}
              >
                {lab.name}
                {lab.id === data.bestLabId && (
                  <Badge variant="success" className="ml-2">
                    Meilleur
                  </Badge>
                )}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.tests.map((test) => (
            <TableRow key={test.id}>
              <TableCell className="font-medium">{test.canonicalName}</TableCell>
              {data.laboratories.map((lab) => {
                const match = data.matchMatrix?.[test.id]?.[lab.id];
                const price = test.prices[lab.id];

                return (
                  <TableCell
                    key={lab.id}
                    className={cn(lab.id === data.bestLabId && "bg-green-900/30")}
                  >
                    {price != null ? (
                      <div className="space-y-1">
                        <div className="font-medium">{formatCurrency(price)}</div>
                        {match && (
                          <div className="flex items-center gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span>
                                  <MatchIndicator
                                    type={match.matchType}
                                    confidence={match.similarity}
                                    compact
                                  />
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs">
                                  Nom local : <strong>{match.localTestName}</strong>
                                </p>
                                <p className="text-xs">
                                  Confiance : {Math.round(match.similarity * 100)}%
                                </p>
                              </TooltipContent>
                            </Tooltip>
                            {/* Show "fix mapping" link for fuzzy/low-confidence matches */}
                            {match.matchType === "FUZZY" && data.onCreateMapping && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    onClick={() => data.onCreateMapping!(test.id, lab.id)}
                                    className="text-muted-foreground hover:text-primary"
                                  >
                                    <Link2 className="h-3 w-3" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  Corriger la correspondance
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <MatchIndicator type="NONE" compact />
                        {data.onCreateMapping && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => data.onCreateMapping!(test.id, lab.id)}
                                className="text-muted-foreground hover:text-primary"
                              >
                                <Link2 className="h-3 w-3" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>
                              Créer une correspondance manuelle
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    )}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell className="font-bold">Total</TableCell>
            {data.laboratories.map((lab) => (
              <TableCell
                key={lab.id}
                className={cn(
                  "font-bold",
                  lab.id === data.bestLabId && "bg-green-900/40 text-green-400"
                )}
              >
                {data.totals[lab.id] != null
                  ? formatCurrency(data.totals[lab.id])
                  : "-"}
              </TableCell>
            ))}
          </TableRow>
        </TableFooter>
      </Table>
    </TooltipProvider>
  );
}
