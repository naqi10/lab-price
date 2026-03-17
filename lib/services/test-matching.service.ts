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
  // seed1.ts alternate codes → actual test names
  [/\bblood\b/i, ["groupe sanguin"]],
  [/\bdig\b/i, ["digoxine"]],
  [/\bdil\b/i, ["dilantin", "phenytoine"]],
  [/\blytes\b/i, ["electrolytes"]],
  [/\belectrolytes?\b/i, ["lytes"]],
  [/électrolytes?/i, ["electrolytes", "lytes"]],
  [/\binsul\b/i, ["insuline"]],
  [/\blip\b/i, ["lipase"]],
  [/\bosm\b/i, ["osmolalite"]],
  [/\bsyph\b/i, ["syphilis"]],
  [/\bfolrbc\b/i, ["folate erythrocytaire"]],
  [/\bbnp\b/i, ["nt-pro-bnp", "ntprobnp"]],
  [/\bceru\b/i, ["ceruloplasmine"]],
  [/\bdhea\b/i, ["dh-s", "dhea-sulfate"]],
  [/\bfibr\b/i, ["fibrinogene"]],
  [/\bferi\b/i, ["ferritine"]],
  // Vitamin letter suffixes — prevent "vitamin a" from drifting to "vitamine k" via trigram
  [/\bvitamin[e]?\s*a\b/i, ["vitamine a", "retinol"]],
  [/\bvitamin[e]?\s*b[\s-]*12\b/i, ["vitamine b12", "cobalamine", "cyanocobalamine"]],
  [/\bvitamin[e]?\s*k\b/i, ["vitamine k"]],
  [/\bvitamin[e]?\s*b[\s-]*6\b/i, ["vitamine b6", "pyridoxine"]],
  [/\bvitamin[e]?\s*c\b/i, ["vitamine c", "acide ascorbique"]],
  [/\bvitamin[e]?\s*e\b/i, ["vitamine e", "tocopherol"]],
];

function expandSearchSynonyms(query: string): string[] {
  const extras: string[] = [];
  for (const [pattern, synonyms] of SYNONYM_MAP) {
    if (pattern.test(query)) extras.push(...synonyms);
  }
  return extras;
}

/**
 * Numeric token rule: if the query contains specific alphanumeric tokens like
 * "b12", "b9", "d3", "iga", "igg", etc., results MUST contain those tokens.
 * This prevents "vitamin b12" from matching "Acide Folique" standalone.
 *
 * Matches:
 *   - vitamin-letter codes: b12, b9, b6, d3, a1c, b1, b2, etc.
 *   - immunoglobulin classes: iga, igg, igm, ige, igd
 */
