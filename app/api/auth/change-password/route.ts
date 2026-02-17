import { NextRequest, NextResponse } from "next/server";
import bcryptjs from "bcryptjs";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { changePasswordSchema } from "@/lib/validations/auth";
import logger from "@/lib/logger";
import { logAudit } from "@/lib/services/audit.service";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Non autorisé" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validated = changePasswordSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    const isValidPassword = await bcryptjs.compare(
      validated.currentPassword,
      user.password
    );
    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, message: "Mot de passe actuel incorrect" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcryptjs.hash(validated.newPassword, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        mustChangePassword: false,
      },
    });

    logAudit({ userId: session.user.id!, action: "UPDATE", entity: "user", entityId: user.id, details: { action: "change_password" } });

    return NextResponse.json({
      success: true,
      message: "Mot de passe modifié avec succès",
      email: user.email,
    });
  } catch (error) {
    if (error && typeof error === "object" && "issues" in error) {
      return NextResponse.json(
        { success: false, message: "Données invalides" },
        { status: 400 }
      );
    }
    logger.error({ err: error }, "[POST /api/auth/change-password]");
    return NextResponse.json(
      { success: false, message: "Erreur lors du changement de mot de passe" },
      { status: 500 }
    );
  }
}
