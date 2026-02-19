import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { searchTests } from "@/lib/services/test-matching.service";
import prisma from "@/lib/db";
import logger from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ success: false, message: "Non autorisé" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const browse = searchParams.get("browse") === "true";

    // ── Browse / paginated mode ────────────────────────────────────────
    if (browse) {
      const page     = Math.max(1, parseInt(searchParams.get("page")  || "1"));
      const limit    = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
      const q        = (searchParams.get("q") || "").trim();
      const labId    = searchParams.get("labId")    || "";
      const category = searchParams.get("category") || "";
      const mapped   = searchParams.get("mapped") || ""; // "yes" | "no" | ""
      const offset   = (page - 1) * limit;

      // Build WHERE clauses
      const conditions: string[] = [
        `pl."is_active" = true`,
        `l."deleted_at" IS NULL`,
      ];
      const bindings: (string | number)[] = [];
      let idx = 1;

      if (q.length >= 1) {
        conditions.push(`t.name ILIKE $${idx++}`);
        bindings.push(`%${q}%`);
      }
      if (labId) {
        conditions.push(`l.id = $${idx++}`);
        bindings.push(labId);
      }
      if (category) {
        conditions.push(`t.category = $${idx++}`);
        bindings.push(category);
      }
      if (mapped === "yes") {
        conditions.push(`tme.id IS NOT NULL`);
      } else if (mapped === "no") {
        conditions.push(`tme.id IS NULL`);
      }

      const whereClause = `WHERE ${conditions.join(" AND ")}`;

      const baseQuery = `
        FROM "tests" t
        INNER JOIN "price_lists" pl ON t."price_list_id" = pl.id
        INNER JOIN "laboratories" l ON pl."laboratory_id" = l.id
        LEFT JOIN "test_mapping_entries" tme ON tme."local_test_name" = t.name AND tme."laboratory_id" = l.id
        LEFT JOIN "test_mappings" tm ON tm.id = tme."test_mapping_id"
        ${whereClause}
      `;

      const countSql  = `SELECT COUNT(*)::int AS total ${baseQuery}`;
      const dataSql   = `
        SELECT
          t.id,
          t.name,
          t.code,
          t.category,
          t.price,
          t.unit,
          t."turnaround_time" AS "turnaroundTime",
          l.id AS "laboratoryId",
          l.name AS "laboratoryName",
          l.code AS "laboratoryCode",
          tme."test_mapping_id" AS "testMappingId",
          tm."canonical_name" AS "canonicalName"
        ${baseQuery}
        ORDER BY t.category ASC NULLS LAST, t.name ASC
        LIMIT $${idx++} OFFSET $${idx++}
      `;

      const [countResult, rows] = await Promise.all([
        prisma.$queryRawUnsafe<[{ total: number }]>(countSql, ...bindings),
        prisma.$queryRawUnsafe<any[]>(dataSql, ...bindings, limit, offset),
      ]);

      const total = countResult[0]?.total ?? 0;

      return NextResponse.json({
        success: true,
        data: rows,
        meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
      });
    }

    // ── Search mode (existing behaviour) ──────────────────────────────
    const query = searchParams.get("q") || "";
    const laboratoryId = searchParams.get("laboratoryId") || undefined;
    const limit = parseInt(searchParams.get("limit") || "20");

    if (query.length < 2) {
      return NextResponse.json({ success: true, data: [] });
    }

    const results = await searchTests(query, { laboratoryId, limit });
    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    logger.error({ err: error }, "[GET /api/tests]");
    return NextResponse.json({ success: false, message: "Erreur serveur" }, { status: 500 });
  }
}
