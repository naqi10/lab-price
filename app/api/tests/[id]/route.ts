import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import logger from "@/lib/logger";
import { logAudit } from "@/lib/services/audit.service";

/**
 * PATCH /api/tests/:id
 * Met à jour le prix et/ou le statut actif d'un test.
 */
export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Non autorisé" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await _req.json();
    const price = body.price != null ? Number(body.price) : undefined;
    const isActive = body.isActive;
    const turnaroundTime = body.turnaroundTime;
    const tubeType = body.tubeType;

    const data: { price?: number; isActive?: boolean; turnaroundTime?: string | null; tubeType?: string | null } = {};
    if (price !== undefined) data.price = price;
    if (typeof isActive === "boolean") data.isActive = isActive;
    if (turnaroundTime !== undefined) data.turnaroundTime = turnaroundTime;
    if (tubeType !== undefined) data.tubeType = tubeType;

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { success: false, message: "Aucune donnée à mettre à jour" },
        { status: 400 }
      );
    }

    const test = await prisma.test.update({
      where: { id },
      data,
    });

    logAudit({ userId: session.user!.id!, action: "UPDATE", entity: "test", entityId: id, details: data });

    return NextResponse.json({ success: true, data: test });
  } catch (e) {
    logger.error({ err: e }, "PATCH /api/tests/[id]");
    return NextResponse.json(
      { success: false, message: "Erreur serveur" },
      { status: 500 }
    );
  }
}
