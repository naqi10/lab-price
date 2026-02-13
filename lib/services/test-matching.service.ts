import prisma from "@/lib/db";

/**
 * Search for lab tests using PostgreSQL pg_trgm fuzzy matching.
 *
 * Uses raw SQL with the pg_trgm extension's similarity() function
 * to find tests whose names are similar to the search query,
 * even with typos or alternate naming conventions.
 *
 * @param query         - The search term
 * @param options.laboratoryId - Optional filter by laboratory
 * @param options.threshold    - Minimum similarity score (0-1, default: 0.3)
 * @param options.limit        - Maximum results (default: 20)
 * @returns Array of matching lab tests with similarity scores
 */
export async function searchTests(
  query: string,
  options?: {
    laboratoryId?: string;
    threshold?: number;
    limit?: number;
  }
) {
  const { laboratoryId, threshold = 0.3, limit = 20 } = options ?? {};

  // Build optional laboratory filter clause
  const labFilterClause = laboratoryId
    ? 'AND pl."laboratoryId" = \'' + laboratoryId + '\''
    : "";

  // Raw SQL using pg_trgm similarity function.
  // Requires: CREATE EXTENSION IF NOT EXISTS pg_trgm;
  const sql = [
    "SELECT",
    "  lt.id,",
    "  lt.name,",
    "  lt.code,",
    "  lt.category,",
    "  lt.price,",
    "  lt.unit,",
    '  lt."priceListId",',
    '  l.id AS "laboratoryId",',
    '  l.name AS "laboratoryName",',
    '  l.code AS "laboratoryCode",',
    "  similarity(lt.name, $1) AS similarity",
    'FROM "LabTest" lt',
    'INNER JOIN "PriceList" pl ON lt."priceListId" = pl.id',
    'INNER JOIN "Laboratory" l ON pl."laboratoryId" = l.id',
    'WHERE pl."isActive" = true',
    '  AND l."deletedAt" IS NULL',
    "  " + labFilterClause,
    "  AND similarity(lt.name, $1) >= $2",
    "ORDER BY similarity DESC, lt.name ASC",
    "LIMIT $3",
  ].join("\n");

  const results = await prisma.$queryRawUnsafe<
    Array<{
      id: string;
      name: string;
      code: string | null;
      category: string | null;
      price: number;
      unit: string | null;
      priceListId: string;
      laboratoryId: string;
      laboratoryName: string;
      laboratoryCode: string;
      similarity: number;
    }>
  >(sql, query, threshold, limit);

  return results;
}

/**
 * Find tests across all laboratories that best match a given reference test name.
 *
 * For each active laboratory, finds the single best-matching test
 * using pg_trgm similarity scoring.
 *
 * @param referenceTestName - The canonical test name to match against
 * @param options.threshold - Minimum similarity score (default: 0.3)
 * @returns Array of best matches, one per laboratory
 */
export async function findMatchingTests(
  referenceTestName: string,
  options?: { threshold?: number }
) {
  const { threshold = 0.3 } = options ?? {};

  const sql = [
    "SELECT DISTINCT ON (l.id)",
    '  lt.id AS "labTestId",',
    '  lt.name AS "testName",',
    "  lt.price,",
    '  l.id AS "laboratoryId",',
    '  l.name AS "laboratoryName",',
    "  similarity(lt.name, $1) AS similarity",
    'FROM "LabTest" lt',
    'INNER JOIN "PriceList" pl ON lt."priceListId" = pl.id',
    'INNER JOIN "Laboratory" l ON pl."laboratoryId" = l.id',
    'WHERE pl."isActive" = true',
    '  AND l."deletedAt" IS NULL',
    "  AND similarity(lt.name, $1) >= $2",
    "ORDER BY l.id, similarity DESC",
  ].join("\n");

  const results = await prisma.$queryRawUnsafe<
    Array<{
      labTestId: string;
      testName: string;
      price: number;
      laboratoryId: string;
      laboratoryName: string;
      similarity: number;
    }>
  >(sql, referenceTestName, threshold);

  return results;
}

/**
 * Create a new test mapping.
 * @param data - The test mapping data
 * @returns The created test mapping with its lab-specific mappings
 */
export async function createTestMapping(data: {
  referenceTestName: string;
  referenceTestCode?: string | null;
  category?: string | null;
  labTestMappings: Array<{
    laboratoryId: string;
    labTestId: string;
    confidence?: number;
  }>;
}) {
  return prisma.testMapping.create({
    data: {
      referenceTestName: data.referenceTestName,
      referenceTestCode: data.referenceTestCode ?? null,
      category: data.category ?? null,
      labTestMappings: {
        createMany: {
          data: data.labTestMappings.map((mapping) => ({
            laboratoryId: mapping.laboratoryId,
            labTestId: mapping.labTestId,
            confidence: mapping.confidence ?? 1.0,
          })),
        },
      },
    },
    include: {
      labTestMappings: {
        include: {
          laboratory: { select: { id: true, name: true, code: true } },
          labTest: { select: { id: true, name: true, price: true } },
        },
      },
    },
  });
}

/** Retrieve all test mappings. */
export async function getTestMappings(options?: {
  category?: string;
  search?: string;
}) {
  const { category, search } = options ?? {};
  const where: Record<string, unknown> = {};
  if (category) { where.category = category; }
  if (search) { where.referenceTestName = { contains: search, mode: "insensitive" }; }
  return prisma.testMapping.findMany({
    where,
    orderBy: { referenceTestName: "asc" },
    include: {
      labTestMappings: {
        include: {
          laboratory: { select: { id: true, name: true, code: true } },
          labTest: { select: { id: true, name: true, price: true, code: true } },
        },
      },
    },
  });
}

/** Update an existing test mapping. */
export async function updateTestMapping(id: string, data: {
  referenceTestName?: string;
  referenceTestCode?: string | null;
  category?: string | null;
  labTestMappings?: Array<{ laboratoryId: string; labTestId: string; confidence?: number; }>;
}) {
  return prisma.$transaction(async (tx) => {
    if (data.labTestMappings) {
      await tx.labTestMapping.deleteMany({ where: { testMappingId: id } });
      await tx.labTestMapping.createMany({
        data: data.labTestMappings.map((m) => ({
          testMappingId: id, laboratoryId: m.laboratoryId,
          labTestId: m.labTestId, confidence: m.confidence ?? 1.0,
        })),
      });
    }
    return tx.testMapping.update({
      where: { id },
      data: {
        ...(data.referenceTestName && { referenceTestName: data.referenceTestName }),
        ...(data.referenceTestCode !== undefined && { referenceTestCode: data.referenceTestCode }),
        ...(data.category !== undefined && { category: data.category }),
      },
      include: { labTestMappings: { include: {
        laboratory: { select: { id: true, name: true, code: true } },
        labTest: { select: { id: true, name: true, price: true, code: true } },
      } } },
    });
  });
}

/** Delete a test mapping. */
export async function deleteTestMapping(id: string) {
  return prisma.$transaction(async (tx) => {
    await tx.labTestMapping.deleteMany({ where: { testMappingId: id } });
    return tx.testMapping.delete({ where: { id } });
  });
}

/** Calculate trigram similarity between two strings. */
export async function calculateSimilarity(textA: string, textB: string): Promise<number> {
  const result = await prisma.$queryRawUnsafe<Array<{ similarity: number }>>(
    "SELECT similarity($1, $2) AS similarity", textA, textB
  );
  return result[0]?.similarity ?? 0;
}
