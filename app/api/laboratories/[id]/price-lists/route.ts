import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPriceLists, uploadPriceList } from "@/lib/services/price-list.service";
import { parseExcelFile, parsePdfFile } from "@/lib/services/file-parser.service";
import logger from "@/lib/logger";
import { logAudit } from "@/lib/services/audit.service";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ success: false, message: "Non autorisé" }, { status: 401 });

    const { id } = await params;
    const priceLists = await getPriceLists({ laboratoryId: id });

    return NextResponse.json({ success: true, data: priceLists });
  } catch (error) {
    logger.error({ err: error }, "[GET /api/laboratories/:id/price-lists]");
    return NextResponse.json({ success: false, message: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ success: false, message: "Non autorisé" }, { status: 401 });

    const { id } = await params;
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) return NextResponse.json({ success: false, message: "Fichier requis" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = file.name;
    const fileType = fileName.toLowerCase().endsWith(".pdf") ? "PDF" as const : "EXCEL" as const;

    let tests;
    if (fileType === "PDF") {
      tests = await parsePdfFile(buffer);
    } else {
      tests = await parseExcelFile(buffer);
    }

    const priceList = await uploadPriceList({
      laboratoryId: id,
      fileName,
      fileType,
      fileSize: buffer.length,
      setAsActive: true,
      tests,
      uploadedById: session.user.id,
    });

    logAudit({ userId: session.user.id, action: "CREATE", entity: "price_list", entityId: priceList.id, details: { laboratoryId: id, fileName, fileType } });

    return NextResponse.json({ success: true, data: priceList }, { status: 201 });
  } catch (error) {
    logger.error({ err: error }, "[POST /api/laboratories/:id/price-lists]");
    const message = error instanceof Error ? error.message : "Erreur lors du téléchargement";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
