import { AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function MissingTestsAlert({ missingTests }: { missingTests: { labName: string; tests: string[] }[] }) {
  if (missingTests.length === 0) return null;
  return (
    <Card className="border-yellow-200 bg-yellow-50"><CardContent className="flex gap-3 p-4">
      <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
      <div><p className="text-sm font-medium text-yellow-800">Tests manquants détectés</p><div className="mt-2 space-y-1">{missingTests.map((item, i) => <p key={i} className="text-sm text-yellow-700"><span className="font-medium">{item.labName}:</span> {item.tests.join(", ")}</p>)}</div><p className="text-xs text-yellow-600 mt-2">Les laboratoires avec des tests manquants ne peuvent pas être sélectionnés.</p></div>
    </CardContent></Card>
  );
}
