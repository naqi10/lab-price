"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { laboratorySchema } from "@/lib/validations/laboratory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { z } from "zod";

type LabFormData = z.infer<typeof laboratorySchema>;

export default function LabForm({ defaultValues, onSubmit }: { defaultValues?: Partial<LabFormData>; onSubmit: (data: LabFormData) => Promise<any> }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { register, handleSubmit, formState: { errors } } = useForm<LabFormData>({ resolver: zodResolver(laboratorySchema), defaultValues });

  const handleFormSubmit = async (data: LabFormData) => {
    setIsLoading(true);
    setError("");
    try {
      const result = await onSubmit(data);
      if (result && !result.success) {
        setError(result.message || "Erreur lors de l'enregistrement");
      }
    } catch {
      setError("Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Nom du laboratoire *</Label>
          <Input id="name" {...register("name")} placeholder="Laboratoire Alpha" />
          {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="code">Code *</Label>
          <Input id="code" {...register("code")} placeholder="LAB-ALPHA" />
          {errors.code && <p className="text-sm text-destructive">{errors.code.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email de contact</Label>
          <Input id="email" type="email" {...register("email")} placeholder="contact@labo.com" />
          {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Téléphone</Label>
          <Input id="phone" {...register("phone")} placeholder="+212 5XX-XXXXXX" />
          {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="city">Ville</Label>
          <Input id="city" {...register("city")} placeholder="Casablanca" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contactName">Personne de contact</Label>
          <Input id="contactName" {...register("contactName")} placeholder="Dr. Nom" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="address">Adresse</Label>
        <Textarea id="address" {...register("address")} placeholder="Adresse du laboratoire" />
      </div>
      <Button type="submit" disabled={isLoading}>{isLoading ? "Enregistrement..." : "Enregistrer"}</Button>
    </form>
  );
}
