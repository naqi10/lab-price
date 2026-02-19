import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getQuotationById } from "@/lib/services/quotation.service";
import { generateQuotationPdf } from "@/lib/services/pdf.service";
import logger from "@/lib/logger";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ success: false, message: "Non autorisé" }, { status: 401 });

    const { id } = await params;
    const quotation = await getQuotationById(id);
    if (!quotation) return NextResponse.json({ success: false, message: "Devis non trouvé" }, { status: 404 });

    const pdfBuffer = await generateQuotationPdf(quotation);
    const dateStr = new Date().toISOString().split("T")[0];
    const inline = request.nextUrl.searchParams.get("inline") === "true";
    const filename = `Devis_${quotation.quotationNumber}_${dateStr}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": inline
          ? `inline; filename="${filename}"`
          : `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    logger.error({ err: error }, "[GET /api/quotations/:id/pdf]");
    return NextResponse.json({ success: false, message: "Erreur lors de la génération du PDF" }, { status: 500 });
  }
}
