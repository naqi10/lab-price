"use client";

import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/utils";
import { formatTurnaroundShort, parseTurnaroundToHours } from "@/lib/turnaround";
import { TubeDot } from "@/components/ui/tube-dot";
import {
  FlaskConical,
  Zap,
  DollarSign,
  Clock,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Plus,
  AlertCircle,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

type WizardStep = "input" | "lab" | "priority" | "searching" | "results";
type LabPreference = "cdl" | "dynacare" | "none";
type PriorityPreference = "cheaper" | "faster";

interface LabResult {
  labName: string;
  labCode: string;
  labId: string;
  price: number;
  turnaroundTime: string | null;
  tubeType: string | null;
  testMappingId: string;
  canonicalName: string | null;
}

interface MatchedTest {
  inputName: string;
  found: boolean;
  testMappingId: string | null;
  canonicalName: string | null;
  tubeType: string | null;
  labResults: LabResult[];
  chosen: LabResult | null;
}

export interface BulkTestResult {
  testMappingId: string;
  name: string;
  canonicalName: string | null;
  tubeType: string | null;
  laboratoryId: string;
  laboratoryName: string;
  laboratoryCode: string;
  price: number;
  turnaroundTime: string | null;
}

interface BulkInputWizardProps {
  open: boolean;
  onClose: () => void;
  onAddTests: (tests: BulkTestResult[]) => void;
}

// ── Selection logic ────────────────────────────────────────────────────────

function chooseBest(
  labResults: LabResult[],
  labPref: LabPreference,
  priority: PriorityPreference
): LabResult | null {
  if (labResults.length === 0) return null;
  if (labResults.length === 1) return labResults[0];

  const prefToken =
    labPref === "cdl" ? "CDL" : labPref === "dynacare" ? "DYN" : null;

  const sorted =
    priority === "cheaper"
      ? [...labResults].sort((a, b) => a.price - b.price)
      : [...labResults].sort((a, b) => {
          const aH = parseTurnaroundToHours(a.turnaroundTime);
          const bH = parseTurnaroundToHours(b.turnaroundTime);
          return aH !== bH ? aH - bH : a.price - b.price;
        });

  if (prefToken) {
    const prefResult = labResults.find(
      (r) =>
        r.labCode.toUpperCase().includes(prefToken) ||
        r.labName.toUpperCase().includes(prefToken)
    );
    if (prefResult) {
      const best = sorted[0];
      if (priority === "cheaper") {
        // Prefer chosen lab if within 15% of cheapest
        if (prefResult.price <= best.price * 1.15) return prefResult;
      } else {
        // Prefer chosen lab if within 1 day (24h) of fastest
        const prefH = parseTurnaroundToHours(prefResult.turnaroundTime);
        const bestH = parseTurnaroundToHours(best.turnaroundTime);
        if (prefH - bestH <= 24) return prefResult;
      }
    }
  }

  return sorted[0];
}

const STEP_ORDER: WizardStep[] = ["input", "lab", "priority", "results"];

// ── Component ──────────────────────────────────────────────────────────────

export default function BulkInputWizard({
  open,
  onClose,
  onAddTests,
}: BulkInputWizardProps) {
  const [step, setStep] = useState<WizardStep>("input");
  const [rawInput, setRawInput] = useState("");
  const [labPref, setLabPref] = useState<LabPreference>("none");
  const [priority, setPriority] = useState<PriorityPreference>("cheaper");
  const [matchedTests, setMatchedTests] = useState<MatchedTest[]>([]);

  const parsedNames = rawInput
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  const handleClose = () => {
    setStep("input");
    setRawInput("");
    setLabPref("none");
    setPriority("cheaper");
    setMatchedTests([]);
    onClose();
  };

  const runSearch = useCallback(
    async (lp: LabPreference, pr: PriorityPreference) => {
      setStep("searching");
      try {
        const results = await Promise.all(
          parsedNames.map(async (name): Promise<MatchedTest> => {
            const empty: MatchedTest = {
              inputName: name,
              found: false,
              testMappingId: null,
              canonicalName: null,
              tubeType: null,
              labResults: [],
              chosen: null,
            };
            try {
              const r = await fetch(
                `/api/tests?q=${encodeURIComponent(name)}&limit=10`
              );
              const d = await r.json();
              if (!d.success || !d.data?.length) return empty;

              // Group by testMappingId; first group = best match (API sorted)
              const grouped = new Map<string, LabResult[]>();
              let firstKey: string | null = null;
              for (const t of d.data) {
                if (!t.testMappingId) continue;
                if (!firstKey) firstKey = t.testMappingId;
                const arr = grouped.get(t.testMappingId) ?? [];
                arr.push({
                  labName: t.laboratoryName,
                  labCode: t.laboratoryCode,
                  labId: t.laboratoryId,
                  price: t.price,
                  turnaroundTime: t.turnaroundTime ?? null,
                  tubeType: t.tubeType ?? null,
                  testMappingId: t.testMappingId,
                  canonicalName: t.canonicalName ?? null,
                });
                grouped.set(t.testMappingId, arr);
              }

              if (!firstKey) return empty;
              const labResults = grouped.get(firstKey) ?? [];
              return {
                inputName: name,
                found: true,
                testMappingId: firstKey,
                canonicalName: labResults[0]?.canonicalName ?? null,
                tubeType: labResults[0]?.tubeType ?? null,
                labResults,
                chosen: chooseBest(labResults, lp, pr),
              };
            } catch {
              return empty;
            }
          })
        );
        setMatchedTests(results);
        setStep("results");
      } catch {
        setStep("priority");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rawInput]
  );

  const handleAddAll = () => {
    const toAdd = matchedTests
      .filter((t): t is MatchedTest & { chosen: LabResult } =>
        t.found && t.chosen !== null && t.testMappingId !== null
      )
      .map((t) => ({
        testMappingId: t.testMappingId!,
        name: t.canonicalName || t.inputName,
        canonicalName: t.canonicalName,
        tubeType: t.tubeType,
        laboratoryId: t.chosen.labId,
        laboratoryName: t.chosen.labName,
        laboratoryCode: t.chosen.labCode,
        price: t.chosen.price,
        turnaroundTime: t.chosen.turnaroundTime,
      }));
    onAddTests(toAdd);
    handleClose();
  };

  const foundCount = matchedTests.filter((t) => t.found && t.chosen).length;
  const notFoundCount = matchedTests.filter((t) => !t.found).length;
  const totalPrice = matchedTests
    .filter((t) => t.found && t.chosen)
    .reduce((sum, t) => sum + (t.chosen?.price ?? 0), 0);

  const stepIdx = STEP_ORDER.indexOf(step === "searching" ? "results" : step);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent
        className="max-w-lg max-h-[90vh] overflow-y-auto"
        aria-describedby={undefined}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FlaskConical className="h-4 w-4 text-primary" />
            Saisie en lot de tests
          </DialogTitle>
        </DialogHeader>

        {/* Progress bar */}
        {step !== "searching" && (
          <div className="flex items-center gap-1 mb-1">
            {STEP_ORDER.map((s, idx) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                  idx === stepIdx
                    ? "bg-primary"
                    : idx < stepIdx
                      ? "bg-primary/40"
                      : "bg-muted"
                }`}
              />
            ))}
          </div>
        )}

        {/* ── Step 1: Input ────────────────────────────────── */}
        {step === "input" && (
          <div className="space-y-4 pt-1">
            <p className="text-sm text-muted-foreground">
              Entrez les noms des tests, <strong>un par ligne</strong>. Le système
              trouvera la meilleure correspondance pour chacun.
            </p>
            <Textarea
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
              onKeyDown={(e) => {
                if (
                  (e.ctrlKey || e.metaKey) &&
                  e.key === "Enter" &&
                  parsedNames.length > 0
                ) {
                  e.preventDefault();
                  setStep("lab");
                }
              }}
              placeholder={"TSH\nFER\nGlucose\nHémogramme\nBilirubine totale"}
              rows={7}
              className="font-mono text-sm resize-none"
              autoFocus
            />
            {parsedNames.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {parsedNames.map((n, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center text-xs bg-muted rounded-md px-2 py-0.5 text-foreground/80"
                  >
                    {n}
                  </span>
                ))}
              </div>
            )}
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Ctrl+Entrée pour continuer
              </p>
              <Button
                onClick={() => setStep("lab")}
                disabled={parsedNames.length === 0}
                className="gap-1.5"
              >
                Suivant
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 2: Lab preference ───────────────────────── */}
        {step === "lab" && (
          <div className="space-y-4 pt-1">
            <p className="text-sm text-muted-foreground">
              Quel laboratoire souhaitez-vous voir en priorité ?
            </p>
            <div className="flex flex-col gap-2">
              {(
                [
                  {
                    value: "cdl" as const,
                    label: "CDL",
                    sub: "Centre de dépistage Laurentien",
                    bg: "bg-blue-50 text-blue-700",
                  },
                  {
                    value: "dynacare" as const,
                    label: "Dynacare",
                    sub: "Dynacare Montréal",
                    bg: "bg-purple-50 text-purple-700",
                  },
                  {
                    value: "none" as const,
                    label: "Pas de préférence",
                    sub: "Laisser le système décider selon la priorité",
                    bg: "bg-muted text-muted-foreground",
                  },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setLabPref(opt.value)}
                  className={`flex items-center gap-3 rounded-xl border p-3.5 text-left transition-all ${
                    labPref === opt.value
                      ? "border-primary/60 bg-primary/5 ring-1 ring-primary/20"
                      : "border-border/60 bg-card hover:border-border/80 hover:bg-muted/20"
                  }`}
                >
                  <div
                    className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${opt.bg}`}
                  >
                    <FlaskConical className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{opt.label}</p>
                    <p className="text-xs text-muted-foreground">{opt.sub}</p>
                  </div>
                  {labPref === opt.value && (
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  )}
                </button>
              ))}
            </div>
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setStep("input")}
                className="gap-1.5"
              >
                <ChevronLeft className="h-4 w-4" />
                Retour
              </Button>
              <Button onClick={() => setStep("priority")} className="gap-1.5">
                Suivant
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 3: Priority ─────────────────────────────── */}
        {step === "priority" && (
          <div className="space-y-4 pt-1">
            <p className="text-sm text-muted-foreground">
              Quelle est votre priorité pour ce patient ?
            </p>
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  {
                    value: "cheaper" as const,
                    icon: <DollarSign className="h-5 w-5" />,
                    label: "Prix le plus bas",
                    sub: "Optimise le coût total",
                    iconBg: "bg-emerald-100 text-emerald-700",
                  },
                  {
                    value: "faster" as const,
                    icon: <Zap className="h-5 w-5" />,
                    label: "Résultats rapides",
                    sub: "Minimise le délai de rendu",
                    iconBg: "bg-amber-100 text-amber-700",
                  },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setPriority(opt.value)}
                  className={`flex flex-col items-center gap-2.5 rounded-xl border p-4 text-center transition-all ${
                    priority === opt.value
                      ? "border-primary/60 bg-primary/5 ring-1 ring-primary/20"
                      : "border-border/60 bg-card hover:border-border/80 hover:bg-muted/20"
                  }`}
                >
                  <div
                    className={`h-10 w-10 rounded-xl flex items-center justify-center ${opt.iconBg}`}
                  >
                    {opt.icon}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{opt.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {opt.sub}
                    </p>
                  </div>
                  {priority === opt.value && (
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  )}
                </button>
              ))}
            </div>
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setStep("lab")}
                className="gap-1.5"
              >
                <ChevronLeft className="h-4 w-4" />
                Retour
              </Button>
              <Button
                onClick={() => runSearch(labPref, priority)}
                className="gap-1.5"
              >
                Compiler les résultats
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ── Searching ────────────────────────────────────── */}
        {step === "searching" && (
          <div className="flex flex-col items-center justify-center py-14 gap-3">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <p className="text-sm font-semibold">Analyse en cours…</p>
            <p className="text-xs text-muted-foreground">
              Recherche de {parsedNames.length} test
              {parsedNames.length > 1 ? "s" : ""} dans la base de données
            </p>
          </div>
        )}

        {/* ── Step 4: Results ──────────────────────────────── */}
        {step === "results" && (
          <div className="space-y-3 pt-1">
            {/* Summary banner */}
            <div className="flex items-center gap-3 rounded-xl bg-muted/40 border border-border/40 px-3.5 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">
                  {foundCount} test{foundCount > 1 ? "s" : ""} trouvé
                  {foundCount > 1 ? "s" : ""}
                  {notFoundCount > 0 && (
                    <span className="text-destructive/70 font-normal ml-2">
                      · {notFoundCount} introuvable{notFoundCount > 1 ? "s" : ""}
                    </span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {priority === "cheaper" ? "💰 Prix le plus bas" : "⚡ Résultats rapides"}
                  {labPref !== "none" && (
                    <span className="ml-1.5">
                      · Labo préféré :{" "}
                      <span className="font-medium">
                        {labPref === "cdl" ? "CDL" : "Dynacare"}
                      </span>
                    </span>
                  )}
                </p>
              </div>
              {totalPrice > 0 && (
                <div className="text-right shrink-0">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                    Total
                  </p>
                  <p className="text-xl font-bold tabular-nums">
                    {formatCurrency(totalPrice)}
                  </p>
                </div>
              )}
            </div>

            {/* Per-test results */}
            <div className="space-y-1.5">
              {matchedTests.map((t, idx) =>
                t.found && t.chosen ? (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 rounded-lg border border-border/50 bg-card px-3 py-2.5"
                  >
                    <div className="pt-0.5 shrink-0">
                      <TubeDot tubeType={t.tubeType ?? null} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold leading-snug">
                        {t.canonicalName || t.inputName}
                      </p>
                      {t.canonicalName &&
                        t.canonicalName.toLowerCase() !==
                          t.inputName.toLowerCase() && (
                          <p className="text-[10px] text-muted-foreground">
                            ← "{t.inputName}"
                          </p>
                        )}
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] font-bold uppercase px-1 py-0.5 rounded bg-primary/5 text-primary/70">
                          {t.chosen.labCode}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {t.chosen.labName}
                        </span>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-bold tabular-nums">
                        {formatCurrency(t.chosen.price)}
                      </p>
                      {t.chosen.turnaroundTime && (
                        <p className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground mt-0.5">
                          <Clock className="h-2.5 w-2.5" />
                          {formatTurnaroundShort(t.chosen.turnaroundTime)}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div
                    key={idx}
                    className="flex items-center gap-2.5 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5"
                  >
                    <AlertCircle className="h-4 w-4 text-destructive/50 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-destructive/80">
                        "{t.inputName}"
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Aucune correspondance trouvée
                      </p>
                    </div>
                  </div>
                )
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStep("priority")}
                className="gap-1"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Modifier
              </Button>
              {foundCount > 0 && (
                <Button onClick={handleAddAll} className="gap-1.5">
                  <Plus className="h-4 w-4" />
                  Ajouter {foundCount} test{foundCount > 1 ? "s" : ""} au devis
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
