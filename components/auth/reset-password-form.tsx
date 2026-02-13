"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordSchema } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { z } from "zod";

type ResetFormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordForm() {
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<ResetFormData>({ resolver: zodResolver(resetPasswordSchema) });

  const onSubmit = async (data: ResetFormData) => {
    setIsLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/reset-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const result = await res.json();
      if (result.success) setSuccess(true);
      else setError(result.message || "Erreur lors de la réinitialisation");
    } catch { setError("Une erreur est survenue"); }
    finally { setIsLoading(false); }
  };

  if (success) return (
    <Card className="w-full max-w-md"><CardContent className="pt-6 text-center">
      <p className="text-green-600 font-medium">Mot de passe réinitialisé avec succès</p>
      <a href="/login" className="text-sm text-primary hover:underline mt-2 inline-block">Retour à la connexion</a>
    </CardContent></Card>
  );

  return (
    <Card className="w-full max-w-md">
      <CardHeader><CardTitle className="text-2xl font-bold text-center">Réinitialiser le mot de passe</CardTitle><CardDescription className="text-center">Entrez votre email et nouveau mot de passe</CardDescription></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
          <div className="space-y-2"><Label htmlFor="email">Adresse e-mail</Label><Input id="email" type="email" {...register("email")} />{errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}</div>
          <div className="space-y-2"><Label htmlFor="newPassword">Nouveau mot de passe</Label><Input id="newPassword" type="password" {...register("newPassword")} />{errors.newPassword && <p className="text-sm text-destructive">{errors.newPassword.message}</p>}</div>
          <div className="space-y-2"><Label htmlFor="confirmPassword">Confirmer le mot de passe</Label><Input id="confirmPassword" type="password" {...register("confirmPassword")} />{errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>}</div>
          <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? "Réinitialisation..." : "Réinitialiser"}</Button>
          <div className="text-center"><a href="/login" className="text-sm text-primary hover:underline">Retour à la connexion</a></div>
        </form>
      </CardContent>
    </Card>
  );
}
