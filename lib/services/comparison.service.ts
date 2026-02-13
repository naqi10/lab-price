import prisma from "@/lib/db";
import { formatCurrency } from "@/lib/utils";

/**
 * Represents the comparison result for a single laboratory.
 */
interface LabComparisonResult {
  laboratoryId: string;
  laboratoryName: string;
  laboratoryCode: string;
  tests: Array<{
    testMappingId: string;
    canonicalName: string;
    localTestName: string;
    price: number;
    similarity: number;
  }>;
  totalPrice: number;
  testCount: number;
  isComplete: boolean;
}

/**
 * Compare prices across laboratories for a given set of test mappings.
 *
 * Schema mapping:
 *   TestMapping.entries → TestMappingEntry[]
 *   TestMappingEntry has: localTestName, price, similarity, laboratoryId
 *
 * @param testMappingIds - Array of TestMapping IDs
 * @returns Comparison results sorted by total price (ascending)
 */
export async function compareLabPrices(
  testMappingIds: string[]
): Promise<LabComparisonResult[]> {
  if (testMappingIds.length === 0) {
    throw new Error("Au moins un test doit être sélectionné pour la comparaison");
  }

  const testMappings = await prisma.testMapping.findMany({
    where: { id: { in: testMappingIds } },
    include: {
      entries: {
        include: {
          laboratory: { select: { id: true, name: true, code: true, isActive: true } },
        },
      },
    },
  });

  if (testMappings.length === 0) {
    throw new Error("Aucun test mapping trouvé");
  }

  const labResults = new Map<string, LabComparisonResult>();

  for (const mapping of testMappings) {
    for (const entry of mapping.entries) {
      if (!entry.laboratory.isActive) continue;
      const labId = entry.laboratory.id;
      if (!labResults.has(labId)) {
        labResults.set(labId, {
          laboratoryId: labId,
          laboratoryName: entry.laboratory.name,
          laboratoryCode: entry.laboratory.code,
          tests: [],
          totalPrice: 0,
          testCount: 0,
          isComplete: false,
        });
      }
      const result = labResults.get(labId)!;
      const price = entry.price ?? 0;
      result.tests.push({
        testMappingId: mapping.id,
        canonicalName: mapping.canonicalName,
        localTestName: entry.localTestName,
        price,
        similarity: entry.similarity,
      });
      result.totalPrice += price;
      result.testCount += 1;
    }
  }

  const requiredCount = testMappingIds.length;
  for (const result of labResults.values()) {
    result.isComplete = result.testCount === requiredCount;
  }

  return Array.from(labResults.values()).sort((a, b) => {
    if (a.isComplete !== b.isComplete) return a.isComplete ? -1 : 1;
    return a.totalPrice - b.totalPrice;
  });
}

/**
 * Get detailed comparison for rendering a comparison table.
 * @param testMappingIds - Array of TestMapping IDs
 * @returns Structured comparison data with price matrix
 */
export async function getComparisonDetails(testMappingIds: string[]) {
  const results = await compareLabPrices(testMappingIds);
  const laboratories = results.map((r) => ({
    id: r.laboratoryId,
    name: r.laboratoryName,
    code: r.laboratoryCode,
    totalPrice: r.totalPrice,
    formattedTotalPrice: formatCurrency(r.totalPrice),
    isComplete: r.isComplete,
    testCount: r.testCount,
  }));

  const testMappings = await prisma.testMapping.findMany({
    where: { id: { in: testMappingIds } },
    select: { id: true, canonicalName: true, category: true },
    orderBy: { canonicalName: "asc" },
  });

  const priceMatrix: Record<string, Record<string, number | null>> = {};
  for (const mapping of testMappings) {
    priceMatrix[mapping.id] = {};
    for (const lab of laboratories) {
      const labResult = results.find((r) => r.laboratoryId === lab.id);
      const test = labResult?.tests.find((t) => t.testMappingId === mapping.id);
      priceMatrix[mapping.id][lab.id] = test?.price ?? null;
    }
  }

  return {
    laboratories,
    testMappings,
    priceMatrix,
    bestLaboratory: laboratories.find((l) => l.isComplete) ?? laboratories[0] ?? null,
  };
}

/**
 * Find the single best (cheapest) laboratory for a set of tests.
 * Only considers laboratories with complete coverage.
 */
export async function findBestLaboratory(
  testMappingIds: string[]
): Promise<LabComparisonResult | null> {
  const results = await compareLabPrices(testMappingIds);
  return results.find((r) => r.isComplete) ?? null;
}
