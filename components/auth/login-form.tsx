"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { z } from "zod";

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError("");
    setAttemptsRemaining(null);

    try {
      // Check lockout status before attempting login
      const lockoutRes = await fetch("/api/auth/check-lockout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email }),
      });
      const lockoutData = await lockoutRes.json();

      if (lockoutData.locked) {
        setError(
          `Compte verrouillé suite à trop de tentatives. Réessayez dans ${lockoutData.remainingMinutes} minute${lockoutData.remainingMinutes > 1 ? "s" : ""}.`
        );
        setIsLoading(false);
        return;
      }

      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        // Check lockout again to get updated attempts count
        const postRes = await fetch("/api/auth/check-lockout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: data.email }),
        });
        const postData = await postRes.json();

        if (postData.locked) {
          setError(
            `Compte verrouillé suite à trop de tentatives. Réessayez dans ${postData.remainingMinutes} minute${postData.remainingMinutes > 1 ? "s" : ""}.`
          );
        } else {
          setError("Email ou mot de passe incorrect");
          if (postData.attemptsRemaining != null && postData.attemptsRemaining <= 3) {
            setAttemptsRemaining(postData.attemptsRemaining);
          }
        }
      } else {
        router.push("/");
        router.refresh();
      }
    } catch {
      setError("Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Connexion</CardTitle>
        <CardDescription className="text-center">Entrez vos identifiants pour accéder au système</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
          {attemptsRemaining != null && (
            <div className="rounded-md bg-amber-500/10 p-3 text-sm text-amber-600 dark:text-amber-400">
              {attemptsRemaining} tentative{attemptsRemaining > 1 ? "s" : ""} restante{attemptsRemaining > 1 ? "s" : ""} avant verrouillage du compte.
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Adresse e-mail</Label>
            <Input id="email" type="email" placeholder="admin@labprice.com" {...register("email")} />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input id="password" type="password" placeholder="••••••••" {...register("password")} />
            {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? "Connexion en cours..." : "Se connecter"}</Button>
          <div className="text-center"><a href="/reset-password" className="text-sm text-primary hover:underline">Mot de passe oublié ?</a></div>
        </form>
      </CardContent>
    </Card>
  );
}
