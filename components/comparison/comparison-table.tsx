"use client";

import { formatCurrency, cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function ComparisonTable({ data }: { data: { tests: { canonicalName: string; prices: Record<string, number | null> }[]; laboratories: { id: string; name: string }[]; totals: Record<string, number>; bestLabId: string } }) {
  return (
    <Table>
      <TableHeader><TableRow><TableHead>Test</TableHead>{data.laboratories.map(lab => <TableHead key={lab.id} className={cn(lab.id === data.bestLabId && "bg-green-900/30")}>{lab.name}{lab.id === data.bestLabId && <Badge variant="success" className="ml-2">Meilleur</Badge>}</TableHead>)}</TableRow></TableHeader>
      <TableBody>{data.tests.map((test, i) => <TableRow key={i}><TableCell className="font-medium">{test.canonicalName}</TableCell>{data.laboratories.map(lab => <TableCell key={lab.id} className={cn(lab.id === data.bestLabId && "bg-green-900/30")}>{test.prices[lab.id] != null ? formatCurrency(test.prices[lab.id]!) : <span className="text-destructive text-xs">N/D</span>}</TableCell>)}</TableRow>)}</TableBody>
      <TableFooter><TableRow><TableCell className="font-bold">Total</TableCell>{data.laboratories.map(lab => <TableCell key={lab.id} className={cn("font-bold", lab.id === data.bestLabId && "bg-green-900/40 text-green-400")}>{data.totals[lab.id] != null ? formatCurrency(data.totals[lab.id]) : "-"}</TableCell>)}</TableRow></TableFooter>
    </Table>
  );
}
