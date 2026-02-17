import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import logger from "@/lib/logger";
import { logAudit } from "@/lib/services/audit.service";

/**
 * POST /api/tests/mappings/:id/entries
 * Add a new lab-specific entry to an existing test mapping.
 * Used from the comparison page to quickly create manual mappings.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Non autorisé" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    if (!body.laboratoryId || !body.localTestName) {
      return NextResponse.json(
        { success: false, message: "laboratoryId et localTestName sont requis" },
        { status: 400 }
      );
    }

    // Verify the mapping exists
    const mapping = await prisma.testMapping.findUnique({ where: { id } });
    if (!mapping) {
      return NextResponse.json(
        { success: false, message: "Correspondance non trouvée" },
        { status: 404 }
      );
    }

    // Check if entry already exists for this lab
    const existing = await prisma.testMappingEntry.findUnique({
      where: {
        testMappingId_laboratoryId: {
          testMappingId: id,
          laboratoryId: body.laboratoryId,
        },
      },
    });

    if (existing) {
      // Update the existing entry instead of creating a duplicate
      const entry = await prisma.testMappingEntry.update({
        where: { id: existing.id },
        data: {
          localTestName: body.localTestName,
          matchType: "MANUAL",
          similarity: 1.0,
          price: body.price ?? existing.price,
        },
        include: {
          laboratory: { select: { id: true, name: true } },
        },
      });
      return NextResponse.json({ success: true, data: entry });
    }

    // Create new entry
    const entry = await prisma.testMappingEntry.create({
      data: {
        testMappingId: id,
        laboratoryId: body.laboratoryId,
        localTestName: body.localTestName,
        matchType: "MANUAL",
        similarity: 1.0,
        price: body.price ?? null,
      },
      include: {
        laboratory: { select: { id: true, name: true } },
      },
    });

    logAudit({ userId: session.user.id, action: "CREATE", entity: "test_mapping_entry", entityId: entry.id, details: { testMappingId: id, laboratoryId: body.laboratoryId } });

    return NextResponse.json({ success: true, data: entry }, { status: 201 });
  } catch (error) {
    logger.error({ err: error }, "[POST /api/tests/mappings/:id/entries]");
    return NextResponse.json(
      { success: false, message: "Erreur serveur" },
      { status: 500 }
    );
  }
}
