import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function OverviewChart() {
  return (
    <Card><CardHeader><CardTitle>Aperçu des activités</CardTitle></CardHeader><CardContent><div className="flex h-[300px] items-center justify-center text-muted-foreground"><p>Graphique des activités récentes</p></div></CardContent></Card>
  );
}
