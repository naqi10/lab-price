import prisma from "@/lib/db";

export interface BundleSummary {
  id: string;
  dealName: string;
  profileCode: string | null;
  profilePrice: number | null;
  customRate: number;
  category: string;
  componentCount: number;
}

export interface MatchedBundlePair {
  cdl: BundleSummary;
  qc: BundleSummary;
  similarity: number;
}

export interface CrossLabBundleReport {
  matched: MatchedBundlePair[];
  cdlOnly: BundleSummary[];
  qcOnly: BundleSummary[];
}

/** Strip accents, common filler words, and normalize to lowercase for comparison. */
function normalizeName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/\bPROFIL\b|\bBILAN\b|\bPANEL\b|\bNO?\b|\d+/g, "")
    .replace(/[^A-Z]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Jaccard similarity on word sets. */
function wordSimilarity(a: string, b: string): number {
  const wordsA = new Set(normalizeName(a).split(" ").filter((w) => w.length > 2));
  const wordsB = new Set(normalizeName(b).split(" ").filter((w) => w.length > 2));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  const intersection = [...wordsA].filter((w) => wordsB.has(w)).length;
  const union = new Set([...wordsA, ...wordsB]).size;
  return intersection / union;
}

/**
 * Compares CDL bundles against QC bundles using name similarity.
 * Returns matched pairs (similarity >= 0.4), CDL-only, and QC-only bundles.
 */
export async function compareBundlesAcrossLabs(): Promise<CrossLabBundleReport> {
  const allBundles = await prisma.bundleDeal.findMany({
    where: { isActive: true },
    orderBy: { dealName: "asc" },
  });

  const toSummary = (b: (typeof allBundles)[0]): BundleSummary => ({
    id: b.id,
    dealName: b.dealName,
    profileCode: b.profileCode,
    profilePrice: b.profilePrice,
    customRate: b.customRate,
    category: b.category,
    componentCount: b.testMappingIds.length,
  });

  const cdlBundles = allBundles.filter((b) => b.sourceLabCode === "CDL").map(toSummary);
  const qcBundles = allBundles.filter((b) => b.sourceLabCode === "QC").map(toSummary);
  // Manually created bundles (no sourceLabCode) are excluded from cross-lab comparison

  const SIMILARITY_THRESHOLD = 0.4;
  const matched: MatchedBundlePair[] = [];
  const matchedQcIds = new Set<string>();

  for (const cdl of cdlBundles) {
    let bestQc: BundleSummary | null = null;
    let bestScore = 0;

    for (const qc of qcBundles) {
      if (matchedQcIds.has(qc.id)) continue;
      const score = wordSimilarity(cdl.dealName, qc.dealName);
      if (score > bestScore) {
        bestScore = score;
        bestQc = qc;
      }
    }

    if (bestQc && bestScore >= SIMILARITY_THRESHOLD) {
      matched.push({ cdl, qc: bestQc, similarity: Math.round(bestScore * 100) / 100 });
      matchedQcIds.add(bestQc.id);
    }
  }

  const matchedCdlIds = new Set(matched.map((m) => m.cdl.id));
  const cdlOnly = cdlBundles.filter((b) => !matchedCdlIds.has(b.id));
  const qcOnly = qcBundles.filter((b) => !matchedQcIds.has(b.id));

  return { matched, cdlOnly, qcOnly };
}
