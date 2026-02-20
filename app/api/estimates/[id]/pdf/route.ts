import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import logger from "@/lib/logger";
import { generateComparisonPdf } from "@/lib/services/pdf.service";
import type { ComparisonEmailResult } from "@/lib/services/comparison.service";

/**
 * Regenerate PDF from a saved estimate
 * GET /api/estimates/[id]/pdf
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json(
        { success: false, message: "Non autorisé" },
        { status: 401 }
      );

    const { id } = await params;

    const estimate = await prisma.estimate.findUnique({
      where: { id },
      include: {
        customer: true,
      },
    });

    if (!estimate)
      return NextResponse.json(
        { success: false, message: "Estimation non trouvée" },
        { status: 404 }
      );

    // Check authorization
    if (estimate.createdById !== session.user.id)
      return NextResponse.json(
        { success: false, message: "Non autorisé" },
        { status: 403 }
      );

    // Reconstruct the comparison result from saved data
    const testMappingIds = estimate.testMappingIds as string[];
    const selections = estimate.selections as Record<string, string> | null;

    // customPrices is stored as a JSON string in a Json field (double-serialized)
    let customPrices: Record<string, number> = {};
    if (estimate.customPrices) {
      const raw = estimate.customPrices;
      customPrices = typeof raw === "string" ? JSON.parse(raw) : (raw as Record<string, number>);
    }

    // Fetch test mappings and lab entries to reconstruct PDF data
    const testMappings = await prisma.testMapping.findMany({
      where: { id: { in: testMappingIds } },
    });

    const testMappingEntries = await prisma.testMappingEntry.findMany({
      where: {
        testMappingId: { in: testMappingIds },
      },
      include: {
        laboratory: true,
      },
    });

    // Organize data by test
    const testsByMapping: Record<string, (typeof testMappingEntries)> = {};
    testMappingIds.forEach((id) => {
      testsByMapping[id] = testMappingEntries.filter(
        (e) => e.testMappingId === id
      );
    });

    // Build labs list
    const labIds = [...new Set(testMappingEntries.map((e) => e.laboratoryId))];
    const labs = await prisma.laboratory.findMany({
      where: { id: { in: labIds } },
    });

    // Build laboratories array with tests
    const laboratoriesData = labs.map((lab) => {
      const tests = testMappingIds
        .map((testId) => {
          const entry = testsByMapping[testId]?.find(
            (e) => e.laboratoryId === lab.id
          );
          if (!entry) return null;
          const customPrice =
            customPrices[`${testId}-${lab.id}`] ?? entry.price ?? 0;
          const testMapping = testMappings.find((t) => t.id === testId);
          return {
            canonicalName: testMapping?.canonicalName || "",
            localTestName: entry.localTestName,
            price: customPrice,
            formattedPrice: new Intl.NumberFormat("fr-MA", {
              style: "currency",
              currency: "MAD",
            }).format(customPrice),
            turnaroundTime: null as string | null,
          };
        })
        .filter(Boolean) as any[];

      const totalPrice = tests.reduce((sum, t) => sum + t.price, 0);

      return {
        id: lab.id,
        name: lab.name,
        code: lab.code,
        tests,
        totalPrice,
        formattedTotalPrice: new Intl.NumberFormat("fr-MA", {
          style: "currency",
          currency: "MAD",
        }).format(totalPrice),
        isCheapest: false,
      };
    });

    // Find cheapest lab
    let cheapestLab = laboratoriesData[0];
    for (const lab of laboratoriesData) {
      if (lab.totalPrice < cheapestLab.totalPrice) {
        cheapestLab = lab;
      }
    }
    cheapestLab.isCheapest = true;

    // Build comparison result
    const result: ComparisonEmailResult = {
      testNames: testMappings.map((t) => t.canonicalName),
      laboratories: laboratoriesData,
      cheapestLaboratory: {
        id: cheapestLab.id,
        name: cheapestLab.name,
        code: cheapestLab.code,
        totalPrice: cheapestLab.totalPrice,
        formattedTotalPrice: cheapestLab.formattedTotalPrice,
      },
    };

    // Add multi-lab selection if present
    if (selections && Object.keys(selections).length > 0) {
      const assignments = testMappingIds
        .map((testId) => {
          const selectedLabId = selections[testId];
          if (!selectedLabId) return null;
          const entry = testMappingEntries.find(
            (e) => e.testMappingId === testId && e.laboratoryId === selectedLabId
          );
          if (!entry) return null;
          const customPrice =
            customPrices[`${testId}-${selectedLabId}`] ?? entry.price ?? 0;
          const testMapping = testMappings.find((t) => t.id === testId);
          return {
            canonicalName: testMapping?.canonicalName || "",
            laboratoryName: entry.laboratory.name,
            formattedPrice: new Intl.NumberFormat("fr-MA", {
              style: "currency",
              currency: "MAD",
            }).format(customPrice),
            turnaroundTime: null as string | null,
          };
        })
        .filter(Boolean) as any[];

      if (assignments.length > 0) {
        const selectedLabIds = [...new Set(Object.values(selections))];
        result.multiLabSelection = {
          assignments,
          totalPrice: estimate.totalPrice,
          formattedTotalPrice: new Intl.NumberFormat("fr-MA", {
            style: "currency",
            currency: "MAD",
          }).format(estimate.totalPrice),
          laboratories: labs
            .filter((l) => selectedLabIds.includes(l.id))
            .map((l) => ({ id: l.id, name: l.name, code: l.code })),
        };
      }
    }

     // Generate PDF
     const pdfBuffer = await generateComparisonPdf(
       result,
       estimate.customer?.name || undefined,
       estimate.selectionMode || undefined
     );

    // Return PDF as file download
    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="estimation-${estimate.estimateNumber}.pdf"`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    logger.error({ err: error }, "[GET /api/estimates/[id]/pdf]");
    return NextResponse.json(
      { success: false, message: "Erreur lors de la génération du PDF" },
      { status: 500 }
    );
  }
}
