import prisma from "@/lib/db";

/**
 * Search for lab tests using PostgreSQL pg_trgm fuzzy matching.
 *
 * Uses raw SQL with the pg_trgm extension's similarity() function
 * to find tests whose names are similar to the search query.
 *
 * Table names use the @@map values from the Prisma schema:
 *   Test → "tests", PriceList → "price_lists", Laboratory → "laboratories"
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

  const labFilterClause = laboratoryId
    ? `AND pl."laboratory_id" = '${laboratoryId}'`
    : "";

  const sql = [
    "SELECT",
    "  t.id,",
    "  t.name,",
    "  t.code,",
    "  t.category,",
    "  t.price,",
    "  t.unit,",
    '  t."price_list_id" AS "priceListId",',
    '  l.id AS "laboratoryId",',
    '  l.name AS "laboratoryName",',
    '  l.code AS "laboratoryCode",',
    "  similarity(LOWER(t.name), LOWER($1)) AS similarity,",
    '  tme."test_mapping_id" AS "testMappingId",',
    '  tm."canonical_name" AS "canonicalName"',
    'FROM "tests" t',
    'INNER JOIN "price_lists" pl ON t."price_list_id" = pl.id',
    'INNER JOIN "laboratories" l ON pl."laboratory_id" = l.id',
    'LEFT JOIN "test_mapping_entries" tme ON tme."local_test_name" = t.name AND tme."laboratory_id" = l.id',
    'LEFT JOIN "test_mappings" tm ON tm.id = tme."test_mapping_id"',
    'WHERE pl."is_active" = true',
    '  AND l."deleted_at" IS NULL',
    "  " + labFilterClause,
    "  AND similarity(LOWER(t.name), LOWER($1)) >= $2",
    "ORDER BY similarity DESC, t.name ASC",
    "LIMIT $3",
  ].join("\n");

  return prisma.$queryRawUnsafe<
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
      testMappingId: string | null;
      canonicalName: string | null;
    }>
  >(sql, query, threshold, limit);
}

/**
 * Find tests across all laboratories that best match a given reference test name.
 * Returns the single best-matching test per laboratory.
 */
export async function findMatchingTests(
  referenceTestName: string,
  options?: { threshold?: number }
) {
  const { threshold = 0.3 } = options ?? {};

  const sql = [
    "SELECT DISTINCT ON (l.id)",
    '  t.id AS "testId",',
    '  t.name AS "testName",',
    "  t.price,",
    '  l.id AS "laboratoryId",',
    '  l.name AS "laboratoryName",',
    "  similarity(LOWER(t.name), LOWER($1)) AS similarity",
    'FROM "tests" t',
    'INNER JOIN "price_lists" pl ON t."price_list_id" = pl.id',
    'INNER JOIN "laboratories" l ON pl."laboratory_id" = l.id',
    'WHERE pl."is_active" = true',
    '  AND l."deleted_at" IS NULL',
    "  AND similarity(LOWER(t.name), LOWER($1)) >= $2",
    "ORDER BY l.id, similarity DESC",
  ].join("\n");

  return prisma.$queryRawUnsafe<
    Array<{
      testId: string;
      testName: string;
      price: number;
      laboratoryId: string;
      laboratoryName: string;
      similarity: number;
    }>
  >(sql, referenceTestName, threshold);
}

/**
 * Create a new test mapping with lab-specific entries.
 *
 * Schema mapping:
 *   TestMapping.canonicalName  — the canonical / reference test name
 *   TestMappingEntry           — links a TestMapping to a Laboratory with localTestName, similarity, price
 */
