import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import logger from "@/lib/logger";
import { logAudit } from "@/lib/services/audit.service";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ success: false, message: "Non autorisé" }, { status: 401 });

    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: users });
  } catch (error) {
    logger.error({ err: error }, "[GET /api/users]");
    return NextResponse.json({ success: false, message: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ success: false, message: "Non autorisé" }, { status: 401 });

    if ((session.user as any).role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Accès réservé aux administrateurs" }, { status: 403 });
    }

    const userCount = await prisma.user.count();
    if (userCount >= 5) {
      return NextResponse.json(
        { success: false, message: "Nombre maximum d'utilisateurs atteint (5)" },
        { status: 400 }
      );
    }

    const body = await request.json();
    if (!body.name || !body.email || !body.password) {
      return NextResponse.json({ success: false, message: "Nom, email et mot de passe requis" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email: body.email } });
    if (existing) {
      return NextResponse.json({ success: false, message: "Un utilisateur avec cet email existe déjà" }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(body.password, 12);

    const user = await prisma.user.create({
      data: { name: body.name, email: body.email, password: hashedPassword, role: body.role || "ADMIN" },
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
    });

    logAudit({ userId: session.user!.id!, action: "CREATE", entity: "user", entityId: user.id, details: { name: user.name, email: user.email, role: user.role } });

    return NextResponse.json({ success: true, data: user }, { status: 201 });
  } catch (error) {
    logger.error({ err: error }, "[POST /api/users]");
    const message = error instanceof Error ? error.message : "Erreur lors de la création";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
