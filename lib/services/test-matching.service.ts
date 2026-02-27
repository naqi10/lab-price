import prisma from "@/lib/db";

// ── Search synonym expansion ─────────────────────────────────────────
// Maps known query fragments to alternative search terms so that
// searching "b12" also finds "cobalamine", "vitamine d" finds "25-oh", etc.
const SYNONYM_MAP: [RegExp, string[]][] = [
  [/\bb[\s-]*12\b/i, ["vitamine b12", "cobalamine"]],
  [/\bcobalamin/i, ["vitamine b12", "b12"]],
  [/\bfolate/i, ["acide folique"]],
  [/\bacide\s+folique/i, ["folate"]],
  [/\bvitamine?\s*d\b/i, ["25-oh", "25-hydroxy"]],
  [/\b25[\s-]?oh\b/i, ["vitamine d"]],
  [/\bhba1c\b/i, ["hemoglobine glyquee", "hemoglobine a1c"]],
  [/\bglyqu/i, ["hba1c"]],
  [/\bhemoglobine\b/i, ["hba1c"]],
  [/\bsgpt\b/i, ["alt"]],
  [/\bsgot\b/i, ["ast"]],
  [/\bphosphate\b/i, ["phosphore"]],
  [/\bphosphore\b/i, ["phosphate"]],
  [/\bfer\b/i, ["ferritine", "iron"]],
];

function expandSearchSynonyms(query: string): string[] {
  const extras: string[] = [];
  for (const [pattern, synonyms] of SYNONYM_MAP) {
    if (pattern.test(query)) extras.push(...synonyms);
  }
  return extras;
}

/**
 * Search for lab tests using a hybrid approach:
 *   1. ILIKE prefix/substring match (fast, exact)
 *   2. pg_trgm similarity (fuzzy fallback)
 *   3. Synonym expansion (b12 → cobalamine, vitamine d → 25-oh, etc.)
 *
 * Results are ranked by: exact prefix > substring > trigram similarity.
 * Threshold raised to 0.15 for trigram, but ILIKE matches are always
 * included regardless of similarity score so short queries like "TSH"
 * still return the right results.
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
  const { laboratoryId, threshold = 0.15, limit = 20 } = options ?? {};
  const normalizedNameExpr = "regexp_replace(LOWER(t.name), '[^a-z0-9]+', '', 'g')";
  const normalizedQueryExpr = "regexp_replace(LOWER($1), '[^a-z0-9]+', '', 'g')";
  const normalizedCanonicalExpr = `regexp_replace(LOWER(tm."canonical_name"), '[^a-z0-9]+', '', 'g')`;

  // Synonym expansion: generate extra search terms for known aliases
  const synonyms = expandSearchSynonyms(query);

  // Build parameterized query — base params: $1=query, $2=threshold, $3=limit
  // Synonym params start at $4 (or $5 if labId is present)
  const baseSqlParts = [
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
    "  GREATEST(",
    `    similarity(${normalizedNameExpr}, ${normalizedQueryExpr}),`,
    "    CASE WHEN t.name ILIKE $1 THEN 1.0",             // exact (case-insensitive)
    "         WHEN t.name ILIKE $1 || '%' THEN 0.95",     // prefix
    "         WHEN t.name ILIKE '%' || $1 || '%' THEN 0.85", // substring
    "         WHEN t.code ILIKE $1 THEN 0.9",             // exact code match
    `         WHEN tm."canonical_name" ILIKE '%' || $1 || '%' THEN 0.88`, // canonical name match
    "         ELSE 0 END",
    "  ) AS similarity,",
    '  t."turnaround_time" AS "turnaroundTime",',
    '  t."tube_type" AS "tubeType",',
    '  tme."test_mapping_id" AS "testMappingId",',
    '  tm."canonical_name" AS "canonicalName"',
    'FROM "tests" t',
    'INNER JOIN "price_lists" pl ON t."price_list_id" = pl.id',
    'INNER JOIN "laboratories" l ON pl."laboratory_id" = l.id',
    'LEFT JOIN "test_mapping_entries" tme ON tme.id = t."test_mapping_entry_id"',
    'LEFT JOIN "test_mappings" tm ON tm.id = tme."test_mapping_id"',
    'WHERE pl."is_active" = true',
    '  AND l."deleted_at" IS NULL',
  ];

  const params: (string | number)[] = [query, threshold, limit];

  // Lab filter
  if (laboratoryId) {
    baseSqlParts.push(`  AND pl."laboratory_id" = $${params.length + 1}`);
    params.push(laboratoryId);
  }

  // WHERE match conditions — primary query
  const matchConditions = [
    "    t.name ILIKE '%' || $1 || '%'",
    "    OR t.code ILIKE $1",
    `    OR tm."canonical_name" ILIKE '%' || $1 || '%'`,
    `    OR similarity(${normalizedNameExpr}, ${normalizedQueryExpr}) >= $2`,
    `    OR ${normalizedCanonicalExpr} = ${normalizedQueryExpr}`,
  ];

  // Add synonym expansion — each synonym gets an ILIKE condition
  for (const syn of synonyms) {
    const idx = params.length + 1;
    matchConditions.push(`    OR t.name ILIKE '%' || $${idx} || '%'`);
    matchConditions.push(`    OR tm."canonical_name" ILIKE '%' || $${idx} || '%'`);
    params.push(syn);
  }

  baseSqlParts.push("  AND (", ...matchConditions, "  )");
  baseSqlParts.push("ORDER BY similarity DESC, t.name ASC");
  baseSqlParts.push(`LIMIT $3`);

  const sql = baseSqlParts.join("\n");

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
      turnaroundTime: string | null;
      tubeType: string | null;
      testMappingId: string | null;
      canonicalName: string | null;
    }>
  >(sql, ...params);
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
