"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function EmailConfigForm() {
  const [config, setConfig] = useState({ smtpHost: "", smtpPort: "587", smtpUser: "", smtpPassword: "", fromEmail: "", fromName: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleChange = (field: string, value: string) => { setConfig(prev => ({ ...prev, [field]: value })); setSaved(false); };
  const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); setIsLoading(true); try { await fetch("/api/settings/email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(config) }); setSaved(true); } finally { setIsLoading(false); } };

  return (
    <Card><CardHeader><CardTitle>Configuration SMTP</CardTitle></CardHeader><CardContent>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2"><Label>Hôte SMTP</Label><Input value={config.smtpHost} onChange={e => handleChange("smtpHost", e.target.value)} placeholder="smtp.example.com" /></div>
          <div className="space-y-2"><Label>Port SMTP</Label><Input value={config.smtpPort} onChange={e => handleChange("smtpPort", e.target.value)} placeholder="587" /></div>
          <div className="space-y-2"><Label>Utilisateur SMTP</Label><Input value={config.smtpUser} onChange={e => handleChange("smtpUser", e.target.value)} /></div>
          <div className="space-y-2"><Label>Mot de passe SMTP</Label><Input type="password" value={config.smtpPassword} onChange={e => handleChange("smtpPassword", e.target.value)} /></div>
          <div className="space-y-2"><Label>Email expéditeur</Label><Input value={config.fromEmail} onChange={e => handleChange("fromEmail", e.target.value)} /></div>
          <div className="space-y-2"><Label>Nom expéditeur</Label><Input value={config.fromName} onChange={e => handleChange("fromName", e.target.value)} /></div>
        </div>
        <div className="flex items-center gap-4"><Button type="submit" disabled={isLoading}>{isLoading ? "Enregistrement..." : "Enregistrer"}</Button>{saved && <span className="text-sm text-green-600">Configuration enregistrée</span>}</div>
      </form>
    </CardContent></Card>
  );
}
