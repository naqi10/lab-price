import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getQuotationById } from "@/lib/services/quotation.service";
import { generateQuotationPdf } from "@/lib/services/pdf.service";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ success: false, message: "Non autorisé" }, { status: 401 });

    const { id } = await params;
    const quotation = await getQuotationById(id);
    if (!quotation) return NextResponse.json({ success: false, message: "Devis non trouvé" }, { status: 404 });

    const pdfBuffer = await generateQuotationPdf(quotation);

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="devis-${quotation.quotationNumber}.pdf"`,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Erreur lors de la génération du PDF" }, { status: 500 });
  }
}
