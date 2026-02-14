import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getTestMappings, createTestMapping } from "@/lib/services/test-matching.service";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ success: false, message: "Non autorisé" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || undefined;
    const category = searchParams.get("category") || undefined;

    const mappings = await getTestMappings({ search, category });
    return NextResponse.json({ success: true, data: mappings });
  } catch (error) {
    console.error("[GET /api/tests/mappings]", error);
    return NextResponse.json({ success: false, message: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ success: false, message: "Non autorisé" }, { status: 401 });

    const body = await request.json();

    if (!body.canonicalName) {
      return NextResponse.json({ success: false, message: "Le nom canonique est requis" }, { status: 400 });
    }

    const mapping = await createTestMapping({
      canonicalName: body.canonicalName,
      category: body.category || null,
      description: body.description || null,
      entries: (body.entries || []).map((e: any) => ({
        laboratoryId: e.laboratoryId,
        localTestName: e.testName || e.localTestName,
        matchType: "MANUAL" as const,
        similarity: 1.0,
      })),
    });

    return NextResponse.json({ success: true, data: mapping }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/tests/mappings]", error);
    const message = error instanceof Error ? error.message : "Erreur lors de la création";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
