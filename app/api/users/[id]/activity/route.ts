import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

/**
 * GET /api/users/[id]/activity
 *
 * Returns the last 20 audit log entries for a specific user.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ success: false, message: "Non autorisé" }, { status: 401 });
    }

    if ((session.user as any).role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Accès réservé aux administrateurs" }, { status: 403 });
    }

    const { id } = await params;

    const activity = await prisma.auditLog.findMany({
      where: { userId: id },
      take: 20,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        action: true,
        entity: true,
        entityId: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, data: activity });
  } catch (error) {
    console.error("[GET /api/users/:id/activity]", error);
    return NextResponse.json({ success: false, message: "Erreur serveur" }, { status: 500 });
  }
}
