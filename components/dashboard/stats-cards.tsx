import { FlaskConical, TestTubes, FileText, GitCompare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const cards = [
  { key: "laboratories" as const, label: "Laboratoires actifs", icon: FlaskConical, color: "text-blue-600" },
  { key: "tests" as const, label: "Tests disponibles", icon: TestTubes, color: "text-green-600" },
  { key: "quotations" as const, label: "Devis générés", icon: FileText, color: "text-purple-600" },
  { key: "mappings" as const, label: "Correspondances", icon: GitCompare, color: "text-orange-600" },
];

export default function StatsCards({ stats }: { stats: { laboratories: number; tests: number; quotations: number; mappings: number } }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.key}><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">{card.label}</CardTitle><card.icon className={`h-5 w-5 ${card.color}`} /></CardHeader><CardContent><div className="text-2xl font-bold">{stats[card.key]}</div></CardContent></Card>
      ))}
    </div>
  );
}
