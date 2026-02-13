import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ success: false, message: "Non autorisé" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();

    const user = await prisma.user.update({
      where: { id },
      data: { name: body.name, email: body.email, role: body.role },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error("[PUT /api/users/:id]", error);
    return NextResponse.json({ success: false, message: "Erreur lors de la mise à jour" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ success: false, message: "Non autorisé" }, { status: 401 });

    const { id } = await params;
    if (id === session.user.id) {
      return NextResponse.json({ success: false, message: "Vous ne pouvez pas supprimer votre propre compte" }, { status: 400 });
    }

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Utilisateur supprimé" });
  } catch (error) {
    console.error("[DELETE /api/users/:id]", error);
    return NextResponse.json({ success: false, message: "Erreur lors de la suppression" }, { status: 500 });
  }
}
