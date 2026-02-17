import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { searchTests } from "@/lib/services/test-matching.service";
import logger from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ success: false, message: "Non autorisé" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const laboratoryId = searchParams.get("laboratoryId") || undefined;
    const limit = parseInt(searchParams.get("limit") || "20");

    if (query.length < 2) {
      return NextResponse.json({ success: true, data: [] });
    }

    const results = await searchTests(query, { laboratoryId, limit });
    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    logger.error({ err: error }, "[GET /api/tests]");
    return NextResponse.json({ success: false, message: "Erreur serveur" }, { status: 500 });
  }
}
