"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { UserPlus, KeyRound, UserCheck, UserX, Activity } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

interface AuditEntry {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  createdAt: string;
}

export default function UserManagement() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState<UserData | null>(null);
  const [showActivityDialog, setShowActivityDialog] = useState<UserData | null>(null);
  const [activityLog, setActivityLog] = useState<AuditEntry[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);

  // Create form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset password state
  const [newPassword, setNewPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetResult, setResetResult] = useState<{ success: boolean; message: string } | null>(null);

  const fetchUsers = async () => {
    const r = await fetch("/api/users");
    const d = await r.json();
    if (d.success) setUsers(d.data);
  };

  useEffect(() => { fetchUsers(); }, []);

  // ── Create user ──────────────────────────────────────────────
  const handleCreate = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role: "ADMIN" }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.message); return; }
      setShowForm(false);
      setName(""); setEmail(""); setPassword("");
      fetchUsers();
    } finally { setIsLoading(false); }
  };

  // ── Toggle active status ─────────────────────────────────────
  const activeUserCount = users.filter((u) => u.isActive).length;

  const handleToggleActive = async (user: UserData) => {
    const action = user.isActive ? "Désactiver" : "Réactiver";
    if (!confirm(`${action} l'utilisateur ${user.name} ?`)) return;
    const res = await fetch(`/api/users/${user.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !user.isActive }),
    });
    const data = await res.json();
    if (!data.success) {
      alert(data.message);
      return;
    }
    fetchUsers();
  };

  // ── Admin reset password ─────────────────────────────────────
  const handleResetPassword = async () => {
    if (!showResetDialog || !newPassword) return;
    setResetLoading(true);
    setResetResult(null);
    try {
      const res = await fetch(`/api/users/${showResetDialog.id}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });
      const data = await res.json();
      setResetResult({ success: data.success, message: data.message });
      if (data.success) setNewPassword("");
    } finally { setResetLoading(false); }
  };

  const closeResetDialog = () => {
    setShowResetDialog(null);
    setNewPassword("");
    setResetResult(null);
  };

  // ── View user activity ───────────────────────────────────────
  const handleViewActivity = async (user: UserData) => {
    setShowActivityDialog(user);
    setActivityLoading(true);
    try {
      const res = await fetch(`/api/users/${user.id}/activity`);
      const data = await res.json();
      if (data.success) setActivityLog(data.data);
      else setActivityLog([]);
    } catch { setActivityLog([]); }
    finally { setActivityLoading(false); }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Gestion des utilisateurs</CardTitle>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{users.length}/5 utilisateurs</span>
            <Button size="sm" onClick={() => setShowForm(true)} disabled={users.length >= 5}>
              <UserPlus className="mr-2 h-4 w-4" /> Ajouter
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rôle</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Créé le</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id} className={!u.isActive ? "opacity-50" : ""}>
                <TableCell className="font-medium">{u.name}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell><Badge variant="outline">{u.role}</Badge></TableCell>
                <TableCell>
                  {u.isActive ? (
                    <Badge variant="default">Actif</Badge>
                  ) : (
                    <Badge variant="destructive">Désactivé</Badge>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{formatDate(u.createdAt)}</TableCell>
                <TableCell className="text-right space-x-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    title={
                      u.isActive && activeUserCount <= 1
                        ? "Dernier utilisateur actif"
                        : u.isActive ? "Désactiver" : "Réactiver"
                    }
                    disabled={u.isActive && activeUserCount <= 1}
                    onClick={() => handleToggleActive(u)}
                  >
                    {u.isActive ? (
                      <UserX className="h-4 w-4 text-orange-500" />
                    ) : (
                      <UserCheck className="h-4 w-4 text-green-500" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Réinitialiser le mot de passe"
                    onClick={() => setShowResetDialog(u)}
                  >
                    <KeyRound className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Activité"
                    onClick={() => handleViewActivity(u)}
                  >
                    <Activity className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      {/* ── Create user dialog ───────────────────────────────────── */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvel utilisateur</DialogTitle>
            <DialogDescription>Tous les utilisateurs ont les privilèges administrateur.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {error && <p className="text-sm text-red-400">{error}</p>}
            <div className="space-y-2"><Label>Nom *</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom complet" /></div>
            <div className="space-y-2"><Label>Email *</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@example.com" /></div>
            <div className="space-y-2"><Label>Mot de passe *</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimum 6 caractères" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Annuler</Button>
            <Button onClick={handleCreate} disabled={isLoading || !name || !email || !password}>
              {isLoading ? "Création..." : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Reset password dialog ────────────────────────────────── */}
      <Dialog open={!!showResetDialog} onOpenChange={(o) => !o && closeResetDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Réinitialiser le mot de passe</DialogTitle>
            <DialogDescription>
              Définir un nouveau mot de passe pour {showResetDialog?.name}.
            </DialogDescription>
          </DialogHeader>
          {resetResult ? (
            <div className="py-4 text-center">
              <p className={resetResult.success ? "text-green-400 font-medium" : "text-red-400 font-medium"}>
                {resetResult.message}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nouveau mot de passe *</Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 caractères"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={closeResetDialog}>
              {resetResult ? "Fermer" : "Annuler"}
            </Button>
            {!resetResult && (
              <Button onClick={handleResetPassword} disabled={resetLoading || newPassword.length < 6}>
                {resetLoading ? "Réinitialisation..." : "Réinitialiser"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── User activity dialog ─────────────────────────────────── */}
      <Dialog open={!!showActivityDialog} onOpenChange={(o) => !o && setShowActivityDialog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Activité de {showActivityDialog?.name}</DialogTitle>
          </DialogHeader>
          {activityLoading ? (
            <p className="text-sm text-muted-foreground text-center py-6">Chargement...</p>
          ) : activityLog.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Aucune activité enregistrée.</p>
          ) : (
            <div className="max-h-[400px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead>Entité</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activityLog.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="text-sm">{a.action}</TableCell>
                      <TableCell className="text-sm">{a.entity}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(a.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowActivityDialog(null)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
