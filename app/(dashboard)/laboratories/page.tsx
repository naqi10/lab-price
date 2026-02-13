"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/dashboard/header";
import LabList from "@/components/laboratories/lab-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLaboratories } from "@/hooks/use-laboratories";

export default function LaboratoriesPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const { laboratories, isLoading, error, refetch } = useLaboratories(search);

  return (
    <>
      <Header title="Laboratoires" />
      <div className="flex items-center justify-between mt-6 gap-4">
        <Input
          placeholder="Rechercher un laboratoire..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Button onClick={() => router.push("/laboratories/new")}>
          + Nouveau laboratoire
        </Button>
      </div>
      <div className="mt-6">
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <LabList
          laboratories={laboratories}
          isLoading={isLoading}
          onSelect={(id) => router.push(`/laboratories/${id}`)}
        />
      </div>
    </>
  );
}
