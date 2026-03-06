import { AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function MissingTestsAlert({ missingTests }: { missingTests: { labName: string; tests: string[] }[] }) {
  if (missingTests.length === 0) return null;
  return (
    <Card className="border-amber-200 bg-amber-50/90 shadow-sm">
      <CardContent className="flex gap-3 p-4 sm:p-5">
        <div className="mt-0.5 rounded-full bg-amber-100 p-1.5 shrink-0">
          <AlertTriangle className="h-4 w-4 text-amber-700" />
        </div>
        <div className="min-w-0">
          <p className="text-sm sm:text-base font-semibold text-slate-900">
            Tests manquants détectés
          </p>
          <div className="mt-2 space-y-2">
            {missingTests.map((item) => (
              <p key={item.labName} className="text-sm text-slate-700 leading-relaxed">
                <span className="font-semibold text-slate-900">{item.labName}:</span>{" "}
                {item.tests.join(", ")}
              </p>
            ))}
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-3">
            Les laboratoires avec des tests manquants ne peuvent pas être sélectionnés.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
