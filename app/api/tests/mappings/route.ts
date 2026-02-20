import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getTestMappings, createTestMapping } from "@/lib/services/test-matching.service";
import logger from "@/lib/logger";
import { logAudit } from "@/lib/services/audit.service";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ success: false, message: "Non autorisé" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || undefined;
    const category = searchParams.get("category") || undefined;

    const mappings = await getTestMappings({ search, category });
    return NextResponse.json({ success: true, data: mappings });
  } catch (error) {
    logger.error({ err: error }, "[GET /api/tests/mappings]");
    return NextResponse.json({ success: false, message: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ success: false, message: "Non autorisé" }, { status: 401 });

    const body = await request.json();

    if (!body.canonicalName) {
      return NextResponse.json({ success: false, message: "Le nom canonique est requis" }, { status: 400 });
    }

    const mapping = await createTestMapping({
      canonicalName: body.canonicalName,
      code: body.code || null,
      category: body.category || null,
      description: body.description || null,
      unit: body.unit || null,
      turnaroundTime: body.turnaroundTime || null,
      tubeType: body.tubeType || null,
      entries: (body.entries || []).map((e: any) => ({
        laboratoryId: e.laboratoryId,
        localTestName: e.testName || e.localTestName,
        matchType: "MANUAL" as const,
        similarity: 1.0,
      })),
    });

    logAudit({ userId: session.user.id, action: "CREATE", entity: "test_mapping", entityId: mapping.id, details: { canonicalName: body.canonicalName } });

    return NextResponse.json({ success: true, data: mapping }, { status: 201 });
  } catch (error) {
    logger.error({ err: error }, "[POST /api/tests/mappings]");
    const message = error instanceof Error ? error.message : "Erreur lors de la création";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
