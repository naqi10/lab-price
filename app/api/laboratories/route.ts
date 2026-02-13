import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getLaboratories, createLaboratory } from "@/lib/services/laboratory.service";
import { laboratorySchema } from "@/lib/validations/laboratory";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ success: false, message: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || undefined;
    const laboratories = await getLaboratories({ search });

    return NextResponse.json({ success: true, data: laboratories });
  } catch (error) {
    console.error("[GET /api/laboratories]", error);
    return NextResponse.json({ success: false, message: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ success: false, message: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const validated = laboratorySchema.parse(body);
    const laboratory = await createLaboratory(validated);

    return NextResponse.json({ success: true, data: laboratory }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/laboratories]", error);
    const message = error instanceof Error ? error.message : "Erreur lors de la création";
    const status = message.includes("existe déjà") ? 409 : 500;
    return NextResponse.json({ success: false, message }, { status });
  }
}
