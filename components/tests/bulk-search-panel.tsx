"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
  AlertCircle,
  ArrowLeft,
  AlertTriangle,
  Layers,
  Star,
  ListChecks,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

export type WizardStep = "input" | "lab" | "searching" | "results";
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

export interface BulkPreviewState {
  mode: "individual" | "profile";
  tests: BulkTestResult[];
  subtotal: number;
  selectedProfileId: string | null;
  selectedProfileName: string | null;
}

type ResultTab = "individual" | "profiles";

interface BulkSearchPanelProps {
  onClose: () => void;
  /** Fires whenever the wizard step changes */
  onStepChange?: (step: WizardStep) => void;
  /** Fires when results are ready (results step) or cleared */
  onResultsChange?: (state: BulkPreviewState) => void;
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

const STEP_ORDER: WizardStep[] = ["input", "lab", "results"];

// ── Component ──────────────────────────────────────────────────────────────

export default function BulkSearchPanel({
  onClose,
  onStepChange,
  onResultsChange,
}: BulkSearchPanelProps) {
  const [step, setStep] = useState<WizardStep>("input");
  const [rawInput, setRawInput] = useState("");
  const [labPref, setLabPref] = useState<LabPreference>("none");
  const [priority, setPriority] = useState<PriorityPreference>("cheaper");
  const [matchedTests, setMatchedTests] = useState<MatchedTest[]>([]);
  const [matchingProfiles, setMatchingProfiles] = useState<ProfileMatchResult[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ResultTab>("individual");
  // serviceFee is now managed in the parent summary panel
  const lastResultsSignatureRef = useRef<string>("");

  // Pre-search results: run once with no lab preference to get accurate per-lab stats
  const [preSearchResults, setPreSearchResults] = useState<MatchedTest[]>([]);
  const [preSearchLoading, setPreSearchLoading] = useState(false);

  // Each non-empty line = one test (commas also split for paste convenience)
  const parsedNames = rawInput
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  // Compute per-lab stats from actual matched results (accurate, no separate search)
  const labPreview = useMemo(() => {
    const source = preSearchResults.length > 0 ? preSearchResults : matchedTests;
    if (source.length === 0) return { cdl: null, dynacare: null, loading: preSearchLoading };

    let cdlTotal = 0, cdlTatSum = 0, cdlCount = 0, cdlId = "";
    let dynTotal = 0, dynTatSum = 0, dynCount = 0, dynId = "";

    for (const t of source) {
      if (!t.found || !t.labResults.length) continue;
      for (const r of t.labResults) {
        const labIsCdl = isCDL(r.labCode, r.labName);
        const labIsDyn = isDynacare(r.labCode, r.labName);
        if (labIsCdl && !cdlId) cdlId = r.labId;
        if (labIsDyn && !dynId) dynId = r.labId;
      }
    }

    for (const t of source) {
      if (!t.found || !t.labResults.length) continue;
      // Find best price per lab for this test
      const cdlResult = cdlId ? t.labResults.filter((r) => r.labId === cdlId).sort((a, b) => a.price - b.price)[0] : null;
      const dynResult = dynId ? t.labResults.filter((r) => r.labId === dynId).sort((a, b) => a.price - b.price)[0] : null;

      if (cdlResult) {
        cdlTotal += cdlResult.price;
        const tat = parseTurnaroundToHours(cdlResult.turnaroundTime);
        cdlTatSum += tat === Infinity ? 0 : tat;
        cdlCount++;
      }
      if (dynResult) {
        dynTotal += dynResult.price;
        const tat = parseTurnaroundToHours(dynResult.turnaroundTime);
        dynTatSum += tat === Infinity ? 0 : tat;
        dynCount++;
      }
    }

    return {
      cdl: cdlId ? { total: cdlTotal, avgTat: cdlCount > 0 ? cdlTatSum / cdlCount : Infinity, testCount: cdlCount } : null,
      dynacare: dynId ? { total: dynTotal, avgTat: dynCount > 0 ? dynTatSum / dynCount : Infinity, testCount: dynCount } : null,
      loading: preSearchLoading,
    };
  }, [preSearchResults, matchedTests, preSearchLoading]);

  // Run the actual search with no lab preference to get accurate per-lab stats,
  // then show the lab selection step with real data.
  const goToLabStep = useCallback(async () => {
    // Parse names fresh from rawInput to avoid any stale-closure issues
    const names = rawInput
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (names.length === 0) return;

    setStep("lab");
    setPreSearchLoading(true);
    try {
      // Reuse the same search logic but with no preference
      // We need to inline the fetch+resolve here to get pre-search results
      type Candidate = {
        testMappingId: string;
        score: number;
        labResults: LabResult[];
        canonicalName: string | null;
        tubeType: string | null;
      };

      const searchResults = await Promise.all(
        names.map(async (name) => {
          try {
            const r = await fetch(`/api/tests?q=${encodeURIComponent(name)}&limit=10`);
            const d = await r.json();
            if (!d.success || !d.data?.length) return { inputName: name, candidates: [] as Candidate[] };

            const grouped = new Map<string, LabResult[]>();
            const groupBestRank = new Map<string, number>();
            const groupCanonical = new Map<string, string>();
            const groupTubeType = new Map<string, string | null>();

            for (let i = 0; i < d.data.length; i++) {
              const t = d.data[i];
              if (!t.testMappingId) continue;
              const arr = grouped.get(t.testMappingId) ?? [];
              arr.push({
                labName: t.laboratoryName, labCode: t.laboratoryCode, labId: t.laboratoryId,
                price: t.price, turnaroundTime: t.turnaroundTime ?? null, tubeType: t.tubeType ?? null,
                testMappingId: t.testMappingId, canonicalName: t.canonicalName ?? null,
              });
              grouped.set(t.testMappingId, arr);
              if (!groupBestRank.has(t.testMappingId) || i < groupBestRank.get(t.testMappingId)!)
                groupBestRank.set(t.testMappingId, i);
              if (t.canonicalName && !groupCanonical.has(t.testMappingId))
                groupCanonical.set(t.testMappingId, t.canonicalName);
              if (!groupTubeType.has(t.testMappingId))
                groupTubeType.set(t.testMappingId, t.tubeType ?? null);
            }

            const qWords = name.toLowerCase().replace(/[^a-z0-9]/g, " ").split(/\s+/).filter(Boolean);
            const wordPrecision = (canonical: string): number => {
              const cWords = canonical.toLowerCase().replace(/[^a-z0-9]/g, " ").split(/\s+/).filter(Boolean);
              if (cWords.length === 0) return 0;
              let matches = 0;
              for (const qw of qWords) {
                if (cWords.some((cw) => cw.startsWith(qw) || qw.startsWith(cw))) matches++;
              }
              return matches / cWords.length;
            };

            const candidates: Candidate[] = [];
            for (const [mid, labResults] of grouped) {
              const rank = groupBestRank.get(mid) ?? 0;
              const rankScore = 1 - rank / Math.max(d.data.length, 1);
              const precision = wordPrecision(groupCanonical.get(mid) ?? "");
              candidates.push({
                testMappingId: mid, score: rankScore * 0.2 + precision * 0.8,
                labResults, canonicalName: groupCanonical.get(mid) ?? null, tubeType: groupTubeType.get(mid) ?? null,
              });
            }
            candidates.sort((a, b) => b.score - a.score);
            return { inputName: name, candidates };
          } catch { return { inputName: name, candidates: [] as Candidate[] }; }
        })
      );

      // Resolve duplicates
      const claimedIds = new Set<string>();
      const resolved: MatchedTest[] = searchResults.map(({ inputName, candidates }) => {
        for (const c of candidates) {
          if (claimedIds.has(c.testMappingId)) continue;
          claimedIds.add(c.testMappingId);
          const uniqueLabs = new Map<string, LabResult>();
          for (const r of c.labResults) { if (!uniqueLabs.has(r.labId)) uniqueLabs.set(r.labId, r); }
          const ulr = [...uniqueLabs.values()];
          return {
            inputName, found: true, testMappingId: c.testMappingId,
            canonicalName: c.canonicalName, tubeType: c.tubeType, labResults: c.labResults,
            chosen: chooseBest(c.labResults, "none", "cheaper"),
            isPaired: ulr.some((r) => isCDL(r.labCode, r.labName)) && ulr.some((r) => isDynacare(r.labCode, r.labName)),
            availableLabs: ulr.map((r) => r.labCode),
          };
        }
        return { inputName, found: false, testMappingId: null, canonicalName: null, tubeType: null, labResults: [], chosen: null, isPaired: false, availableLabs: [] };
      });

      setPreSearchResults(resolved);
    } catch { /* ignore */ }
    setPreSearchLoading(false);
  }, [rawInput]);

  const runSearch = useCallback(
    async (lp: LabPreference, pr: PriorityPreference) => {
      setStep("searching");
      setSelectedProfileId(null);
      try {
        // Phase 1: Fetch all candidates for each input name in parallel
        type Candidate = {
          testMappingId: string;
          score: number;
          labResults: LabResult[];
          canonicalName: string | null;
          tubeType: string | null;
        };
        type SearchResult = {
          inputName: string;
          candidates: Candidate[];
        };

        const searchResults = await Promise.all(
          parsedNames.map(async (name): Promise<SearchResult> => {
            try {
              const r = await fetch(
                `/api/tests?q=${encodeURIComponent(name)}&limit=10`
              );
              const d = await r.json();
              if (!d.success || !d.data?.length) return { inputName: name, candidates: [] };

              // Group by testMappingId
              const grouped = new Map<string, LabResult[]>();
              const groupBestRank = new Map<string, number>();
              const groupCanonical = new Map<string, string>();
              const groupTubeType = new Map<string, string | null>();
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
                if (!groupBestRank.has(t.testMappingId) || i < groupBestRank.get(t.testMappingId)!) {
                  groupBestRank.set(t.testMappingId, i);
                }
                if (t.canonicalName && !groupCanonical.has(t.testMappingId)) {
                  groupCanonical.set(t.testMappingId, t.canonicalName);
                }
                if (!groupTubeType.has(t.testMappingId)) {
                  groupTubeType.set(t.testMappingId, t.tubeType ?? null);
                }
              }

              // Score each candidate group
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

              const candidates: Candidate[] = [];
              for (const [mid, labResults] of grouped) {
                const rank = groupBestRank.get(mid) ?? 0;
                const rankScore = 1 - rank / Math.max(totalResults, 1);
                const precision = wordPrecision(groupCanonical.get(mid) ?? "");
                const score = rankScore * 0.2 + precision * 0.8;
                candidates.push({
                  testMappingId: mid,
                  score,
                  labResults,
                  canonicalName: groupCanonical.get(mid) ?? null,
                  tubeType: groupTubeType.get(mid) ?? null,
                });
              }
              // Sort by score descending — best match first
              candidates.sort((a, b) => b.score - a.score);
              return { inputName: name, candidates };
            } catch {
              return { inputName: name, candidates: [] };
            }
          })
        );

        // Phase 2: Assign best non-duplicate match per input name
        const claimedIds = new Set<string>();
        const results: MatchedTest[] = searchResults.map(({ inputName, candidates }) => {
          const empty: MatchedTest = {
            inputName,
            found: false,
            testMappingId: null,
            canonicalName: null,
            tubeType: null,
            labResults: [],
            chosen: null,
            isPaired: false,
            availableLabs: [],
          };
          // Pick the highest-scored candidate whose testMappingId isn't already taken
          for (const candidate of candidates) {
            if (claimedIds.has(candidate.testMappingId)) continue;

            claimedIds.add(candidate.testMappingId);

            // Pairing detection
            const uniqueLabs = new Map<string, LabResult>();
            for (const r of candidate.labResults) {
              if (!uniqueLabs.has(r.labId)) uniqueLabs.set(r.labId, r);
            }
            const uniqueLabResults = [...uniqueLabs.values()];
            const hasCDL = uniqueLabResults.some((r) => isCDL(r.labCode, r.labName));
            const hasDyn = uniqueLabResults.some((r) => isDynacare(r.labCode, r.labName));

            return {
              inputName,
              found: true,
              testMappingId: candidate.testMappingId,
              canonicalName: candidate.canonicalName,
              tubeType: candidate.tubeType,
              labResults: candidate.labResults,
              chosen: chooseBest(candidate.labResults, lp, pr),
              isPaired: hasCDL && hasDyn,
              availableLabs: uniqueLabResults.map((r) => r.labCode),
            };
          }
          return empty;
        });

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
              if (d.success) {
                const profiles: ProfileMatchResult[] = d.data ?? [];
                setMatchingProfiles(profiles);
                const preferred =
                  profiles.find((p) => p.isRecommended && p.extraIncludedCount > 0) ??
                  profiles.find((p) => p.isRecommended) ??
                  profiles[0] ??
                  null;
                setSelectedProfileId(preferred?.id ?? null);
                const hasStrongProfile = profiles.some(
                  (p) => p.isRecommended && p.extraIncludedCount > 0
                );
                if (hasStrongProfile) {
                  setActiveTab("profiles");
                }
              }
            })
            .catch(() => {/* ignore */});
        }
      } catch {
        setStep("lab");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rawInput]
  );

  // Step 2: Determine the primary lab.
  // When user explicitly picked a lab, find its ID from ANY lab result (not just chosen).
  // This handles the case where the chosen lab is different but the preferred lab exists somewhere.
  const primaryLabId = useMemo(() => {
    if (labPref !== "none") {
      // Search all lab results across all tests to find the preferred lab's ID
      for (const t of matchedTests) {
        if (!t.found) continue;
        for (const r of t.labResults) {
          const isMatch = labPref === "cdl"
            ? isCDL(r.labCode, r.labName)
            : isDynacare(r.labCode, r.labName);
          if (isMatch) return r.labId;
        }
      }
    }
    // Fallback: majority vote (lab with most tests)
    const labCounts = new Map<string, number>();
    for (const t of matchedTests) {
      if (!t.found || !t.chosen) continue;
      labCounts.set(t.chosen.labId, (labCounts.get(t.chosen.labId) ?? 0) + 1);
    }
    let bestId = "";
    let bestCount = 0;
    for (const [id, count] of labCounts) {
      if (count > bestCount) { bestCount = count; bestId = id; }
    }
    return bestId;
  }, [matchedTests, labPref]);

  // Step 3: Exclude tests that only exist at a non-primary lab
  const relevantTests = useMemo(() => {
    if (!primaryLabId) return matchedTests;
    return matchedTests.map((t) => {
      if (!t.found || !t.chosen) return t;
      // Check if the primary lab actually has this test
      const primaryHasIt = t.labResults.some((r) => r.labId === primaryLabId);
      if (!primaryHasIt) {
        return { ...t, excluded: true as const };
      }
      return { ...t, excluded: false as const };
    });
  }, [matchedTests, primaryLabId]);

  const includedTests = relevantTests.filter(
    (t) => t.found && t.chosen && !("excluded" in t && t.excluded)
  );
  const excludedTests = relevantTests.filter(
    (t) => t.found && t.chosen && "excluded" in t && t.excluded
  );

  const foundCount = includedTests.length;
  const notFoundCount = relevantTests.filter((t) => !t.found).length;
  const singleLabCount = excludedTests.length;
  const subtotal = includedTests
    .reduce((sum, t) => sum + (t.chosen?.price ?? 0), 0);
  const bestProfile = useMemo(
    () =>
      matchingProfiles.find((p) => p.isRecommended && p.extraIncludedCount > 0) ??
      matchingProfiles.find((p) => p.isRecommended) ??
      matchingProfiles[0] ??
      null,
    [matchingProfiles]
  );
  const selectedProfile = useMemo(
    () =>
      matchingProfiles.find((p) => p.id === selectedProfileId) ??
      bestProfile ??
      null,
    [matchingProfiles, selectedProfileId, bestProfile]
  );

  const stepIdx = STEP_ORDER.indexOf(
    step === "searching" ? "results" : step
  );

  // Notify parent of step changes
  useEffect(() => {
    onStepChange?.(step);
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  // Notify parent when results are ready or cleared
  useEffect(() => {
    const emitResultsChange = (payload: BulkPreviewState, signature: string) => {
      if (lastResultsSignatureRef.current === signature) return;
      lastResultsSignatureRef.current = signature;
      onResultsChange?.(payload);
    };

    if (step !== "results") {
      emitResultsChange({
        mode: "individual",
        tests: [],
        subtotal: 0,
        selectedProfileId: null,
        selectedProfileName: null,
      }, "not-results");
      return;
    }
    const tests = includedTests
      .filter((t): t is MatchedTest & { chosen: LabResult; testMappingId: string } =>
        t.found && !!t.chosen && !!t.testMappingId && !("excluded" in t && t.excluded)
      )
      .map((t) => ({
        testMappingId: t.testMappingId,
        name: t.canonicalName || t.inputName,
        canonicalName: t.canonicalName,
        tubeType: t.tubeType,
        laboratoryId: t.chosen.labId,
        laboratoryName: t.chosen.labName,
        laboratoryCode: t.chosen.labCode,
        price: t.chosen.price,
        turnaroundTime: t.chosen.turnaroundTime,
      }));
    const testsSignature = tests
      .map((t) => `${t.testMappingId}:${t.laboratoryId}:${t.price}`)
      .join("|");

    if (activeTab === "profiles" && selectedProfile) {
      emitResultsChange({
        mode: "profile",
        tests,
        subtotal: selectedProfile.profilePrice,
        selectedProfileId: selectedProfile.id,
        selectedProfileName: selectedProfile.dealName,
      }, `results:profile:${selectedProfile.id}:${selectedProfile.profilePrice}:${testsSignature}`);
      return;
    }

    emitResultsChange({
      mode: "individual",
      tests,
      subtotal,
      selectedProfileId: null,
      selectedProfileName: null,
    }, `results:individual:${subtotal}:${testsSignature}`);
  }, [step, subtotal, activeTab, selectedProfile, includedTests]); // eslint-disable-line react-hooks/exhaustive-deps

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
                  goToLabStep();
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
                onClick={goToLabStep}
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

        {/* ── Step 2: Lab selection with badges ────────────── */}
        {step === "lab" && (
          <>
            <p className="text-sm text-muted-foreground">
              Choisissez un laboratoire pour vos {parsedNames.length} tests.
            </p>
            <div className="flex flex-col gap-2">
              {(() => {
                const { cdl, dynacare, loading } = labPreview;
                const isCheaper = (lab: "cdl" | "dynacare") => {
                  if (!cdl || !dynacare) return false;
                  return lab === "cdl" ? cdl.total < dynacare.total : dynacare.total < cdl.total;
                };
                const isFaster = (lab: "cdl" | "dynacare") => {
                  if (!cdl || !dynacare) return false;
                  return lab === "cdl" ? cdl.avgTat < dynacare.avgTat : dynacare.avgTat < cdl.avgTat;
                };
                const labs = [
                  {
                    value: "cdl" as const,
                    label: "CDL Laboratoires",
                    iconBg: "bg-blue-50 text-blue-700",
                    stats: cdl,
                    cheaper: isCheaper("cdl"),
                    faster: isFaster("cdl"),
                  },
                  {
                    value: "dynacare" as const,
                    label: "Dynacare",
                    iconBg: "bg-purple-50 text-purple-700",
                    stats: dynacare,
                    cheaper: isCheaper("dynacare"),
                    faster: isFaster("dynacare"),
                  },
                ];
                return labs.map((opt) => (
                  <button
                    key={opt.value}
                    disabled={loading || !opt.stats}
                    onClick={() => {
                      setLabPref(opt.value);
                      // Auto-set priority based on which badge this lab won
                      const pr = opt.cheaper ? "cheaper" as const : "faster" as const;
                      setPriority(pr);
                      runSearch(opt.value, pr);
                    }}
                    className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                      !opt.stats && !loading
                        ? "border-border/30 bg-muted/10 opacity-50 cursor-not-allowed"
                        : "border-border/60 bg-card hover:border-primary/40 hover:bg-primary/5 active:scale-[0.98]"
                    }`}
                  >
                    <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${opt.iconBg}`}>
                      <FlaskConical className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-sm font-semibold">{opt.label}</p>
                        {!loading && opt.stats && (
                          <div className="flex gap-1">
                            {opt.cheaper && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-700 rounded px-1.5 py-0.5">
                                <DollarSign className="h-2.5 w-2.5" />
                                Moins cher
                              </span>
                            )}
                            {opt.faster && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold bg-blue-100 text-blue-700 rounded px-1.5 py-0.5">
                                <Zap className="h-2.5 w-2.5" />
                                Plus rapide
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      {loading ? (
                        <p className="text-xs text-muted-foreground animate-pulse">Chargement...</p>
                      ) : opt.stats ? (
                        <p className="text-xs text-muted-foreground">
                          {opt.stats.testCount}/{parsedNames.length} tests
                          {" · "}
                          {formatCurrency(opt.stats.total)}
                          {opt.stats.avgTat < Infinity && (
                            <span> · ~{formatTurnaroundShort(`${Math.round(opt.stats.avgTat)}h`)}</span>
                          )}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground/50">Aucun test disponible</p>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                  </button>
                ));
              })()}
              {/* Auto-select option */}
              <button
                disabled={labPreview.loading}
                onClick={() => {
                  setLabPref("none");
                  setPriority("cheaper");
                  runSearch("none", "cheaper");
                }}
                className="flex items-center gap-3 rounded-xl border border-border/40 p-3 text-left transition-all bg-card hover:border-primary/40 hover:bg-primary/5 active:scale-[0.98]"
              >
                <div className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0 bg-muted text-muted-foreground">
                  <Zap className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">Meilleur prix global</p>
                  <p className="text-xs text-muted-foreground">
                    Choisir le moins cher par test, tous labos confondus
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
              </button>
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
                      {singleLabCount} exclu{singleLabCount > 1 ? "s" : ""} (autre labo)
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
                Individuel
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
                Avec profil
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
                {bestProfile && bestProfile.isRecommended && (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 px-3 py-2">
                    <p className="text-xs text-emerald-800">
                      Offre profil disponible:{" "}
                      <span className="font-semibold">{bestProfile.dealName}</span>
                      {bestProfile.extraIncludedCount > 0 && (
                        <span>
                          {" "}(+{bestProfile.extraIncludedCount} test{bestProfile.extraIncludedCount > 1 ? "s" : ""})
                        </span>
                      )}{" "}
                      · économie {formatCurrency(bestProfile.savingsAmount)}
                    </p>
                    <button
                      onClick={() => setActiveTab("profiles")}
                      className="mt-1 text-[11px] font-medium text-emerald-700 hover:text-emerald-900"
                    >
                      Voir le profil recommandé
                    </button>
                  </div>
                )}
                <div className="space-y-1.5">
                  {relevantTests.map((t, idx) => {
                    const isExcluded = "excluded" in t && t.excluded;
                    // Hide tests that only exist in a non-primary lab
                    if (isExcluded) return null;
                    return t.found && t.chosen ? (
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
                    );
                  })}
                </div>

                {/* Subtotal — service fee is shown in the summary panel on the right */}
                {subtotal > 0 && (
                  <div className="flex items-center justify-between rounded-lg border border-border/40 bg-muted/20 px-3 py-2">
                    <span className="text-xs text-muted-foreground">
                      Sous-total ({foundCount} test{foundCount > 1 ? "s" : ""})
                    </span>
                    <span className="text-sm tabular-nums font-semibold">
                      {formatCurrency(subtotal)}
                    </span>
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
                    {selectedProfile && (
                      <div
                        className={`rounded-lg border px-3 py-2.5 ${
                          selectedProfile.isRecommended
                            ? "border-emerald-300 bg-emerald-50/50"
                            : "border-border/50 bg-card"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="text-sm font-semibold leading-snug">
                                {selectedProfile.dealName}
                              </p>
                              {selectedProfile.isRecommended && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold bg-emerald-600 text-white rounded px-1.5 py-0.5">
                                  <Star className="h-2.5 w-2.5" />
                                  Offre recommandée
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {selectedProfile.components.map((c) => (
                                <span
                                  key={c.testMappingId}
                                  className="text-[10px] bg-muted rounded px-1.5 py-0.5 text-muted-foreground"
                                >
                                  {c.canonicalName}
                                </span>
                              ))}
                            </div>
                            {selectedProfile.extraIncludedCount > 0 && (
                              <p className="mt-1 text-[10px] text-muted-foreground">
                                Inclut {selectedProfile.extraIncludedCount} test{selectedProfile.extraIncludedCount > 1 ? "s" : ""} supplémentaire{selectedProfile.extraIncludedCount > 1 ? "s" : ""}.
                              </p>
                            )}
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-sm font-bold tabular-nums">
                              {formatCurrency(selectedProfile.profilePrice)}
                            </p>
                            {selectedProfile.selectedIndividualSum > 0 && (
                              <p className="text-[10px] text-muted-foreground tabular-nums">
                                vs {formatCurrency(selectedProfile.selectedIndividualSum)} séparé
                              </p>
                            )}
                            {selectedProfile.savingsAmount > 0 && (
                              <p className="text-[10px] text-emerald-700 tabular-nums">
                                Économie {formatCurrency(selectedProfile.savingsAmount)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {matchingProfiles.length > 1 && (
                      <div className="rounded-lg border border-border/40 bg-muted/20 px-3 py-2.5 space-y-1.5">
                        <p className="text-[11px] font-medium text-muted-foreground">
                          Offres alternatives
                        </p>
                        <select
                          value={selectedProfile?.id ?? ""}
                          onChange={(e) => setSelectedProfileId(e.target.value)}
                          className="w-full h-8 rounded-md border border-border/60 bg-background px-2 text-xs"
                        >
                          {matchingProfiles.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.dealName} - {formatCurrency(p.profilePrice)}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}

              </>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStep("lab")}
                className="gap-1"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Modifier
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
