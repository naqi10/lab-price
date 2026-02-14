import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

/**
 * POST /api/comparison/preview
 * Lightweight endpoint that returns per-lab running totals for
 * a set of test mapping IDs (used by the test cart).
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Non autorisé" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { testMappingIds } = body;

    if (
      !testMappingIds ||
      !Array.isArray(testMappingIds) ||
      testMappingIds.length === 0
    ) {
      return NextResponse.json({ success: true, data: [] });
    }

    const entries = await prisma.testMappingEntry.findMany({
      where: { testMappingId: { in: testMappingIds } },
      select: {
        testMappingId: true,
        price: true,
        laboratoryId: true,
        laboratory: { select: { id: true, name: true, isActive: true } },
      },
    });

    // Aggregate totals per lab
    const labMap = new Map<
      string,
      { id: string; name: string; total: number; testCount: number }
    >();

    for (const entry of entries) {
      if (!entry.laboratory.isActive) continue;
      const labId = entry.laboratory.id;
      if (!labMap.has(labId)) {
        labMap.set(labId, {
          id: labId,
          name: entry.laboratory.name,
          total: 0,
          testCount: 0,
        });
      }
      const lab = labMap.get(labId)!;
      lab.total += entry.price ?? 0;
      lab.testCount += 1;
    }

    const totals = Array.from(labMap.values())
      .sort((a, b) => a.total - b.total)
      .map((l) => ({
        ...l,
        isComplete: l.testCount === testMappingIds.length,
      }));

    return NextResponse.json({ success: true, data: totals });
  } catch (error) {
    console.error("[POST /api/comparison/preview]", error);
    return NextResponse.json(
      { success: false, message: "Erreur serveur" },
      { status: 500 }
    );
  }
}
