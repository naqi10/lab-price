"use client";

import { useEffect, useState } from "react";
import { X, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

interface CartItem {
  id: string;
  testMappingId: string;
  canonicalName: string;
}

interface LabTotal {
  id: string;
  name: string;
  total: number;
  testCount: number;
  isComplete: boolean;
}

export default function TestCart({
  items,
  onRemove,
  onClear,
  onCompare,
}: {
  items: CartItem[];
  onRemove: (id: string) => void;
  onClear: () => void;
  onCompare: () => void;
}) {
  const [labTotals, setLabTotals] = useState<LabTotal[]>([]);
  const [loadingTotals, setLoadingTotals] = useState(false);

  // Fetch running totals per lab whenever cart items change
  useEffect(() => {
    if (items.length === 0) {
      setLabTotals([]);
      return;
    }

    const testMappingIds = items.map((i) => i.testMappingId);
    setLoadingTotals(true);

    fetch("/api/comparison/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ testMappingIds }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setLabTotals(d.data || []);
      })
      .catch(() => {})
      .finally(() => setLoadingTotals(false));
  }, [items]);

  const bestLab = labTotals.find((l) => l.isComplete) || null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-lg">
          Tests sélectionnés ({items.length})
        </CardTitle>
        {items.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="text-muted-foreground"
          >
            Tout effacer
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Aucun test sélectionné.
          </p>
        ) : (
          <>
            {/* Selected tests list */}
            <ul className="space-y-2">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between rounded-md border p-2"
                >
                  <span className="text-sm">{item.canonicalName}</span>
                  <button onClick={() => onRemove(item.id)}>
                    <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                  </button>
                </li>
              ))}
            </ul>

            {/* Running totals per lab */}
            {items.length >= 1 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Total par laboratoire
                </p>
                {loadingTotals ? (
                  <p className="text-xs text-muted-foreground">Calcul...</p>
                ) : labTotals.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Aucune donnée de prix disponible
                  </p>
                ) : (
                  <ul className="space-y-1">
                    {labTotals.slice(0, 5).map((lab) => (
                      <li
                        key={lab.id}
                        className="flex items-center justify-between text-sm rounded px-2 py-1 border"
                      >
                        <span className="flex items-center gap-1 truncate">
                          {bestLab?.id === lab.id && (
                            <Trophy className="h-3 w-3 text-green-500 shrink-0" />
                          )}
                          <span className="truncate">{lab.name}</span>
                          {!lab.isComplete && (
                            <Badge variant="outline" className="text-[10px] ml-1 shrink-0">
                              {lab.testCount}/{items.length}
                            </Badge>
                          )}
                        </span>
                        <span className="font-medium ml-2 shrink-0">
                          {formatCurrency(lab.total)}
                        </span>
                      </li>
                    ))}
                    {labTotals.length > 5 && (
                      <p className="text-xs text-muted-foreground text-center">
                        +{labTotals.length - 5} autres laboratoires
                      </p>
                    )}
                  </ul>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
      {items.length > 0 && (
        <CardFooter>
          <Button onClick={onCompare} className="w-full">
            Comparer les prix ({items.length} tests)
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