export async function createTestMapping(data: {
  canonicalName: string;
  code?: string | null;
  category?: string | null;
  description?: string | null;
  unit?: string | null;
  turnaroundTime?: string | null;
  tubeType?: string | null;
  entries: Array<{
    laboratoryId: string;
    localTestName: string;
    matchType?: "EXACT" | "FUZZY" | "MANUAL" | "NONE";
    similarity?: number;
    price?: number | null;
  }>;
}) {
  return prisma.testMapping.create({
    data: {
      canonicalName: data.canonicalName,
      code: data.code ?? null,
      category: data.category ?? null,
      description: data.description ?? null,
      unit: data.unit ?? null,
      turnaroundTime: data.turnaroundTime ?? null,
      tubeType: data.tubeType ?? null,
      entries: {
        createMany: {
          data: data.entries.map((e) => ({
            laboratoryId: e.laboratoryId,
            localTestName: e.localTestName,
            matchType: e.matchType ?? "MANUAL",
            similarity: e.similarity ?? 1.0,
            price: e.price ?? null,
          })),
        },
      },
    },
    include: {
      entries: {
        include: {
          laboratory: { select: { id: true, name: true, code: true } },
        },
      },
    },
  });
}

/** Retrieve paginated test mappings with optional lab filter. */
export async function getTestMappings(options?: {
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
  laboratoryId?: string;
}) {
  const { category, search, page = 1, limit = 20, laboratoryId } = options ?? {};
  const where: Record<string, unknown> = {};
  if (category) where.category = category;
  if (laboratoryId) {
    where.entries = { some: { laboratoryId } };
  }
  if (search) {
    where.OR = [
      { canonicalName: { contains: search, mode: "insensitive" } },
      { entries: { some: { localTestName: { contains: search, mode: "insensitive" } } } },
    ];
  }

  const [mappings, total] = await Promise.all([
    prisma.testMapping.findMany({
      where,
      orderBy: { canonicalName: "asc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        entries: {
          include: {
            laboratory: { select: { id: true, name: true, code: true } },
          },
        },
      },
    }),
    prisma.testMapping.count({ where }),
  ]);

  return { mappings, total };
}

/** Update an existing test mapping. */
export async function updateTestMapping(
  id: string,
  data: {
    canonicalName?: string;
    code?: string | null;
    category?: string | null;
    description?: string | null;
    unit?: string | null;
    turnaroundTime?: string | null;
    tubeType?: string | null;
    entries?: Array<{
      laboratoryId: string;
      localTestName: string;
      matchType?: "EXACT" | "FUZZY" | "MANUAL" | "NONE";
      similarity?: number;
      price?: number | null;
    }>;
  }
) {
  return prisma.$transaction(async (tx) => {
    if (data.entries) {
      await tx.testMappingEntry.deleteMany({ where: { testMappingId: id } });
      await tx.testMappingEntry.createMany({
        data: data.entries.map((e) => ({
          testMappingId: id,
          laboratoryId: e.laboratoryId,
          localTestName: e.localTestName,
          matchType: e.matchType ?? "MANUAL",
          similarity: e.similarity ?? 1.0,
          price: e.price ?? null,
        })),
      });
    }
    return tx.testMapping.update({
      where: { id },
      data: {
        ...(data.canonicalName && { canonicalName: data.canonicalName }),
        ...(data.code !== undefined && { code: data.code }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.unit !== undefined && { unit: data.unit }),
        ...(data.turnaroundTime !== undefined && { turnaroundTime: data.turnaroundTime }),
        ...(data.tubeType !== undefined && { tubeType: data.tubeType }),
      },
      include: {
        entries: {
          include: {
            laboratory: { select: { id: true, name: true, code: true } },
          },
        },
      },
    });
  });
}

/** Delete a test mapping and its entries (cascade). */
export async function deleteTestMapping(id: string) {
  return prisma.testMapping.delete({ where: { id } });
}

/** Calculate trigram similarity between two strings. */
export async function calculateSimilarity(
  textA: string,
  textB: string
): Promise<number> {
  const result = await prisma.$queryRawUnsafe<Array<{ similarity: number }>>(
    "SELECT similarity($1, $2) AS similarity",
    textA,
    textB
  );
  return result[0]?.similarity ?? 0;
}
