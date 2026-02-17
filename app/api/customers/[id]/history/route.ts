import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCustomerHistory } from "@/lib/services/customer.service";
import logger from "@/lib/logger";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ success: false, message: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;
    const history = await getCustomerHistory(id);

    return NextResponse.json({ success: true, data: history });
  } catch (error) {
    logger.error({ err: error }, "[GET /api/customers/:id/history]");
    return NextResponse.json({ success: false, message: "Erreur serveur" }, { status: 500 });
  }
}
