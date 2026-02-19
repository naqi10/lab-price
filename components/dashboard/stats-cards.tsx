import { FlaskConical, TestTubes, GitCompare, Users, Contact, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

const cards = [
  { key: "laboratories" as const, label: "Laboratoires actifs", icon: FlaskConical, href: "/laboratories", iconBg: "bg-blue-900/30 border-blue-500/20", iconColor: "text-blue-400" },
  { key: "tests" as const, label: "Tests disponibles", icon: TestTubes, href: "/tests", iconBg: "bg-emerald-900/30 border-emerald-500/20", iconColor: "text-emerald-400" },
  { key: "mappings" as const, label: "Correspondances", icon: GitCompare, href: "/tests/mappings", iconBg: "bg-amber-900/30 border-amber-500/20", iconColor: "text-amber-400" },
  { key: "users" as const, label: "Utilisateurs actifs", icon: Users, href: "/settings", iconBg: "bg-violet-900/30 border-violet-500/20", iconColor: "text-violet-400" },
  { key: "customers" as const, label: "Clients", icon: Contact, href: "/customers", iconBg: "bg-sky-900/30 border-sky-500/20", iconColor: "text-sky-400" },
];

interface StatsCardsProps {
  stats: {
    laboratories: number;
    tests: number;
    mappings: number;
    users: number;
    customers: number;
  };
  stalePriceListCount?: number;
}

export default function StatsCards({ stats, stalePriceListCount = 0 }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 mt-6">
      {cards.map((card) => (
        <Link key={card.key} href={card.href} className="group">
          <Card className="hover:border-border/80 hover:shadow-md transition-all duration-200 cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${card.iconBg}`}>
                  <card.icon className={`h-4 w-4 ${card.iconColor}`} />
                </div>
                {card.key === "laboratories" && stalePriceListCount > 0 && (
                  <Badge variant="warning" className="text-xs shrink-0">
                    <AlertTriangle className="h-3 w-3" />
                    {stalePriceListCount}
                  </Badge>
                )}
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold tabular-nums">{stats[card.key]}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{card.label}</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
