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
  Plus,
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
type ProfileLabCode = "CDL" | "DYNACARE" | null;

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

function normalizeBulkQuery(input: string): string {
  const n = input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

  if (!n) return input;
  if (/\b(b2gp|beta[\s-]?2.*glycoprote|glycoproteine?\s*i)\b/.test(n)) return "B2GP";
  if (/\b(diab|diabetique\s*#?\s*1|diabetique\s*no?\s*1)\b/.test(n)) return "DIAB";
  if (/\b(liv1|hepatique\s*#?\s*1)\b/.test(n)) return "LIV1";
  if (/\b(panc1|panc)\b/.test(n)) return "PANC";
  if (/\b(ren2|renal\s*#?\s*2|renal)\b/.test(n)) return "REN2";
  if (/\b(bio1|biochimie\s*#?\s*1a)\b/.test(n)) return "BIO1";
  if (/\b(chm1|biochimie\s*#?\s*1b)\b/.test(n)) return "CHM1";
  if (/\b(chm2|biochimie\s*#?\s*2)\b/.test(n)) return "CHM2";
  if (/\b(chm5|biochimie\s*#?\s*2.*electroly)\b/.test(n)) return "CHM5";
  if (/\b(chl3|biochimie\s*#?\s*3.*electroly)\b/.test(n)) return "CHL3";
  if (/\b(chp3|profil\s*general\s*#?\s*3|biochimie\s*#?\s*3.*profil)\b/.test(n)) return "CHP3";
  if (/\b(fa12|vitamine?\s*b12.*folate|folate.*vitamine?\s*b12)\b/.test(n)) return "FA12";
  if (/\b(irn1|fer\s*#?\s*1|iron\s*#?\s*1)\b/.test(n)) return "IRN1";
  if (/\b(irn2|fer\s*#?\s*2|iron\s*#?\s*2)\b/.test(n)) return "IRN2";
  if (/\b(irn3|fer\s*#?\s*3|iron\s*#?\s*3)\b/.test(n)) return "IRN3";
  if (/\b(irn6|fer\s*#?\s*6|iron\s*#?\s*6)\b/.test(n)) return "IRN6";
  if (/\b(ane1|anemie\s*#?\s*1)\b/.test(n)) return "ANE1";
  if (/\b(ane3|anemie\s*#?\s*3)\b/.test(n)) return "ANE3";
  if (/\b(ane4|anemie\s*#?\s*4)\b/.test(n)) return "ANE4";
  if (/\b(fer|iron)\b/.test(n) && /\b(saturation|uibc|tibc|tibcp)\b/.test(n)) return "IRON";
  if (/\b(sma16|sma-?16|profil\s*sma-?16)\b/.test(n)) return "SMA16";
  if (/\b(sma5|sma-?5|profil\s*sma-?5)\b/.test(n)) return "SMA5";
  if (/\b(sma6|sma-?6|profil\s*sma-?6)\b/.test(n)) return "SMA6";
  if (/\b(sma7|sma-?7|profil\s*sma-?7)\b/.test(n)) return "SMA7";
  if (/\b(th2|thyroidien\s*no?\s*2|thyroid.*2)\b/.test(n)) return "TH2";
  if (/\b(th6|thyroidien\s*no?\s*6|thyroid.*6)\b/.test(n)) return "TH6";
  if (/\b(stone|urolithiase|urolithiasis)\b/.test(n)) return "STONE";
  if (/\b(celiac|coeliaque|coeliaq|celiaque|maladie\s*coeliaque)\b/.test(n)) {
    if (/\b(depistage|screen)\b/.test(n)) return "CELISCRE";
    return "CELIAC";
  }
  if (/\b(itss|gono[\s-]?chlam|its|sti|std)\b/.test(n)) return "ITSS";
  if (/\b(pren1|prenatal\s*no?\s*1|profil\s*prenatal\s*no?\s*1)\b/.test(n)) return "PREN1";
  if (/\b(pren2|prenatal\s*no?\s*2|profil\s*prenatal\s*no?\s*2)\b/.test(n)) return "PREN2";
  if (/\b(pren3|prenatal\s*no?\s*3|profil\s*prenatal\s*no?\s*3)\b/.test(n)) return "PREN3";
  if (/\b(monop|profil\s*monotest)\b/.test(n)) return "MONOP";
  if (/\b(osteop|osteoporose|osteoporosis|profil\s*osteop)\b/.test(n)) return "OSTEOP";
  if (/\b(fpsa[_\s-]?prof|profil\s*marqueurs?\s*prostatiques)\b/.test(n)) return "FPSA_PROF";
  if (/\b(lft|profil\s*hepatique|hepatic\s*panel|foie)\b/.test(n)) return "LFT";
  if (/\b(lipid18|lipid-?18|lipidique.*18|cardiovasculaire.*18)\b/.test(n)) return "LIPID18";
  if (/\b(lipid6|lipid-?6|lipidique.*6|cardiovasculaire.*6)\b/.test(n)) return "LIPID6";
  if (/\b(lipid|profil\s*lipidique|cardiovasculaire)\b/.test(n)) return "LIPID";
  if (/\b(hemogramme|hemogram|fsc|cbc|formule sanguine)\b/.test(n)) return "CBC";
  if (/\b(vitesse.*sedimentation|sedimentation|vitesse sed)\b/.test(n)) return "SED";
  if (/\b(tibcp|tibc|uibc|fer total)\b/.test(n)) return "TIBCP";
  if (/\b(inr|temps quick|prothrombine|pt)\b/.test(n)) return "PT";
  if (/\b(ptt|tca)\b/.test(n)) return "PTT";
  if (/\b(anti[\s-]?hbs|hbs\s*antibod|anticorps.*hbs)\b/.test(n)) return "ANHBS";
  if (/\b(anti[\s-]?hbc|hbc\s*antibod|anticorps.*hbc)\b/.test(n)) return "HEPBC";
  if (/\b(hbs\s*antigen|hbsag|antigene.*hbs)\b/.test(n)) return "HBS";
  if (/\b(hepatite?\s*a.*igm|anti.*hepatite?\s*a.*igm|havm|hepam)\b/.test(n)) return "HAVM";
  if (/\b(hepatite?\s*c.*anticorps|anti.*hepatite?\s*c|hepc|hcv\s*antibod)\b/.test(n)) return "HEPC";
  if (/\b(antigene?\s*hbs|hbsag|hbs\s*antigen)\b/.test(n)) return "HBS";
  if (/\b(hba1c|hbaic|a1c|hemoglobine?\s*a1c|hemoglobin\s*a1c)\b/.test(n)) return "HBA1C";
  if (/\b(cholesterol|cholesterole|chol)\b/.test(n)) return "CHOL";
  if (/\b(triglycerides?|triglycerides?|trig)\b/.test(n)) return "TRIG";
  if (/\b(haute\s*sensibilite|high\s*sensitivity|crp[-\s]?hs|hs[-\s]?crp)\b/.test(n)) return "CRPHS";
  if (/\b(apolipoproteine?\s*b|apob)\b/.test(n)) return "APOB";
  if (/\b(cholesterol\s*hdl|\bhdl\b)\b/.test(n)) return "HDL";
  if (/\b(cholesterol\s*ldl|\bldl\b)\b/.test(n)) return "LDLD";
  if (/\b(aps\s*libre|free\s*psa)\b/.test(n)) return "FPSA";
  if (/\b(aps\s*totale?|psa\s*total)\b/.test(n)) return "PSA";
  if (/\b(anticorps\s*maternel|recherche\s*d.?anticorps)\b/.test(n)) return "ABSN";
  if (/\b(groupe\s*sanguin|facteur\s*rh|blood\s*group)\b/.test(n)) return "BLOOD";
  if (/\b(rubeole|rubella)\b/.test(n)) return "RUB";
  if (/\b(toxoplasmose|toxo)\b/.test(n)) return "TOXG";
  if (/\b(glucose\s*pc|postprand)\b/.test(n)) return "PCGL";
  if (/\b(t4\s*libre|free\s*t4|ft4)\b/.test(n)) return "T4F";
  if (/\b(anti[\s-]?microsomes?\s*thyroid|anti[\s-]?tpo|tpo)\b/.test(n)) return "TAPRO";
  if (/\b(co2\s*totale?|bicarbonate)\b/.test(n)) return "CO2P";
  if (/\b(creatinine.*urines?\s*de\s*24|24h.*creatinine|24ucrea)\b/.test(n)) return "24UCREA";
  if (/\b(phosphore.*urines?\s*de\s*24|24h.*phosphore|24uphos)\b/.test(n)) return "24UPHOS";
  if (/\b(acide\s*urique.*urines?\s*de\s*24|24h.*urique|24uuric)\b/.test(n)) return "24UURIC";
  if (/\b(oxalates?.*urines?\s*de\s*24|24h.*oxal|oxaur)\b/.test(n)) return "OXAUR";
  if (/\b(calcium.*urines?\s*de\s*24|24h.*calcium|ca\/u)\b/.test(n)) return "CA/U";
  if (/\b(monotest)\b/.test(n)) return "MONO";
  if (/\b(phosphore|phosphate)\b/.test(n) && !/\b(urine|urinaire|hasard|random)\b/.test(n)) return "PO4";
  if (/\b(calcium\s*ionise)\b/.test(n)) return "CAI";
  if (/\b(electrophorese\s*des?\s*proteines?|electrophorese\s*proteines?)\b/.test(n)) return "SPEP";
  if (/\b(calcium.*(urine|urinaire).*(hasard|random)|cauran)\b/.test(n)) return "CAURAN";
  if (/\b(creatinine.*(urine|urinaire).*(hasard|random)|creauran)\b/.test(n)) return "CREAURAN";
  if (/\b(phosphore.*(urine|urinaire).*(hasard|random)|phosuran)\b/.test(n)) return "PHOSURAN";
  if (/\b(pth|parathyr)\b/.test(n)) return "PTH";
  if (/\b(alt|sgpt)\b/.test(n)) return "ALT";
  if (/\b(ast|sgot)\b/.test(n)) return "AST";
  if (/\b(gamma.*gt|gamma[-\s]?gt|ggt)\b/.test(n)) return "GGT";
  if (/\b(ldh|lactate.*dehydrogen|dehydrogenase)\b/.test(n)) return "LD";
  if (/\b(phosphatase.*alcaline|alkaline.*phosphatase|alkp)\b/.test(n)) return "ALKP";
  if (/\b(bilirubine?\s*totale?|total\s*bilirubin)\b/.test(n)) return "BILIT";
  if (/\b(vih|hiv|virus.*immunodeficience)\b/.test(n)) return "HIV";
  if (/\b(syph|treponem|rpr|vdrl)\b/.test(n)) return "SYPEIA";
  if (/\b(urine analysis|urinalysis|analyse d.?urine|analysis urine)\b/.test(n)) return "URI";
  if (/\b(creatinine|creatinin|crea)\b/.test(n)) return "CREA";
  if (/\b(iga\s*totales?|immunoglobuline?\s*iga)\b/.test(n)) return "IGA";
  if (/\b(transglutaminase|anti[\s-]?transglut)\b/.test(n)) return "TRANSGLUT";
  if (/\b(gliadine).*(igg)\b/.test(n) || /\b(anti[\s-]?gliadine).*(igg)\b/.test(n)) return "DEGLIAG";
  if (/\b(gliadine).*(iga)\b/.test(n) || /\b(anti[\s-]?gliadine).*(iga)\b/.test(n)) return "GLIA";
  if (/\b(vitamine?\s*b12|vitamin\s*b12|vb12)\b/.test(n)) return "VB12";
  if (/\b(folate|folates|acide folique|folique)\b/.test(n)) return "FOL";
  if (/\b(ferritine|ferritin|ferr)\b/.test(n)) return "FERR";
  if (/\b(culture genitale?|culture genital|stdmu)\b/.test(n)) return "STDMU";
  if (/\b(chlamydia|neisseria|gonorrh|gonorrhoeae|taan)\b/.test(n)) return "NGPCRD";
  if (/\b(electrolytes?|electrolytes?)\b/.test(n)) {
    if (/\b(urine|urinaire)\b/.test(n)) return "UELE";
    return "LYTES";
  }
  return input;
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
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [activeTab, setActiveTab] = useState<ResultTab>("individual");
  const [profileLabContext, setProfileLabContext] = useState<ProfileLabCode>(null);
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
              const q = normalizeBulkQuery(name);
              const r = await fetch(`/api/tests?q=${encodeURIComponent(q)}&limit=10`);
            const d = await r.json();
            if (!d.success || !d.data?.length) return { inputName: name, candidates: [] as Candidate[] };

            const grouped = new Map<string, LabResult[]>();
            const groupBestRank = new Map<string, number>();
            const groupCanonical = new Map<string, string>();
            const groupTubeType = new Map<string, string | null>();
            const groupCode = new Map<string, string>();

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
              if (t.code && !groupCode.has(t.testMappingId))
                groupCode.set(t.testMappingId, t.code);
            }

            const qWords = name.toLowerCase().replace(/[^a-z0-9]/g, " ").split(/\s+/).filter(Boolean);
            const normalized = normalizeBulkQuery(name).toUpperCase().trim();
            const isCodeLike = /^[A-Z0-9]{2,16}$/.test(normalized);
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
              const code = (groupCode.get(mid) ?? "").toUpperCase();
              const exactCodeBoost = isCodeLike && code === normalized ? 5 : 0;
              const startsWithPenalty =
                isCodeLike && normalized.length >= 3 && code.startsWith(normalized) && code !== normalized
                  ? -1
                  : 0;
              candidates.push({
                testMappingId: mid,
                score: exactCodeBoost + startsWithPenalty + rankScore * 0.2 + precision * 0.8,
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
                `/api/tests?q=${encodeURIComponent(normalizeBulkQuery(name))}&limit=10`
              );
              const d = await r.json();
              if (!d.success || !d.data?.length) return { inputName: name, candidates: [] };

              // Group by testMappingId
              const grouped = new Map<string, LabResult[]>();
              const groupBestRank = new Map<string, number>();
              const groupCanonical = new Map<string, string>();
              const groupTubeType = new Map<string, string | null>();
              const groupCode = new Map<string, string>();
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
                if (t.code && !groupCode.has(t.testMappingId)) {
                  groupCode.set(t.testMappingId, t.code);
                }
              }

              // Score each candidate group
              const qWords = name.toLowerCase()
                .replace(/[^a-z0-9]/g, " ").split(/\s+/).filter(Boolean);
              const normalized = normalizeBulkQuery(name).toUpperCase().trim();
              const isCodeLike = /^[A-Z0-9]{2,16}$/.test(normalized);

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
                const code = (groupCode.get(mid) ?? "").toUpperCase();
                const exactCodeBoost = isCodeLike && code === normalized ? 5 : 0;
                const startsWithPenalty =
                  isCodeLike && normalized.length >= 3 && code.startsWith(normalized) && code !== normalized
                    ? -1
                    : 0;
                const score = exactCodeBoost + startsWithPenalty + rankScore * 0.2 + precision * 0.8;
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
        setProfilesLoading(false);

        // ── Profile matching (async, non-blocking) ────────────────────
        // Must use the same "included" logic as UI (respect primary lab filter),
        // otherwise profiles can disappear because excluded tests are still queried.
        const localPrimaryLabId = (() => {
          if (lp !== "none") {
            for (const t of results) {
              if (!t.found) continue;
              for (const r of t.labResults) {
                const isMatch = lp === "cdl"
                  ? isCDL(r.labCode, r.labName)
                  : isDynacare(r.labCode, r.labName);
                if (isMatch) return r.labId;
              }
            }
          }
          const labCounts = new Map<string, number>();
          for (const t of results) {
            if (!t.found || !t.chosen) continue;
            labCounts.set(t.chosen.labId, (labCounts.get(t.chosen.labId) ?? 0) + 1);
          }
          let bestId = "";
          let bestCount = 0;
          for (const [id, count] of labCounts) {
            if (count > bestCount) {
              bestCount = count;
              bestId = id;
            }
          }
          return bestId;
        })();

        const foundTestsAllLabs = results
          .filter((t): t is MatchedTest & { chosen: LabResult; testMappingId: string } =>
            t.found && !!t.chosen && !!t.testMappingId
          );
        const foundTests = foundTestsAllLabs
          .filter((t) =>
            !localPrimaryLabId || t.labResults.some((r) => r.labId === localPrimaryLabId)
          );

        const hasBundleHintInput = parsedNames.some((raw) => {
          const n = raw
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim();
          return /\b(itss|lft|lipid|lipid18|lipid6|cardiovasculaire|apolipoproteine|apob|crp[-\s]?hs|hs[-\s]?crp|b2gp|glycoprote|diab|liv1|panc1|panc|ren2|bio1|chm1|chm2|chm5|chl3|chp3|biochimie|fa12|irn1|irn2|irn3|irn6|ane1|ane3|ane4|anemie|sma16|sma5|sma6|sma7|th2|th6|thyroid|stone|urolith|24uphos|24ucrea|24uuric|oxaur|hepatique|celiac|coeliaq|fpsa|prostat|monop|monotest|osteop|osteopor|pren1|pren2|pren3|prenatal|profil|profile|bundle|gono[\s-]?chlam|std|sti)\b/.test(n);
        });

        if (foundTestsAllLabs.length > 1 || hasBundleHintInput) {
          setProfilesLoading(true);
          const ids = foundTestsAllLabs.map((t) => t.testMappingId);
          const selectedPrices: Record<string, number> = {};
          for (const t of foundTestsAllLabs) {
            selectedPrices[t.testMappingId] = t.chosen.price;
          }
          const preferredLabCode: ProfileLabCode =
            lp === "cdl"
              ? "CDL"
              : lp === "dynacare"
              ? "DYNACARE"
              : (() => {
                  let cdl = 0;
                  let dyn = 0;
                  for (const t of foundTests) {
                    const code = t.chosen.labCode.toUpperCase();
                    if (code.includes("CDL")) cdl++;
                    if (code.includes("DYN")) dyn++;
                  }
                  if (cdl === 0 && dyn === 0) return null;
                  return cdl >= dyn ? "CDL" : "DYNACARE";
                })();
          setProfileLabContext(preferredLabCode);
          fetch("/api/tests/profile-match", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              testMappingIds: ids,
              selectedPrices,
              profileHints: parsedNames,
              preferredLabCode,
            }),
          })
            .then((r) => r.json())
            .then((d) => {
              if (d.success) {
                const profiles: ProfileMatchResult[] = d.data ?? [];
                setMatchingProfiles(profiles);
                // API is already cheapest-first; primary choice must be cheapest.
                setSelectedProfileId(profiles[0]?.id ?? null);
                setShowAlternatives((profiles.length ?? 0) > 1);
              }
              setProfilesLoading(false);
            })
            .catch(() => {
              setProfilesLoading(false);
            });
        } else {
          setMatchingProfiles([]);
          setSelectedProfileId(null);
          setShowAlternatives(false);
          setProfileLabContext(null);
          setProfilesLoading(false);
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
    () => matchingProfiles[0] ?? null,
    [matchingProfiles]
  );
  const selectedProfile = useMemo(
    () =>
      matchingProfiles.find((p) => p.id === selectedProfileId) ??
      bestProfile ??
      null,
    [matchingProfiles, selectedProfileId, bestProfile]
  );
  const topProfileId = matchingProfiles[0]?.id ?? null;
  const alternativeProfiles = useMemo(
    () => matchingProfiles.filter((p) => p.id !== selectedProfile?.id),
    [matchingProfiles, selectedProfile]
  );
  const sameLabAlternatives = useMemo(
    () =>
      alternativeProfiles.filter(
        (p) =>
          !profileLabContext ||
          (p.normalizedSourceLabCode ?? null) === profileLabContext
      ),
    [alternativeProfiles, profileLabContext]
  );
  const otherLabAlternatives = useMemo(
    () =>
      alternativeProfiles.filter(
        (p) =>
          !!profileLabContext &&
          (p.normalizedSourceLabCode ?? null) !== profileLabContext
      ),
    [alternativeProfiles, profileLabContext]
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
              spellCheck={false}
              autoCorrect="off"
              autoCapitalize="off"
              autoComplete="off"
              autoFocus
            />
            {parsedNames.length > 0 && (
              <div className="rounded-md border border-border/60 bg-muted/20 px-2.5 py-1.5">
                <p className="text-xs text-muted-foreground">
                  {parsedNames.length} ligne{parsedNames.length > 1 ? "s" : ""} detectee{parsedNames.length > 1 ? "s" : ""} (sans suggestion automatique)
                </p>
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
                {profilesLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin text-muted-foreground/70" />
                ) : matchingProfiles.length > 0 && (
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
                {profilesLoading ? (
                  <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
                    <Loader2 className="h-6 w-6 text-muted-foreground/60 animate-spin" />
                    <p className="text-sm text-muted-foreground">
                      Recherche des profils correspondants...
                    </p>
                  </div>
                ) : matchingProfiles.length === 0 ? (
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
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-medium bg-primary/10 text-primary rounded px-1.5 py-0.5">
                                {selectedProfile.normalizedSourceLabCode ?? selectedProfile.sourceLabCode ?? "LAB"}
                              </span>
                              {selectedProfile.id === topProfileId && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold bg-emerald-600 text-white rounded px-1.5 py-0.5">
                                  <Star className="h-2.5 w-2.5" />
                                  {selectedProfile.isRecommended ? "Offre recommandée" : "Meilleure offre"}
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
                            <p className="mt-1 text-[10px] text-muted-foreground">
                              {selectedProfile.profileTestCount} test{selectedProfile.profileTestCount > 1 ? "s" : ""} dans ce profil
                            </p>
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
                      <div className="rounded-lg border border-border/40 bg-muted/20 px-3 py-2.5">
                        <div className="flex items-center justify-between">
                          <p className="text-[11px] font-medium text-muted-foreground">
                            Offres alternatives
                          </p>
                          <button
                            onClick={() => setShowAlternatives((v) => !v)}
                            className="text-[11px] font-medium text-primary hover:text-primary/80"
                          >
                            {showAlternatives
                              ? "Masquer"
                              : `Voir alternatives (${matchingProfiles.length - 1})`}
                          </button>
                        </div>

                        {showAlternatives && (
                          <div className="mt-2 max-h-56 overflow-y-auto space-y-2 pr-1">
                            {sameLabAlternatives.length > 0 && (
                              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                                Même labo {profileLabContext ? `(${profileLabContext})` : ""}
                              </p>
                            )}
                            {sameLabAlternatives.map((p) => (
                                <div
                                  key={p.id}
                                  className="flex items-start justify-between rounded-md border border-border/50 bg-background px-2.5 py-1.5"
                                >
                                  <div className="min-w-0 flex-1 pr-2">
                                    <div className="flex items-center gap-1 flex-wrap">
                                      <p className="text-xs font-medium truncate">{p.dealName}</p>
                                      <span className="inline-flex items-center gap-0.5 text-[10px] font-medium bg-primary/10 text-primary rounded px-1.5 py-0.5">
                                        {p.normalizedSourceLabCode ?? p.sourceLabCode ?? "LAB"}
                                      </span>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground tabular-nums">
                                      {formatCurrency(p.profilePrice)}
                                      {p.savingsAmount > 0 ? ` · économie ${formatCurrency(p.savingsAmount)}` : ""}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground">
                                      {p.profileTestCount} test{p.profileTestCount > 1 ? "s" : ""} dans ce profil
                                    </p>
                                    {p.components.length > 0 && (
                                      <div className="mt-1 max-h-20 overflow-y-auto pr-1">
                                        <div className="flex flex-wrap gap-1">
                                        {p.components.map((c) => (
                                          <span
                                            key={`${p.id}-${c.testMappingId}`}
                                            className="text-[10px] bg-muted rounded px-1.5 py-0.5 text-muted-foreground"
                                          >
                                            {c.canonicalName}
                                          </span>
                                        ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  <button
                                    onClick={() => {
                                      setSelectedProfileId(p.id);
                                      setShowAlternatives(false);
                                    }}
                                    className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-primary/30 text-primary hover:bg-primary/10 transition-colors"
                                    title="Choisir cette alternative"
                                  >
                                    <Plus className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              ))}
                            {otherLabAlternatives.length > 0 && (
                              <>
                                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide pt-1">
                                  Autres labos
                                </p>
                                {otherLabAlternatives.map((p) => (
                                  <div
                                    key={p.id}
                                    className="flex items-start justify-between rounded-md border border-border/50 bg-background px-2.5 py-1.5"
                                  >
                                    <div className="min-w-0 flex-1 pr-2">
                                      <div className="flex items-center gap-1 flex-wrap">
                                        <p className="text-xs font-medium truncate">{p.dealName}</p>
                                        <span className="inline-flex items-center gap-0.5 text-[10px] font-medium bg-primary/10 text-primary rounded px-1.5 py-0.5">
                                          {p.normalizedSourceLabCode ?? p.sourceLabCode ?? "LAB"}
                                        </span>
                                      </div>
                                      <p className="text-[10px] text-muted-foreground tabular-nums">
                                        {formatCurrency(p.profilePrice)}
                                        {p.savingsAmount > 0 ? ` · économie ${formatCurrency(p.savingsAmount)}` : ""}
                                      </p>
                                      <p className="text-[10px] text-muted-foreground">
                                        {p.profileTestCount} test{p.profileTestCount > 1 ? "s" : ""} dans ce profil
                                      </p>
                                      {p.components.length > 0 && (
                                        <div className="mt-1 max-h-20 overflow-y-auto pr-1">
                                          <div className="flex flex-wrap gap-1">
                                            {p.components.map((c) => (
                                              <span
                                                key={`${p.id}-${c.testMappingId}`}
                                                className="text-[10px] bg-muted rounded px-1.5 py-0.5 text-muted-foreground"
                                              >
                                                {c.canonicalName}
                                              </span>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                    <button
                                      onClick={() => {
                                        setSelectedProfileId(p.id);
                                        setShowAlternatives(false);
                                      }}
                                      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-primary/30 text-primary hover:bg-primary/10 transition-colors"
                                      title="Choisir cette alternative"
                                    >
                                      <Plus className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                ))}
                              </>
                            )}
                          </div>
                        )}
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
