import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { updateBundleDeal, deleteBundleDeal } from "@/lib/services/bundle-deal.service";
import logger from "@/lib/logger";
import { logAudit } from "@/lib/services/audit.service";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ success: false, message: "Non autorisé" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();

    const deal = await updateBundleDeal(id, {
      dealName: body.dealName,
      description: body.description,
      category: body.category,
      icon: body.icon,
      customRate: body.customRate != null ? Number(body.customRate) : undefined,
      popular: body.popular,
      testMappingIds: body.testMappingIds,
      isActive: body.isActive,
      sortOrder: body.sortOrder,
    });

    logAudit({ userId: session.user.id, action: "UPDATE", entity: "bundle_deal", entityId: id, details: { dealName: body.dealName } });

    return NextResponse.json({ success: true, data: deal });
  } catch (error) {
    logger.error({ err: error }, "[PUT /api/tests/deals/:id]");
    const message = error instanceof Error ? error.message : "Erreur lors de la mise à jour";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ success: false, message: "Non autorisé" }, { status: 401 });

    const { id } = await params;
    await deleteBundleDeal(id);

    logAudit({ userId: session.user.id, action: "DELETE", entity: "bundle_deal", entityId: id });

    return NextResponse.json({ success: true, message: "Offre supprimée" });
  } catch (error) {
    logger.error({ err: error }, "[DELETE /api/tests/deals/:id]");
    return NextResponse.json({ success: false, message: "Erreur lors de la suppression" }, { status: 500 });
  }
}
