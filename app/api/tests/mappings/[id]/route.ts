import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { updateTestMapping, deleteTestMapping } from "@/lib/services/test-matching.service";
import logger from "@/lib/logger";
import { logAudit } from "@/lib/services/audit.service";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ success: false, message: "Non autorisé" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();

    const mapping = await updateTestMapping(id, {
      canonicalName: body.canonicalName,
      code: body.code || null,
      category: body.category || null,
      description: body.description ?? null,
      unit: body.unit || null,
      turnaroundTime: body.turnaroundTime || null,
      tubeType: body.tubeType || null,
      entries: (body.entries || []).map((e: any) => ({
        laboratoryId: e.laboratoryId,
        localTestName: e.testName || e.localTestName,
        matchType: e.matchType || "MANUAL",
        similarity: e.similarity ?? 1.0,
        price: e.price ?? null,
      })),
    });

    logAudit({ userId: session.user.id, action: "UPDATE", entity: "test_mapping", entityId: id, details: { canonicalName: body.canonicalName } });

    return NextResponse.json({ success: true, data: mapping });
  } catch (error) {
    logger.error({ err: error }, "[PUT /api/tests/mappings/:id]");
    const message = error instanceof Error ? error.message : "Erreur lors de la mise à jour";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ success: false, message: "Non autorisé" }, { status: 401 });

    const { id } = await params;
    await deleteTestMapping(id);

    logAudit({ userId: session.user!.id!, action: "DELETE", entity: "test_mapping", entityId: id });

    return NextResponse.json({ success: true, message: "Correspondance supprimée" });
  } catch (error) {
    logger.error({ err: error }, "[DELETE /api/tests/mappings/:id]");
    return NextResponse.json({ success: false, message: "Erreur lors de la suppression" }, { status: 500 });
  }
}
