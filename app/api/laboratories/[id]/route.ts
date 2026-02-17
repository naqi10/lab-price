import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getLaboratoryById, updateLaboratory, deleteLaboratory } from "@/lib/services/laboratory.service";
import { laboratorySchema } from "@/lib/validations/laboratory";
import logger from "@/lib/logger";
import { logAudit } from "@/lib/services/audit.service";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ success: false, message: "Non autorisé" }, { status: 401 });

    const { id } = await params;
    const laboratory = await getLaboratoryById(id);
    if (!laboratory) return NextResponse.json({ success: false, message: "Laboratoire non trouvé" }, { status: 404 });

    return NextResponse.json({ success: true, data: laboratory });
  } catch (error) {
    logger.error({ err: error }, "[GET /api/laboratories/:id]");
    return NextResponse.json({ success: false, message: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ success: false, message: "Non autorisé" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const validated = laboratorySchema.parse(body);
    const laboratory = await updateLaboratory(id, validated);

    logAudit({ userId: session.user!.id!, action: "UPDATE", entity: "laboratory", entityId: id, details: validated });

    return NextResponse.json({ success: true, data: laboratory });
  } catch (error) {
    logger.error({ err: error }, "[PUT /api/laboratories/:id]");
    const message = error instanceof Error ? error.message : "Erreur lors de la mise à jour";
    const status = message.includes("existe déjà") ? 409 : 500;
    return NextResponse.json({ success: false, message }, { status });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ success: false, message: "Non autorisé" }, { status: 401 });

    const { id } = await params;
    await deleteLaboratory(id);

    logAudit({ userId: session.user!.id!, action: "DELETE", entity: "laboratory", entityId: id });

    return NextResponse.json({ success: true, message: "Laboratoire supprimé" });
  } catch (error) {
    logger.error({ err: error }, "[DELETE /api/laboratories/:id]");
    return NextResponse.json({ success: false, message: "Erreur lors de la suppression" }, { status: 500 });
  }
}
