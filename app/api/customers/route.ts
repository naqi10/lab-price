import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCustomers, createCustomer } from "@/lib/services/customer.service";
import { customerSchema } from "@/lib/validations/customer";
import logger from "@/lib/logger";
import { logAudit } from "@/lib/services/audit.service";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ success: false, message: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || undefined;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));

    const { customers, total } = await getCustomers({ search, page, limit });
    const pages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: {
        customers,
        pagination: { page, limit, total, pages },
      },
    });
  } catch (error) {
    logger.error({ err: error }, "[GET /api/customers]");
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
    const validated = customerSchema.parse(body);
    const customer = await createCustomer(validated);

    logAudit({ userId: session.user!.id!, action: "CREATE", entity: "customer", entityId: customer.id, details: { name: customer.name, email: customer.email } });

    return NextResponse.json({ success: true, data: customer }, { status: 201 });
  } catch (error) {
    logger.error({ err: error }, "[POST /api/customers]");
    const message = error instanceof Error ? error.message : "Erreur lors de la création";
    const status = message.includes("existe déjà") ? 409 : 500;
    return NextResponse.json({ success: false, message }, { status });
  }
}
