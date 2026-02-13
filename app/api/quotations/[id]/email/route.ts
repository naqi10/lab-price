import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getQuotationById, updateQuotationStatus } from "@/lib/services/quotation.service";
import { sendQuotationEmail } from "@/lib/services/email.service";
import { emailSchema } from "@/lib/validations/quotation";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ success: false, message: "Non autorisé" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const validated = emailSchema.parse(body);

    const quotation = await getQuotationById(id);
    if (!quotation) return NextResponse.json({ success: false, message: "Devis non trouvé" }, { status: 404 });

    await sendQuotationEmail(quotation, validated);
    await updateQuotationStatus(id, "SENT");

    return NextResponse.json({ success: true, message: "Email envoyé avec succès" });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Erreur lors de l'envoi de l'email" }, { status: 500 });
  }
}
