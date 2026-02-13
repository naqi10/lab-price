"use client";

import LabCard from "./lab-card";

export default function LabList({
  laboratories,
  isLoading,
  onSelect,
}: {
  laboratories: { id: string; name: string; code: string; isActive: boolean; _count?: { priceLists: number } }[];
  isLoading?: boolean;
  onSelect?: (id: string) => void;
}) {
  if (isLoading) {
    return <p className="text-center text-muted-foreground py-8">Chargement...</p>;
  }

  if (laboratories.length === 0) {
    return <p className="text-center text-muted-foreground py-8">Aucun laboratoire trouvé</p>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {laboratories.map((lab) => (
        <LabCard key={lab.id} laboratory={lab} onSelect={onSelect} />
      ))}
    </div>
  );
}
