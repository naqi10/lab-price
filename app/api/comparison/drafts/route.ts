import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import logger from "@/lib/logger";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Non autorisé" }, { status: 401 });
    }

    const drafts = await prisma.comparisonDraft.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        testMappingIds: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ success: true, data: drafts });
  } catch (error) {
    logger.error({ err: error }, "[GET /api/comparison/drafts]");
    return NextResponse.json(
      { success: false, message: "Erreur serveur" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const name = body.name as string | undefined;
    const testMappingIds = body.testMappingIds as string[] | undefined;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { success: false, message: "Le nom du brouillon est requis" },
        { status: 400 }
      );
    }

    if (!Array.isArray(testMappingIds)) {
      return NextResponse.json(
        { success: false, message: "testMappingIds doit être un tableau" },
        { status: 400 }
      );
    }

    const draft = await prisma.comparisonDraft.create({
      data: {
        name: name.trim(),
        userId: session.user.id,
        testMappingIds,
      },
    });

    return NextResponse.json({ success: true, data: draft }, { status: 201 });
  } catch (error) {
    logger.error({ err: error }, "[POST /api/comparison/drafts]");
    return NextResponse.json(
      { success: false, message: "Erreur lors de la création du brouillon" },
      { status: 500 }
    );
  }
}
