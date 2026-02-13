import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getQuotations, createQuotation } from "@/lib/services/quotation.service";
import { quotationSchema } from "@/lib/validations/quotation";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ success: false, message: "Non autorisé" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || undefined;

    const quotations = await getQuotations({ page, pageSize: limit, search });
    return NextResponse.json({ success: true, data: quotations });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ success: false, message: "Non autorisé" }, { status: 401 });

    const body = await request.json();
    const validated = quotationSchema.parse(body);
    const quotation = await createQuotation({ ...validated, createdById: session.user.id });

    return NextResponse.json({ success: true, data: quotation }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Erreur lors de la création" }, { status: 500 });
  }
}
