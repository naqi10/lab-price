import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import ExcelJS from "exceljs";
import logger from "@/lib/logger";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; listId: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Non autorisé" },
        { status: 401 }
      );
    }

    const { listId } = await params;

    const priceList = await prisma.priceList.findUnique({
      where: { id: listId },
      include: {
        laboratory: { select: { name: true, code: true } },
        tests: { orderBy: { name: "asc" } },
      },
    });

    if (!priceList) {
      return NextResponse.json(
        { success: false, message: "Liste de prix non trouvée" },
        { status: 404 }
      );
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Lab Price Comparator";
    workbook.created = new Date();

    const sheetName = priceList.laboratory.name.substring(0, 31);
    const worksheet = workbook.addWorksheet(sheetName);

    worksheet.columns = [
      { header: "Nom", key: "name", width: 40 },
      { header: "Code", key: "code", width: 15 },
      { header: "Prix", key: "price", width: 12 },
      { header: "Unité", key: "unit", width: 12 },
      { header: "Catégorie", key: "category", width: 20 },
      { header: "Délai", key: "turnaroundTime", width: 15 },
      { header: "Tube / Échantillon", key: "tubeType", width: 25 },
      { header: "Statut", key: "status", width: 12 },
    ];

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE2E8F0" },
    };

    for (const test of priceList.tests) {
      worksheet.addRow({
        name: test.name,
        code: test.code || "",
        price: test.price,
        unit: test.unit || "",
        category: test.category || "",
        turnaroundTime: test.turnaroundTime || "",
        tubeType: test.tubeType || "",
        status: test.isActive ? "Actif" : "Inactif",
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const safeName = priceList.laboratory.code.replace(/[^a-zA-Z0-9-_]/g, "_");
    const fileName = `${safeName}_prix.xlsx`;

    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    logger.error({ err: error }, "[GET /api/laboratories/:id/price-lists/:listId/export]");
    return NextResponse.json(
      { success: false, message: "Erreur lors de l'exportation" },
      { status: 500 }
    );
  }
}
