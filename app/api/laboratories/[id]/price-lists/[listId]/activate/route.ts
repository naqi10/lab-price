import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { activatePriceList } from "@/lib/services/price-list.service";
import logger from "@/lib/logger";
import { logAudit } from "@/lib/services/audit.service";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; listId: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Non autorisé" },
        { status: 401 }
      );
    }

    const { listId } = await params;
    const result = await activatePriceList(listId);

    logAudit({ userId: session.user!.id!, action: "UPDATE", entity: "price_list", entityId: listId, details: { action: "activate" } });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    logger.error({ err: error }, "[POST /api/laboratories/:id/price-lists/:listId/activate]");
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
