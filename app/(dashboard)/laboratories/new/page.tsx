"use client";

import { useRouter } from "next/navigation";
import Header from "@/components/dashboard/header";
import LabForm from "@/components/laboratories/lab-form";

export default function NewLaboratoryPage() {
  const router = useRouter();

  const handleSubmit = async (data: any) => {
    const res = await fetch("/api/laboratories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (result.success) {
      router.push(`/laboratories/${result.data.id}`);
    }
    return result;
  };

  return (
    <>
      <Header title="Nouveau laboratoire" />
      <div className="mt-6 max-w-2xl">
        <LabForm onSubmit={handleSubmit} />
      </div>
    </>
  );
}
