import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getBundleDeals, createBundleDeal } from "@/lib/services/bundle-deal.service";
import logger from "@/lib/logger";
import { logAudit } from "@/lib/services/audit.service";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ success: false, message: "Non autorisé" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || undefined;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));

    const { deals, total } = await getBundleDeals({ search, page, limit });
    const pages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: {
        deals,
        pagination: { page, limit, total, pages },
      },
    });
  } catch (error) {
    logger.error({ err: error }, "[GET /api/tests/deals]");
    return NextResponse.json({ success: false, message: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ success: false, message: "Non autorisé" }, { status: 401 });

    const body = await request.json();

    if (!body.dealName || !body.category || body.customRate == null) {
      return NextResponse.json({ success: false, message: "Nom, catégorie et tarif sont requis" }, { status: 400 });
    }

    const deal = await createBundleDeal({
      dealName: body.dealName,
      description: body.description || "",
      category: body.category,
      icon: body.icon || "",
      customRate: Number(body.customRate),
      popular: body.popular ?? false,
      testMappingIds: body.testMappingIds || [],
      isActive: body.isActive ?? true,
      sortOrder: body.sortOrder ?? 0,
    });

    logAudit({ userId: session.user.id, action: "CREATE", entity: "bundle_deal", entityId: deal.id, details: { dealName: body.dealName } });

    return NextResponse.json({ success: true, data: deal }, { status: 201 });
  } catch (error) {
    logger.error({ err: error }, "[POST /api/tests/deals]");
    const message = error instanceof Error ? error.message : "Erreur lors de la création";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
