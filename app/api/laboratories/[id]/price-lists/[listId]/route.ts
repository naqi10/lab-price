import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { deletePriceList } from "@/lib/services/price-list.service";
import prisma from "@/lib/db";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string; listId: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ success: false, message: "Non autorisé" }, { status: 401 });

    const { listId } = await params;
    const priceList = await prisma.priceList.findUnique({
      where: { id: listId },
      include: { tests: true },
    });

    if (!priceList) return NextResponse.json({ success: false, message: "Liste non trouvée" }, { status: 404 });

    return NextResponse.json({ success: true, data: priceList });
  } catch (error) {
    console.error("[GET /api/laboratories/:id/price-lists/:listId]", error);
    return NextResponse.json({ success: false, message: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string; listId: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ success: false, message: "Non autorisé" }, { status: 401 });

    const { listId } = await params;
    await deletePriceList(listId);

    return NextResponse.json({ success: true, message: "Liste supprimée" });
  } catch (error) {
    console.error("[DELETE /api/laboratories/:id/price-lists/:listId]", error);
    return NextResponse.json({ success: false, message: "Erreur lors de la suppression" }, { status: 500 });
  }
}
