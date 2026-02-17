import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import logger from "@/lib/logger";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;

    const draft = await prisma.comparisonDraft.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!draft) {
      return NextResponse.json({ success: false, message: "Brouillon non trouvé" }, { status: 404 });
    }

    if (draft.userId !== session.user.id) {
      return NextResponse.json({ success: false, message: "Non autorisé" }, { status: 403 });
    }

    await prisma.comparisonDraft.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Brouillon supprimé" });
  } catch (error) {
    logger.error({ err: error }, "[DELETE /api/comparison/drafts/:id]");
    return NextResponse.json(
      { success: false, message: "Erreur lors de la suppression" },
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
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;

    const draft = await prisma.comparisonDraft.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!draft) {
      return NextResponse.json({ success: false, message: "Brouillon non trouvé" }, { status: 404 });
    }

    if (draft.userId !== session.user.id) {
      return NextResponse.json({ success: false, message: "Non autorisé" }, { status: 403 });
    }

    const body = await request.json();
    const name = body.name as string | undefined;
    const testMappingIds = body.testMappingIds as string[] | undefined;

    const data: { name?: string; testMappingIds?: string[] } = {};
    if (name !== undefined && typeof name === "string" && name.trim()) {
      data.name = name.trim();
    }
    if (Array.isArray(testMappingIds)) {
      data.testMappingIds = testMappingIds;
    }

    const updated = await prisma.comparisonDraft.update({
      where: { id },
      data,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    logger.error({ err: error }, "[PUT /api/comparison/drafts/:id]");
    return NextResponse.json(
      { success: false, message: "Erreur lors de la mise à jour" },
      { status: 500 }
    );
  }
}
