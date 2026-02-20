import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { buildComparisonResult } from "@/lib/services/comparison.service";
import { generateComparisonPdf } from "@/lib/services/pdf.service";
import logger from "@/lib/logger";

/**
 * POST /api/comparison/generate-pdf
 *
 * Compare selected tests and generate a downloadable PDF with custom prices.
 * Does NOT send email, just returns the PDF for download.
 *
 * Body: { 
 *   testMappingIds: string[], 
 *   clientName?: string,
 *   selections?: Record<string, string>,  // per-test lab selections
 *   customPrices?: Record<string, number>  // custom prices (key format: "${testId}-${labId}")
 * }
 *
 * Returns: PDF binary with Content-Disposition header for download
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Non autorisé" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { testMappingIds, clientName, selections, customPrices } = body;

    // ── Validation ─────────────────────────────────────────────────────────
    if (!testMappingIds || !Array.isArray(testMappingIds) || testMappingIds.length === 0) {
      return NextResponse.json(
        { success: false, message: "Au moins un test doit être sélectionné" },
        { status: 400 }
      );
    }

    // ── Generate comparison data with custom prices ──────────────────────────
    const result = await buildComparisonResult({
      testMappingIds,
      selections: selections || undefined,
      customPrices: customPrices || undefined,
    });

    // ── Generate PDF ───────────────────────────────────────────────────────
    const pdfBuffer = await generateComparisonPdf(result, clientName);

    // ── Generate filename ──────────────────────────────────────────────────
    const timestamp = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const testNames = result.testNames.join("_").replace(/\s+/g, "-").substring(0, 40);
    const filename = `Comparaison_${testNames}_${timestamp}.pdf`;

    // ── Return PDF as download ─────────────────────────────────────────────
    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": pdfBuffer.length.toString(),
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    logger.error({ err: error }, "[POST /api/comparison/generate-pdf]");
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
