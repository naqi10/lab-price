"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { laboratorySchema } from "@/lib/validations/laboratory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { z } from "zod";

type LabFormData = z.infer<typeof laboratorySchema>;

export default function LabForm({ defaultValues, onSubmit, isLoading }: { defaultValues?: Partial<LabFormData>; onSubmit: (data: LabFormData) => Promise<void>; isLoading?: boolean }) {
  const { register, handleSubmit, formState: { errors } } = useForm<LabFormData>({ resolver: zodResolver(laboratorySchema), defaultValues });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2"><Label htmlFor="name">Nom du laboratoire *</Label><Input id="name" {...register("name")} placeholder="Laboratoire Alpha" />{errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}</div>
        <div className="space-y-2"><Label htmlFor="code">Code *</Label><Input id="code" {...register("code")} placeholder="LAB-ALPHA" />{errors.code && <p className="text-sm text-destructive">{errors.code.message}</p>}</div>
        <div className="space-y-2"><Label htmlFor="contactEmail">Email de contact</Label><Input id="contactEmail" type="email" {...register("contactEmail")} placeholder="contact@labo.com" /></div>
        <div className="space-y-2"><Label htmlFor="contactPhone">Téléphone</Label><Input id="contactPhone" {...register("contactPhone")} placeholder="+212 5XX-XXXXXX" /></div>
      </div>
      <div className="space-y-2"><Label htmlFor="address">Adresse</Label><Textarea id="address" {...register("address")} placeholder="Adresse du laboratoire" /></div>
      <Button type="submit" disabled={isLoading}>{isLoading ? "Enregistrement..." : "Enregistrer"}</Button>
    </form>
  );
}
