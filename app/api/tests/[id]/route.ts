import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import logger from "@/lib/logger";
import { logAudit } from "@/lib/services/audit.service";

/**
 * PATCH /api/tests/:id
 * Met à jour un test (nom, prix, statut, délai, tube).
 * When the name changes, also updates any test_mapping_entries
 * that reference the old name for the same laboratory, so the
 * string-based join (tme.local_test_name = t.name) stays consistent.
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
    const name = typeof body.name === "string" ? body.name.trim() : undefined;
    const price = body.price != null ? Number(body.price) : undefined;
    const isActive = body.isActive;
    const turnaroundTime = body.turnaroundTime;
    const tubeType = body.tubeType;

    const data: { name?: string; price?: number; isActive?: boolean; turnaroundTime?: string | null; tubeType?: string | null } = {};
    if (name) data.name = name;
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

    // Use a transaction so the test name and mapping entries stay in sync
    const test = await prisma.$transaction(async (tx) => {
      // Read current test to get old name + lab id
      const current = await tx.test.findUniqueOrThrow({
        where: { id },
        include: {
          priceList: { select: { laboratoryId: true } },
        },
      });

      const updated = await tx.test.update({ where: { id }, data });

      // If name changed, sync any test_mapping_entries that referenced the old name
      if (data.name && data.name !== current.name) {
        await tx.testMappingEntry.updateMany({
          where: {
            localTestName: current.name,
            laboratoryId: current.priceList.laboratoryId,
          },
          data: { localTestName: data.name },
        });
      }

      return updated;
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
