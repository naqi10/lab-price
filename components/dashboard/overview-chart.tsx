import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, CheckCircle2, XCircle, Clock } from "lucide-react";

interface EmailStatsProps {
  stats: { sent: number; failed: number; pending: number; total: number };
}

export default function EmailStats({ stats }: EmailStatsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Mail className="h-5 w-5" />
          Statistiques email
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 rounded-lg border p-3">
            <CheckCircle2 className="h-8 w-8 text-green-500 shrink-0" />
            <div>
              <p className="text-2xl font-bold">{stats.sent}</p>
              <p className="text-xs text-muted-foreground">Envoyés</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border p-3">
            <XCircle className="h-8 w-8 text-red-500 shrink-0" />
            <div>
              <p className="text-2xl font-bold">{stats.failed}</p>
              <p className="text-xs text-muted-foreground">Échoués</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border p-3">
            <Clock className="h-8 w-8 text-yellow-500 shrink-0" />
            <div>
              <p className="text-2xl font-bold">{stats.pending}</p>
              <p className="text-xs text-muted-foreground">En attente</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
