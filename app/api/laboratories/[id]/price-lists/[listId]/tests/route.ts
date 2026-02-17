import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import logger from "@/lib/logger";

/**
 * GET /api/laboratories/:id/price-lists/:listId/tests
 * Retourne tous les tests d'une liste de prix, triés par nom.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; listId: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Non autorisé" },
        { status: 401 }
      );
    }

    const { listId } = await params;

    const tests = await prisma.test.findMany({
      where: { priceListId: listId },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ success: true, data: tests });
  } catch (e) {
    logger.error({ err: e }, "GET /api/laboratories/.../price-lists/.../tests");
    return NextResponse.json(
      { success: false, message: "Erreur serveur" },
      { status: 500 }
    );
  }
}
