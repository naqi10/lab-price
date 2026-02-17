import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCustomerById, updateCustomer, deleteCustomer } from "@/lib/services/customer.service";
import { customerSchema } from "@/lib/validations/customer";
import logger from "@/lib/logger";
import { logAudit } from "@/lib/services/audit.service";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ success: false, message: "Non autorisé" }, { status: 401 });

    const { id } = await params;
    const customer = await getCustomerById(id);
    if (!customer) return NextResponse.json({ success: false, message: "Client non trouvé" }, { status: 404 });

    return NextResponse.json({ success: true, data: customer });
  } catch (error) {
    logger.error({ err: error }, "[GET /api/customers/:id]");
    return NextResponse.json({ success: false, message: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ success: false, message: "Non autorisé" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const validated = customerSchema.parse(body);
    const customer = await updateCustomer(id, validated);

    logAudit({ userId: session.user!.id!, action: "UPDATE", entity: "customer", entityId: id, details: validated });

    return NextResponse.json({ success: true, data: customer });
  } catch (error) {
    logger.error({ err: error }, "[PUT /api/customers/:id]");
    const message = error instanceof Error ? error.message : "Erreur lors de la mise à jour";
    const status = message.includes("existe déjà") ? 409 : 500;
    return NextResponse.json({ success: false, message }, { status });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ success: false, message: "Non autorisé" }, { status: 401 });

    const { id } = await params;
    await deleteCustomer(id);

    logAudit({ userId: session.user!.id!, action: "DELETE", entity: "customer", entityId: id });

    return NextResponse.json({ success: true, message: "Client supprimé" });
  } catch (error) {
    logger.error({ err: error }, "[DELETE /api/customers/:id]");
    return NextResponse.json({ success: false, message: "Erreur lors de la suppression" }, { status: 500 });
  }
}
