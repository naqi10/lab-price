import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getQuotationById } from "@/lib/services/quotation.service";
import logger from "@/lib/logger";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ success: false, message: "Non autorisé" }, { status: 401 });

    const { id } = await params;
    const quotation = await getQuotationById(id);
    if (!quotation) return NextResponse.json({ success: false, message: "Devis non trouvé" }, { status: 404 });

    return NextResponse.json({ success: true, data: quotation });
  } catch (error) {
    logger.error({ err: error }, "[GET /api/quotations/:id]");
    return NextResponse.json({ success: false, message: "Erreur serveur" }, { status: 500 });
  }
}
