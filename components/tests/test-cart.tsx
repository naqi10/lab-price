"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function TestCart({ items, onRemove, onClear, onCompare }: { items: { id: string; testMappingId: string; canonicalName: string }[]; onRemove: (id: string) => void; onClear: () => void; onCompare: () => void }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-lg">Tests sélectionnés ({items.length})</CardTitle>
        {items.length > 0 && <Button variant="ghost" size="sm" onClick={onClear} className="text-muted-foreground">Tout effacer</Button>}
      </CardHeader>
      <CardContent>
        {items.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">Aucun test sélectionné.</p> : (
          <ul className="space-y-2">{items.map((item) => <li key={item.id} className="flex items-center justify-between rounded-md border p-2"><span className="text-sm">{item.canonicalName}</span><button onClick={() => onRemove(item.id)}><X className="h-4 w-4 text-muted-foreground hover:text-destructive" /></button></li>)}</ul>
        )}
      </CardContent>
      {items.length > 0 && <CardFooter><Button onClick={onCompare} className="w-full">Comparer les prix ({items.length} tests)</Button></CardFooter>}
    </Card>
  );
}
