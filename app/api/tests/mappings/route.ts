import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getTestMappings, createTestMapping } from "@/lib/services/test-matching.service";
import { testMappingSchema } from "@/lib/validations/test";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ success: false, message: "Non autorisé" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const mappings = await getTestMappings(page, limit);
    return NextResponse.json({ success: true, data: mappings });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ success: false, message: "Non autorisé" }, { status: 401 });

    const body = await request.json();
    const validated = testMappingSchema.parse(body);
    const mapping = await createTestMapping({ ...validated, createdById: session.user.id });

    return NextResponse.json({ success: true, data: mapping }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Erreur lors de la création" }, { status: 500 });
  }
}
