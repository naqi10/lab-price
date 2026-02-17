import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { updateQuotationStatus } from "@/lib/services/quotation.service";
import { sendQuotationEmail } from "@/lib/services/email.service";
import { emailSchema } from "@/lib/validations/quotation";
import logger from "@/lib/logger";
import { logAudit } from "@/lib/services/audit.service";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ success: false, message: "Non autorisé" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const validated = emailSchema.parse(body);

    await sendQuotationEmail({
      quotationId: id,
      to: validated.to[0],
      subject: validated.subject,
      message: validated.message || undefined,
      sentById: session.user.id,
    });

    await updateQuotationStatus(id, "SENT");

    logAudit({ userId: session.user.id, action: "UPDATE", entity: "quotation", entityId: id, details: { status: "SENT", toEmail: validated.to[0] } });

    return NextResponse.json({ success: true, message: "Email envoyé avec succès" });
  } catch (error) {
    logger.error({ err: error }, "[POST /api/quotations/:id/email]");
    const message = error instanceof Error ? error.message : "Erreur lors de l'envoi de l'email";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
