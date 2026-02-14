import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getComparisonDetails } from "@/lib/services/comparison.service";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ success: false, message: "Non autorisé" }, { status: 401 });

    const body = await request.json();
    const { testMappingIds } = body;

    if (!testMappingIds || !Array.isArray(testMappingIds) || testMappingIds.length === 0) {
      return NextResponse.json(
        { success: false, message: "Veuillez sélectionner au moins un test" },
        { status: 400 }
      );
    }

    const results = await getComparisonDetails(testMappingIds);
    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    console.error("[POST /api/comparison]", error);
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
