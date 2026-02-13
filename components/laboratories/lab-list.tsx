"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import LabCard from "./lab-card";

export default function LabList({ laboratories }: { laboratories: { id: string; name: string; code: string; isActive: boolean; _count?: { tests: number; priceLists: number } }[] }) {
  const [search, setSearch] = useState("");
  const filtered = laboratories.filter((lab) => lab.name.toLowerCase().includes(search.toLowerCase()) || lab.code.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input placeholder="Rechercher un laboratoire..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div>
      {filtered.length === 0 ? <p className="text-center text-muted-foreground py-8">Aucun laboratoire trouvé</p> : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{filtered.map((lab) => <LabCard key={lab.id} laboratory={lab} />)}</div>
      )}
    </div>
  );
}
