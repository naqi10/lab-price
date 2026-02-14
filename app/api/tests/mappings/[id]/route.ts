import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { updateTestMapping, deleteTestMapping } from "@/lib/services/test-matching.service";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ success: false, message: "Non autorisé" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();

    const mapping = await updateTestMapping(id, {
      canonicalName: body.canonicalName,
      category: body.category || null,
      description: body.description ?? null,
      entries: (body.entries || []).map((e: any) => ({
        laboratoryId: e.laboratoryId,
        localTestName: e.testName || e.localTestName,
        matchType: e.matchType || "MANUAL",
        similarity: e.similarity ?? 1.0,
        price: e.price ?? null,
      })),
    });

    return NextResponse.json({ success: true, data: mapping });
  } catch (error) {
    console.error("[PUT /api/tests/mappings/:id]", error);
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

    return NextResponse.json({ success: true, message: "Correspondance supprimée" });
  } catch (error) {
    console.error("[DELETE /api/tests/mappings/:id]", error);
    return NextResponse.json({ success: false, message: "Erreur lors de la suppression" }, { status: 500 });
  }
}
