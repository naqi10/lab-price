import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import logger from "@/lib/logger";
import { logAudit } from "@/lib/services/audit.service";

/**
 * PATCH /api/tests/bulk
 * Met à jour plusieurs tests en une transaction.
 * Body: { updates: Array<{ id: string, price?: number, isActive?: boolean }> }
 */
export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Non autorisé" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const updates = body.updates as Array<{
      id: string;
      price?: number;
      isActive?: boolean;
    }>;

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        { success: false, message: "Tableau 'updates' requis et non vide" },
        { status: 400 }
      );
    }

    const updated = await prisma.$transaction(
      updates.map((u) => {
        const data: { price?: number; isActive?: boolean } = {};
        if (u.price != null) data.price = Number(u.price);
        if (typeof u.isActive === "boolean") data.isActive = u.isActive;
        return prisma.test.update({
          where: { id: u.id },
          data,
        });
      })
    );

    logAudit({ userId: session.user!.id!, action: "UPDATE", entity: "test", details: { bulkCount: updated.length } });

    return NextResponse.json({
      success: true,
      data: { count: updated.length },
    });
  } catch (e) {
    logger.error({ err: e }, "PATCH /api/tests/bulk");
    return NextResponse.json(
      { success: false, message: "Erreur serveur" },
      { status: 500 }
    );
  }
}