function extractNumericTokens(query: string): string[] {
  const q = query.toLowerCase();
  const tokens: string[] = [];
  // Single letter followed by digits (b12, b9, d3, e1...) — not pure numbers
  const alphaNum = q.match(/\b[a-z]\d+[a-z0-9]*\b/g) ?? [];
  // Immunoglobulin classes: iga, igg, igm, ige, igd
  const ig = q.match(/\big[geamd]\b/g) ?? [];
  for (const t of [...alphaNum, ...ig]) {
    if (!tokens.includes(t)) tokens.push(t);
  }
  return tokens;
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

  const synonyms = expandSearchSynonyms(query);

  // Base params: $1=query, $2=threshold, $3=limit
  const params: (string | number)[] = [query, threshold, limit];

  // Build lab filter clause
  let labFilter = "";
  if (laboratoryId) {
    labFilter = `AND pl."laboratory_id" = $${params.length + 1}`;
    params.push(laboratoryId);
  }

  // Build synonym ILIKE clauses for WHERE and also for SCORE
  // Synonyms are added to the score so that e.g. "vitamin a" → "vitamine a" gets
  // a proper score boost (not just included in WHERE by trigram alone).
  const synClauses: string[] = [];
  const synScoreWhen: string[] = [];
  for (const syn of synonyms) {
    const idx = params.length + 1;
    synClauses.push(`    OR t.name ILIKE '%' || $${idx} || '%'`);
    synClauses.push(`    OR tm."canonical_name" ILIKE '%' || $${idx} || '%'`);
    // Score: synonym name match = 0.82, canonical match = 0.80
    synScoreWhen.push(`WHEN t.name ILIKE '%' || $${idx} || '%' THEN 0.82`);
    synScoreWhen.push(`WHEN tm."canonical_name" ILIKE '%' || $${idx} || '%' THEN 0.80`);
    params.push(syn);
  }

  // Numeric token mandatory filter: "vitamin b12" → result MUST contain "b12"
  // Prevents "Acide Folique" (standalone) from appearing when b12/b9/d3 etc. are in the query.
  const numericTokens = extractNumericTokens(query);
  const numericTokenClauses: string[] = numericTokens.map((tok) => {
    const idx = params.length + 1;
    params.push(tok);
    return `(t.name ILIKE '%' || $${idx} || '%' OR tm."canonical_name" ILIKE '%' || $${idx} || '%' OR t.code ILIKE '%' || $${idx} || '%')`;
  });
  // Joined with AND — all tokens must be present
  const numericTokenFilter =
    numericTokenClauses.length > 0
      ? `AND ${numericTokenClauses.join(" AND ")}`
      : "";

  const scoreExpr = `GREATEST(
      similarity(${normalizedNameExpr}, ${normalizedQueryExpr}),
      CASE WHEN t.name ILIKE $1                            THEN 1.0
           WHEN t.name ILIKE $1 || '%'                    THEN 0.95
           WHEN t.code ILIKE $1                           THEN 0.92
           WHEN t.code ILIKE $1 || '%'                    THEN 0.90
           WHEN tm."canonical_name" ILIKE $1              THEN 0.93
           WHEN tm."canonical_name" ILIKE $1 || '%'       THEN 0.91
           WHEN ${normalizedCanonicalExpr} = ${normalizedQueryExpr} THEN 0.90
           WHEN t.name ILIKE '%' || $1 || '%'             THEN 0.85
           WHEN tm."canonical_name" ILIKE '%' || $1 || '%' THEN 0.83
           WHEN t.code ILIKE '%' || $1 || '%'             THEN 0.80
           WHEN array_to_string(tm.aliases, ' ') ILIKE '%' || $1 || '%' THEN 0.78
           ${synScoreWhen.join("\n           ")}
           ELSE 0 END
    )`;

  const matchWhere = [
    "    t.name ILIKE '%' || $1 || '%'",
    "    OR t.code ILIKE $1",
    "    OR t.code ILIKE $1 || '%'",
    `    OR tm."canonical_name" ILIKE '%' || $1 || '%'`,
    `    OR array_to_string(tm.aliases, ' ') ILIKE '%' || $1 || '%'`,
    `    OR similarity(${normalizedNameExpr}, ${normalizedQueryExpr}) >= $2`,
    `    OR ${normalizedCanonicalExpr} = ${normalizedQueryExpr}`,
    ...synClauses,
  ].join("\n");

  // CTE: compute all candidates + their score, then apply dynamic threshold:
  // If best score >= 0.90 (exact/prefix match exists) → only keep score >= 0.75
  // If best score >= 0.75 → only keep score >= 0.50
  // Otherwise show all candidates (fuzzy-only results)
  const sql = `
    WITH candidates AS (
      SELECT
        t.id,
        t.name,
        t.code,
        t.category,
        t.price,
        t.unit,
        t."price_list_id" AS "priceListId",
        l.id AS "laboratoryId",
        l.name AS "laboratoryName",
        l.code AS "laboratoryCode",
        ${scoreExpr} AS similarity,
        t."turnaround_time" AS "turnaroundTime",
        t."tube_type" AS "tubeType",
        tme."test_mapping_id" AS "testMappingId",
        tm."canonical_name" AS "canonicalName",
        tm."tube_type" AS "canonicalTubeType"
      FROM "tests" t
      INNER JOIN "price_lists" pl ON t."price_list_id" = pl.id
      INNER JOIN "laboratories" l ON pl."laboratory_id" = l.id
      LEFT JOIN "test_mapping_entries" tme ON tme.id = t."test_mapping_entry_id"
      LEFT JOIN "test_mappings" tm ON tm.id = tme."test_mapping_id"
      WHERE pl."is_active" = true
        AND l."deleted_at" IS NULL
        ${labFilter}
        ${numericTokenFilter}
        AND (
${matchWhere}
        )
    ),
    best AS (SELECT MAX(similarity) AS max_score FROM candidates)
    SELECT c.*
    FROM candidates c, best b
    WHERE c.similarity >= CASE
      WHEN b.max_score >= 0.90 THEN 0.75
      WHEN b.max_score >= 0.75 THEN 0.50
      ELSE 0
    END
    ORDER BY c.similarity DESC, c.name ASC
    LIMIT $3
  `;

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
      canonicalTubeType: string | null;
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
    code?: string | null;
    duration?: string | null;
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
            code: e.code ?? null,
            duration: e.duration ?? null,
          })),
        },
      },
    },
    include: {
      entries: {
        include: {
          laboratory: { select: { id: true, name: true, code: true } },
          tests: {
            where: { priceList: { isActive: true } },
            select: { code: true, turnaroundTime: true },
            take: 1,
          },
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
            tests: {
              where: { priceList: { isActive: true } },
              select: { code: true, turnaroundTime: true },
              take: 1,
            },
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
      code?: string | null;
      duration?: string | null;
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
          code: e.code ?? null,
          duration: e.duration ?? null,
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
            tests: {
              where: { priceList: { isActive: true } },
              select: { code: true, turnaroundTime: true },
              take: 1,
            },
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
