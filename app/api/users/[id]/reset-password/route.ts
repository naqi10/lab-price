import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

/**
 * POST /api/users/[id]/reset-password
 *
 * Admin-only: Reset another user's password without knowing the current one.
 * Body: { newPassword: string }
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Non autorisé" }, { status: 401 });
    }

    if ((session.user as any).role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Accès réservé aux administrateurs" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    if (!body.newPassword || body.newPassword.length < 6) {
      return NextResponse.json(
        { success: false, message: "Le nouveau mot de passe doit contenir au moins 6 caractères" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ success: false, message: "Utilisateur non trouvé" }, { status: 404 });
    }

    const hashedPassword = await bcrypt.hash(body.newPassword, 12);

    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    return NextResponse.json({ success: true, message: "Mot de passe réinitialisé avec succès" });
  } catch (error) {
    console.error("[POST /api/users/:id/reset-password]", error);
    return NextResponse.json(
      { success: false, message: "Erreur lors de la réinitialisation" },
      { status: 500 }
    );
  }
}
