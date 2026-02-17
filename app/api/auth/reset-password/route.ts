import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { resetPasswordSchema } from "@/lib/validations/auth";
import logger from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const validated = resetPasswordSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ success: false, message: "Utilisateur non trouvé" }, { status: 404 });
    }

    const isValidPassword = await bcrypt.compare(validated.currentPassword, user.password);
    if (!isValidPassword) {
      return NextResponse.json({ success: false, message: "Mot de passe actuel incorrect" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(validated.newPassword, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return NextResponse.json({ success: true, message: "Mot de passe réinitialisé avec succès" });
  } catch (error) {
    logger.error({ err: error }, "[POST /api/auth/reset-password]");
    return NextResponse.json(
      { success: false, message: "Erreur lors de la réinitialisation" },
      { status: 500 }
    );
  }
}
