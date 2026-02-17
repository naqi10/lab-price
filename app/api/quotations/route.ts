import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getQuotations, createQuotation } from "@/lib/services/quotation.service";
import { quotationSchema } from "@/lib/validations/quotation";
import logger from "@/lib/logger";
import { logAudit } from "@/lib/services/audit.service";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ success: false, message: "Non autorisé" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || undefined;
    const dateFrom = searchParams.get("dateFrom") || undefined;
    const dateTo = searchParams.get("dateTo") || undefined;

    const quotations = await getQuotations({ page, pageSize: limit, search, dateFrom, dateTo });
    return NextResponse.json({ success: true, data: quotations });
  } catch (error) {
    logger.error({ err: error }, "[GET /api/quotations]");
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

    logAudit({ userId: session.user.id, action: "CREATE", entity: "quotation", entityId: quotation.id, details: { title: quotation.title, quotationNumber: quotation.quotationNumber } });

    return NextResponse.json({ success: true, data: quotation }, { status: 201 });
  } catch (error) {
    logger.error({ err: error }, "[POST /api/quotations]");
    const message = error instanceof Error ? error.message : "Erreur lors de la création";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
