"use client";

import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function QuotationForm({ onSubmit, isLoading }: { onSubmit: (data: any) => Promise<void>; isLoading?: boolean }) {
  const { register, handleSubmit, formState: { errors } } = useForm();
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2"><Label htmlFor="clientName">Nom du client *</Label><Input id="clientName" {...register("clientName", { required: "Champ requis" })} placeholder="Nom complet" />{errors.clientName && <p className="text-sm text-destructive">{errors.clientName.message as string}</p>}</div>
        <div className="space-y-2"><Label htmlFor="clientEmail">Email du client *</Label><Input id="clientEmail" type="email" {...register("clientEmail", { required: "Champ requis" })} placeholder="client@example.com" />{errors.clientEmail && <p className="text-sm text-destructive">{errors.clientEmail.message as string}</p>}</div>
      </div>
      <div className="space-y-2"><Label htmlFor="clientCompany">Société</Label><Input id="clientCompany" {...register("clientCompany")} placeholder="Nom de la société" /></div>
      <div className="space-y-2"><Label htmlFor="notes">Notes</Label><Textarea id="notes" {...register("notes")} placeholder="Notes supplémentaires..." /></div>
      <Button type="submit" disabled={isLoading}>{isLoading ? "Génération en cours..." : "Générer le devis"}</Button>
    </form>
  );
}
