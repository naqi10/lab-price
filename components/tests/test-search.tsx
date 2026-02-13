"use client";

import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";
import MatchIndicator from "./match-indicator";

export default function TestSearch({ onSelect }: { onSelect: (test: any) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (debouncedQuery.length < 2) { setResults([]); return; }
    setIsLoading(true);
    fetch(`/api/tests?q=${encodeURIComponent(debouncedQuery)}`).then(r => r.json()).then(d => { if (d.success) setResults(d.data); }).finally(() => setIsLoading(false));
  }, [debouncedQuery]);

  return (
    <div className="relative">
      <div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher un test..." className="pl-9" /></div>
      {(results.length > 0 || isLoading) && (
        <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-lg max-h-[300px] overflow-auto">
          {isLoading ? <p className="p-3 text-sm text-muted-foreground">Recherche en cours...</p> : results.map((test) => (
            <div key={test.id} onClick={() => { onSelect(test); setQuery(""); setResults([]); }} className="flex items-center justify-between p-3 hover:bg-accent cursor-pointer border-b last:border-0">
              <div><p className="text-sm font-medium">{test.testName}</p><p className="text-xs text-muted-foreground">{test.laboratoryName}</p></div>
              <div className="flex items-center gap-2">{test.matchType && <MatchIndicator type={test.matchType} confidence={test.confidence} />}<span className="text-sm font-medium">{test.price} MAD</span></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
