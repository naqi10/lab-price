"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import { formatTurnaroundShort, parseTurnaroundToHours } from "@/lib/turnaround";
import { TubeDot } from "@/components/ui/tube-dot";
import type { ProfileMatchResult } from "@/app/api/tests/profile-match/route";
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
  ArrowLeft,
  AlertTriangle,
  Receipt,
  Layers,
  Star,
  ListChecks,
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
  /** true = both CDL and Dynacare have entries for this canonical */
  isPaired: boolean;
  /** which lab codes are available */
  availableLabs: string[];
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

type ResultTab = "individual" | "profiles";

interface BulkSearchPanelProps {
  onAddTests: (tests: BulkTestResult[]) => void;
  onClose: () => void;
  /** Default service fee (default 30) */
  serviceFee?: number;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function isCDL(code: string, name: string) {
  return code.toUpperCase().includes("CDL") || name.toUpperCase().includes("CDL");
}
function isDynacare(code: string, name: string) {
  return (
    code.toUpperCase().includes("DYN") ||
    name.toUpperCase().includes("DYNACARE")
  );
}

// ── Selection logic ──────────────────────────────────────────────────────────

function chooseBest(
  labResults: LabResult[],
  labPref: LabPreference,
  priority: PriorityPreference
): LabResult | null {
  if (labResults.length === 0) return null;
  if (labResults.length === 1) return labResults[0];

  const sorted =
    priority === "cheaper"
      ? [...labResults].sort((a, b) => a.price - b.price)
      : [...labResults].sort((a, b) => {
          const aH = parseTurnaroundToHours(a.turnaroundTime);
          const bH = parseTurnaroundToHours(b.turnaroundTime);
          return aH !== bH ? aH - bH : a.price - b.price;
        });

  if (labPref !== "none") {
    const prefResult = labResults.find((r) =>
      labPref === "cdl"
        ? isCDL(r.labCode, r.labName)
        : isDynacare(r.labCode, r.labName)
    );
    if (prefResult) {
      const best = sorted[0];
      if (priority === "cheaper") {
        // Prefer chosen lab if within 15% of cheapest — ties always go to preferred lab
        if (prefResult.price <= best.price * 1.15) return prefResult;
      } else {
        const prefH = parseTurnaroundToHours(prefResult.turnaroundTime);
        const bestH = parseTurnaroundToHours(best.turnaroundTime);
        if (prefH - bestH <= 24) return prefResult;
      }
    }
  }

  // No preference — return cheapest, but deduplicate same-lab duplicates (CDL $82 + CDL $56)
  // by picking the unique-lab cheapest
  const bestPerLab = new Map<string, LabResult>();
  for (const r of sorted) {
    if (!bestPerLab.has(r.labId)) bestPerLab.set(r.labId, r);
  }
  const deduped = [...bestPerLab.values()].sort((a, b) =>
    priority === "cheaper"
      ? a.price - b.price
      : parseTurnaroundToHours(a.turnaroundTime) - parseTurnaroundToHours(b.turnaroundTime)
  );
  return deduped[0] ?? sorted[0];
}

const STEP_ORDER: WizardStep[] = ["input", "lab", "priority", "results"];

// ── Component ──────────────────────────────────────────────────────────────

export default function BulkSearchPanel({
  onAddTests,
  onClose,
  serviceFee = 30,
}: BulkSearchPanelProps) {
  const [step, setStep] = useState<WizardStep>("input");
  const [rawInput, setRawInput] = useState("");
  const [labPref, setLabPref] = useState<LabPreference>("none");
  const [priority, setPriority] = useState<PriorityPreference>("cheaper");
  const [matchedTests, setMatchedTests] = useState<MatchedTest[]>([]);
  const [matchingProfiles, setMatchingProfiles] = useState<ProfileMatchResult[]>([]);
  const [activeTab, setActiveTab] = useState<ResultTab>("individual");
  const [editableServiceFee, setEditableServiceFee] = useState(serviceFee);

  // Each non-empty line = one test (commas also split for paste convenience)
  const parsedNames = rawInput
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const handleReset = () => {
    setStep("input");
    setRawInput("");
    setLabPref("none");
    setPriority("cheaper");
    setMatchedTests([]);
    setMatchingProfiles([]);
    setActiveTab("individual");
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
              isPaired: false,
              availableLabs: [],
            };
            try {
              const r = await fetch(
                `/api/tests?q=${encodeURIComponent(name)}&limit=10`
              );
              const d = await r.json();
              if (!d.success || !d.data?.length) return empty;

              if (process.env.NODE_ENV === "development") {
                console.log(`[bulk] "${name}" API results:`,
                  d.data.map((t: { testMappingId: string; canonicalName: string; laboratoryCode: string }, i: number) =>
                    `${i}: [${t.testMappingId?.slice(0,6)}] ${t.canonicalName} (${t.laboratoryCode})`
                  )
                );
              }

              // Group by testMappingId, scoring each group by rank + specificity
              const grouped = new Map<string, LabResult[]>();
              // Track best rank (lowest index) per group — lower index = higher server score
              const groupBestRank = new Map<string, number>();
              const groupCanonical = new Map<string, string>();
              const totalResults = d.data.length;

              for (let i = 0; i < d.data.length; i++) {
                const t = d.data[i];
                if (!t.testMappingId) continue;
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
                // Keep best (lowest) rank per group
                if (!groupBestRank.has(t.testMappingId) || i < groupBestRank.get(t.testMappingId)!) {
                  groupBestRank.set(t.testMappingId, i);
                }
                if (t.canonicalName && !groupCanonical.has(t.testMappingId)) {
                  groupCanonical.set(t.testMappingId, t.canonicalName);
                }
              }

              if (grouped.size === 0) return empty;

              // Word-precision scoring: how much of the canonical is covered by the query?
              // "vitamin b12" covers 2/3 words of "Vitamine B12 (VB12)"      → 0.67
              //   but only  2/4 words of "Acide Folique Vitamine B12"         → 0.50
              // Combined with server rank to break genuine ties correctly.
              const qWords = name.toLowerCase()
                .replace(/[^a-z0-9]/g, " ").split(/\s+/).filter(Boolean);

              const wordPrecision = (canonical: string): number => {
                const cWords = canonical.toLowerCase()
                  .replace(/[^a-z0-9]/g, " ").split(/\s+/).filter(Boolean);
                if (cWords.length === 0) return 0;
                let matches = 0;
                for (const qw of qWords) {
                  if (cWords.some((cw) => cw.startsWith(qw) || qw.startsWith(cw))) matches++;
                }
                return matches / cWords.length;
              };

              let bestKey: string | null = null;
              let bestScore = -1;
              for (const [mid] of grouped) {
                const rank = groupBestRank.get(mid) ?? 0;
                const rankScore = 1 - rank / Math.max(totalResults, 1);
                const precision = wordPrecision(groupCanonical.get(mid) ?? "");
                // 20% rank + 80% word precision — precision is the primary discriminator.
                // This ensures "Vitamine B12" beats "Acide Folique Et Vitamine B12"
                // even when the combo test appears earlier in server results.
                const score = rankScore * 0.2 + precision * 0.8;
                if (score > bestScore) {
                  bestScore = score;
                  bestKey = mid;
                }
              }

              if (!bestKey) return empty;
              const labResults = grouped.get(bestKey) ?? [];

              // ── Pairing detection (deduplicate by lab — CDL may appear twice) ────
              const uniqueLabs = new Map<string, LabResult>();
              for (const r of labResults) {
                if (!uniqueLabs.has(r.labId)) uniqueLabs.set(r.labId, r);
              }
              const uniqueLabResults = [...uniqueLabs.values()];
              const hasCDL = uniqueLabResults.some((r) => isCDL(r.labCode, r.labName));
              const hasDyn = uniqueLabResults.some((r) => isDynacare(r.labCode, r.labName));
              const isPaired = hasCDL && hasDyn;
              const availableLabs = uniqueLabResults.map((r) => r.labCode);

              return {
                inputName: name,
                found: true,
                testMappingId: bestKey,
                canonicalName: labResults[0]?.canonicalName ?? null,
                tubeType: labResults[0]?.tubeType ?? null,
                labResults,
                chosen: chooseBest(labResults, lp, pr),
                isPaired,
                availableLabs,
              };
            } catch {
              return empty;
            }
          })
        );
        setMatchedTests(results);
        setStep("results");
        setActiveTab("individual");

        // ── Profile matching (async, non-blocking) ────────────────────
        const foundTests = results.filter((t) => t.found && t.testMappingId && t.chosen);
        if (foundTests.length > 0) {
          const ids = foundTests.map((t) => t.testMappingId!);
          const selectedPrices: Record<string, number> = {};
          for (const t of foundTests) {
            if (t.testMappingId && t.chosen) {
              selectedPrices[t.testMappingId] = t.chosen.price;
            }
          }
          fetch("/api/tests/profile-match", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ testMappingIds: ids, selectedPrices }),
          })
            .then((r) => r.json())
            .then((d) => {
              if (d.success) setMatchingProfiles(d.data ?? []);
            })
            .catch(() => {/* ignore */});
        }
      } catch {
        setStep("priority");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rawInput]
  );

  const handleAddAll = () => {
    const toAdd = matchedTests
      .filter(
        (t): t is MatchedTest & { chosen: LabResult } =>
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
    handleReset();
  };

  const foundCount = matchedTests.filter((t) => t.found && t.chosen).length;
  const notFoundCount = matchedTests.filter((t) => !t.found).length;
  const singleLabCount = matchedTests.filter(
    (t) => t.found && !t.isPaired
  ).length;
  const subtotal = matchedTests
    .filter((t) => t.found && t.chosen)
    .reduce((sum, t) => sum + (t.chosen?.price ?? 0), 0);
  const total = subtotal + (subtotal > 0 ? editableServiceFee : 0);

  const stepIdx = STEP_ORDER.indexOf(
    step === "searching" ? "results" : step
  );

  return (
    <div className="flex flex-col h-full">
      {/* Panel header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/30">
        <button
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-accent transition-colors shrink-0"
          aria-label="Retour à la recherche"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">Saisie en lot</p>
          <p className="text-xs text-muted-foreground/70">
            Plusieurs tests à la fois
          </p>
        </div>
      </div>

      {/* Progress steps */}
      {step !== "searching" && (
        <div className="flex items-center gap-1 px-4 pt-3 pb-1">
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

      {/* Step content — scrollable */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 pt-3 space-y-4">

        {/* ── Step 1: Input ─────────────────────────────────── */}
        {step === "input" && (
          <>
            <p className="text-sm text-muted-foreground">
              Entrez les noms des tests, <strong>un par ligne</strong>.
              Le système trouvera la meilleure correspondance pour chacun.
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
              rows={8}
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
            <div className="flex items-center justify-between pt-1">
              <p className="text-xs text-muted-foreground">
                {parsedNames.length > 0
                  ? `${parsedNames.length} test${parsedNames.length > 1 ? "s" : ""} · Ctrl+Entrée pour continuer`
                  : "Ctrl+Entrée pour continuer"}
              </p>
              <Button
                onClick={() => setStep("lab")}
                disabled={parsedNames.length === 0}
                size="sm"
                className="gap-1.5"
              >
                Suivant
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </>
        )}

        {/* ── Step 2: Lab preference ────────────────────────── */}
        {step === "lab" && (
          <>
            <p className="text-sm text-muted-foreground">
              Quel laboratoire souhaitez-vous en priorité ?
            </p>
            <div className="flex flex-col gap-2">
              {(
                [
                  {
                    value: "cdl" as const,
                    label: "CDL",
                    sub: "Centre de dépistage Laurentien",
                    iconBg: "bg-blue-50 text-blue-700",
                  },
                  {
                    value: "dynacare" as const,
                    label: "Dynacare",
                    sub: "Dynacare Montréal",
                    iconBg: "bg-purple-50 text-purple-700",
                  },
                  {
                    value: "none" as const,
                    label: "Pas de préférence",
                    sub: "Laisser le système décider",
                    iconBg: "bg-muted text-muted-foreground",
                  },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setLabPref(opt.value)}
                  className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                    labPref === opt.value
                      ? "border-primary/60 bg-primary/5 ring-1 ring-primary/20"
                      : "border-border/60 bg-card hover:border-border/80 hover:bg-muted/20"
                  }`}
                >
                  <div
                    className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${opt.iconBg}`}
                  >
                    <FlaskConical className="h-3.5 w-3.5" />
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
            <div className="flex justify-between pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStep("input")}
                className="gap-1.5"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Retour
              </Button>
              <Button
                size="sm"
                onClick={() => setStep("priority")}
                className="gap-1.5"
              >
                Suivant
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </>
        )}

        {/* ── Step 3: Priority ──────────────────────────────── */}
        {step === "priority" && (
          <>
            <p className="text-sm text-muted-foreground">
              Quelle est votre priorité pour ce patient ?
            </p>
            <div className="grid grid-cols-2 gap-2">
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
                    sub: "Minimise le délai",
                    iconBg: "bg-amber-100 text-amber-700",
                  },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setPriority(opt.value)}
                  className={`flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition-all ${
                    priority === opt.value
                      ? "border-primary/60 bg-primary/5 ring-1 ring-primary/20"
                      : "border-border/60 bg-card hover:border-border/80 hover:bg-muted/20"
                  }`}
                >
                  <div
                    className={`h-9 w-9 rounded-xl flex items-center justify-center ${opt.iconBg}`}
                  >
                    {opt.icon}
                  </div>
                  <div>
                    <p className="text-xs font-semibold">{opt.label}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {opt.sub}
                    </p>
                  </div>
                  {priority === opt.value && (
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                  )}
                </button>
              ))}
            </div>
            <div className="flex justify-between pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStep("lab")}
                className="gap-1.5"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Retour
              </Button>
              <Button
                size="sm"
                onClick={() => runSearch(labPref, priority)}
                className="gap-1.5"
              >
                Compiler
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </>
        )}

        {/* ── Searching ─────────────────────────────────────── */}
        {step === "searching" && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <p className="text-sm font-semibold">Analyse en cours…</p>
            <p className="text-xs text-muted-foreground text-center">
              Recherche de {parsedNames.length} test
              {parsedNames.length > 1 ? "s" : ""} dans la base de données
            </p>
          </div>
        )}

        {/* ── Results ───────────────────────────────────────── */}
        {step === "results" && (
          <>
            {/* Summary banner */}
            <div className="flex items-center gap-3 rounded-xl bg-muted/40 border border-border/40 px-3 py-2.5">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">
                  {foundCount} test{foundCount > 1 ? "s" : ""} trouvé
                  {foundCount > 1 ? "s" : ""}
                  {notFoundCount > 0 && (
                    <span className="text-destructive/70 font-normal ml-2">
                      · {notFoundCount} introuvable
                      {notFoundCount > 1 ? "s" : ""}
                    </span>
                  )}
                </p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <p className="text-xs text-muted-foreground">
                    {priority === "cheaper"
                      ? "💰 Prix le plus bas"
                      : "⚡ Résultats rapides"}
                    {labPref !== "none" && (
                      <span className="ml-1.5">
                        · Labo :{" "}
                        <span className="font-medium">
                          {labPref === "cdl" ? "CDL" : "Dynacare"}
                        </span>
                      </span>
                    )}
                  </p>
                  {singleLabCount > 0 && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] bg-amber-50 text-amber-700 border border-amber-200 rounded px-1.5 py-0.5">
                      <AlertTriangle className="h-2.5 w-2.5" />
                      {singleLabCount} labo unique
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* ── Tab switcher ──────────────────────────────── */}
            <div className="flex rounded-lg border border-border/50 bg-muted/20 p-0.5 gap-0.5">
              <button
                onClick={() => setActiveTab("individual")}
                className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-medium rounded-md px-2 py-1.5 transition-all ${
                  activeTab === "individual"
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <ListChecks className="h-3.5 w-3.5" />
                Tests individuels
              </button>
              <button
                onClick={() => setActiveTab("profiles")}
                className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-medium rounded-md px-2 py-1.5 transition-all ${
                  activeTab === "profiles"
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                Profils
                {matchingProfiles.length > 0 && (
                  <span className="inline-flex items-center justify-center h-4 min-w-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold px-1">
                    {matchingProfiles.length}
                  </span>
                )}
              </button>
            </div>

            {/* ── Tab 1: Individual tests ────────────────────── */}
            {activeTab === "individual" && (
              <>
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
                                ← &ldquo;{t.inputName}&rdquo;
                              </p>
                            )}
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <span className="text-[10px] font-bold uppercase px-1 py-0.5 rounded bg-primary/5 text-primary/70">
                              {t.chosen.labCode}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {t.chosen.labName}
                            </span>
                            {t.isPaired ? (
                              <span className="inline-flex items-center gap-0.5 text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 rounded px-1 py-0.5">
                                <CheckCircle2 className="h-2.5 w-2.5" />2 labos
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 text-[10px] bg-amber-50 text-amber-700 border border-amber-200 rounded px-1 py-0.5">
                                <AlertTriangle className="h-2.5 w-2.5" />
                                {t.availableLabs?.[0] ?? "1 labo"} uniquement
                              </span>
                            )}
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
                            &ldquo;{t.inputName}&rdquo;
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Aucune correspondance trouvée
                          </p>
                        </div>
                      </div>
                    )
                  )}
                </div>

                {/* Price summary with editable service fee */}
                {subtotal > 0 && (
                  <div className="rounded-xl border border-border/50 bg-muted/20 overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-2 border-b border-border/30">
                      <span className="text-xs text-muted-foreground">
                        Sous-total ({foundCount} test{foundCount > 1 ? "s" : ""})
                      </span>
                      <span className="text-sm tabular-nums font-medium">
                        {formatCurrency(subtotal)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between px-3 py-2 border-b border-border/30 gap-2">
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                        <Receipt className="h-3 w-3" />
                        Frais de service
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground">$</span>
                        <Input
                          type="number"
                          min={0}
                          step={1}
                          value={editableServiceFee}
                          onChange={(e) =>
                            setEditableServiceFee(Math.max(0, Number(e.target.value) || 0))
                          }
                          className="h-6 w-16 text-xs text-right tabular-nums px-1.5 py-0"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between px-3 py-2.5 bg-muted/30">
                      <span className="text-sm font-semibold">Total estimé</span>
                      <span className="text-base font-bold tabular-nums">
                        {formatCurrency(total)}
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ── Tab 2: Profiles ───────────────────────────── */}
            {activeTab === "profiles" && (
              <>
                {matchingProfiles.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
                    <Layers className="h-8 w-8 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">
                      Aucun profil ne contient tous ces tests
                    </p>
                    <p className="text-xs text-muted-foreground/60">
                      Les profils s&apos;affichent quand un profil inclut l&apos;ensemble des tests sélectionnés
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {matchingProfiles.map((p) => {
                      const profileTotal = p.profilePrice + editableServiceFee;
                      return (
                        <div
                          key={p.id}
                          className={`rounded-lg border px-3 py-2.5 ${
                            p.isRecommended
                              ? "border-emerald-300 bg-emerald-50/50"
                              : "border-border/50 bg-card"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <p className="text-sm font-semibold leading-snug">
                                  {p.dealName}
                                </p>
                                {p.isRecommended && (
                                  <span className="inline-flex items-center gap-0.5 text-[10px] font-bold bg-emerald-600 text-white rounded px-1.5 py-0.5">
                                    <Star className="h-2.5 w-2.5" />
                                    Offre recommandée
                                  </span>
                                )}
                              </div>
                              {/* Included tests list */}
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {p.components.map((c) => (
                                  <span
                                    key={c.testMappingId}
                                    className="text-[10px] bg-muted rounded px-1.5 py-0.5 text-muted-foreground"
                                  >
                                    {c.canonicalName}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div className="shrink-0 text-right">
                              <p className="text-sm font-bold tabular-nums">
                                {formatCurrency(p.profilePrice)}
                              </p>
                              {p.isRecommended && p.selectedIndividualSum > 0 && (
                                <p className="text-[10px] text-emerald-700 tabular-nums">
                                  vs {formatCurrency(p.selectedIndividualSum)} séparé
                                </p>
                              )}
                            </div>
                          </div>
                          {/* Profile total with service fee */}
                          <div className="mt-2 pt-2 border-t border-border/20 flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              Total avec frais ({formatCurrency(editableServiceFee)})
                            </span>
                            <span className="text-sm font-bold tabular-nums">
                              {formatCurrency(profileTotal)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Service fee editor (also shown in profile tab) */}
                <div className="flex items-center justify-between rounded-lg border border-border/40 bg-muted/20 px-3 py-2">
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Receipt className="h-3 w-3" />
                    Frais de service
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">$</span>
                    <Input
                      type="number"
                      min={0}
                      step={1}
                      value={editableServiceFee}
                      onChange={(e) =>
                        setEditableServiceFee(Math.max(0, Number(e.target.value) || 0))
                      }
                      className="h-6 w-16 text-xs text-right tabular-nums px-1.5 py-0"
                    />
                  </div>
                </div>
              </>
            )}

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
              {foundCount > 0 && activeTab === "individual" && (
                <Button size="sm" onClick={handleAddAll} className="gap-1.5">
                  <Plus className="h-3.5 w-3.5" />
                  Ajouter {foundCount} test{foundCount > 1 ? "s" : ""}
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
