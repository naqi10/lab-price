import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import logger from "@/lib/logger";
import { logAudit } from "@/lib/services/audit.service";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ success: false, message: "Non autorisé" }, { status: 401 });

    if ((session.user as any).role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Accès réservé aux administrateurs" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    // Build update data — only include fields that were sent
    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.role !== undefined) updateData.role = body.role;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    // Prevent deactivating the last active user
    if (body.isActive === false) {
      const activeCount = await prisma.user.count({ where: { isActive: true } });
      if (activeCount <= 1) {
        return NextResponse.json(
          { success: false, message: "Impossible de désactiver le dernier utilisateur actif" },
          { status: 400 }
        );
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
    });

    logAudit({ userId: session.user!.id!, action: "UPDATE", entity: "user", entityId: id, details: updateData });

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    logger.error({ err: error }, "[PUT /api/users/:id]");
    return NextResponse.json({ success: false, message: "Erreur lors de la mise à jour" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ success: false, message: "Non autorisé" }, { status: 401 });

    if ((session.user as any).role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Accès réservé aux administrateurs" }, { status: 403 });
    }

    const { id } = await params;
    if (id === session.user.id) {
      return NextResponse.json({ success: false, message: "Vous ne pouvez pas supprimer votre propre compte" }, { status: 400 });
    }

    // Prevent deleting the last active user
    const target = await prisma.user.findUnique({ where: { id }, select: { isActive: true } });
    if (target?.isActive) {
      const activeCount = await prisma.user.count({ where: { isActive: true } });
      if (activeCount <= 1) {
        return NextResponse.json(
          { success: false, message: "Impossible de supprimer le dernier utilisateur actif" },
          { status: 400 }
        );
      }
    }

    await prisma.user.delete({ where: { id } });

    logAudit({ userId: session.user.id!, action: "DELETE", entity: "user", entityId: id });

    return NextResponse.json({ success: true, message: "Utilisateur supprimé" });
  } catch (error) {
    logger.error({ err: error }, "[DELETE /api/users/:id]");
    return NextResponse.json({ success: false, message: "Erreur lors de la suppression" }, { status: 500 });
  }
}
