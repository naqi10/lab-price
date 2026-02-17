import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { searchCustomers } from "@/lib/services/customer.service";
import logger from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ success: false, message: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";
    const customers = await searchCustomers(q);

    return NextResponse.json({ success: true, data: customers });
  } catch (error) {
    logger.error({ err: error }, "[GET /api/customers/search]");
    return NextResponse.json({ success: false, message: "Erreur serveur" }, { status: 500 });
  }
}
