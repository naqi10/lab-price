import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import logger from "@/lib/logger";
import { logAudit } from "@/lib/services/audit.service";
import { generateComparisonPdf } from "@/lib/services/pdf.service";
import type { ComparisonEmailResult } from "@/lib/services/comparison.service";
import { z } from "zod";

const updateEstimateSchema = z.object({
  status: z.enum(["DRAFT", "SENT", "ACCEPTED", "REJECTED"]).optional(),
  notes: z.string().optional(),
  validUntil: z.string().datetime().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json(
        { success: false, message: "Non autorisé" },
        { status: 401 }
      );

    const { id } = await params;

     const estimate = await prisma.estimate.findUnique({
       where: { id },
       include: {
         customer: true,
         createdBy: { select: { name: true, email: true } },
         emails: {
           include: {
             sentBy: { select: { name: true, email: true } },
           },
           orderBy: { sentAt: "desc" as const },
         },
       },
     });

    if (!estimate)
      return NextResponse.json(
        { success: false, message: "Estimation non trouvée" },
        { status: 404 }
      );

    // Check authorization
    if (estimate.createdById !== session.user.id)
      return NextResponse.json(
        { success: false, message: "Non autorisé" },
        { status: 403 }
      );

    return NextResponse.json({ success: true, data: estimate });
  } catch (error) {
    logger.error({ err: error }, "[GET /api/estimates/[id]]");
    return NextResponse.json(
      { success: false, message: "Erreur serveur" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json(
        { success: false, message: "Non autorisé" },
        { status: 401 }
      );

    const { id } = await params;
    const body = await request.json();
    const validated = updateEstimateSchema.parse(body);

    const estimate = await prisma.estimate.findUnique({
      where: { id },
    });

    if (!estimate)
      return NextResponse.json(
        { success: false, message: "Estimation non trouvée" },
        { status: 404 }
      );

    // Check authorization
    if (estimate.createdById !== session.user.id)
      return NextResponse.json(
        { success: false, message: "Non autorisé" },
        { status: 403 }
      );

    const updateData: any = {};
    if (validated.status) updateData.status = validated.status;
    if (validated.notes !== undefined) updateData.notes = validated.notes;
    if (validated.validUntil)
      updateData.validUntil = new Date(validated.validUntil);

    // Set sentAt if status is being changed to SENT
    if (validated.status === "SENT" && estimate.status !== "SENT") {
      updateData.sentAt = new Date();
    }

    const updated = await prisma.estimate.update({
      where: { id },
      data: updateData,
      include: {
        customer: true,
        createdBy: { select: { name: true } },
      },
    });

    logAudit({
      userId: session.user.id,
      action: "UPDATE",
      entity: "estimate",
      entityId: id,
      details: { changes: validated },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    logger.error({ err: error }, "[PUT /api/estimates/[id]]");
    const message =
      error instanceof Error ? error.message : "Erreur lors de la mise à jour";
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json(
        { success: false, message: "Non autorisé" },
        { status: 401 }
      );

    const { id } = await params;

    const estimate = await prisma.estimate.findUnique({
      where: { id },
    });

    if (!estimate)
      return NextResponse.json(
        { success: false, message: "Estimation non trouvée" },
        { status: 404 }
      );

    // Check authorization
    if (estimate.createdById !== session.user.id)
      return NextResponse.json(
        { success: false, message: "Non autorisé" },
        { status: 403 }
      );

    await prisma.estimate.delete({
      where: { id },
    });

    logAudit({
      userId: session.user.id,
      action: "DELETE",
      entity: "estimate",
      entityId: id,
      details: { estimateNumber: estimate.estimateNumber },
    });

    return NextResponse.json({ success: true, message: "Estimation supprimée" });
  } catch (error) {
    logger.error({ err: error }, "[DELETE /api/estimates/[id]]");
    const message =
      error instanceof Error ? error.message : "Erreur lors de la suppression";
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
