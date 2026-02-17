import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { parseExcelFile, parsePdfFile } from "@/lib/services/file-parser.service";
import logger from "@/lib/logger";

const HEADERS = ["Nom", "Code", "Prix", "Catégorie", "Unité"] as const;

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Non autorisé" }, { status: 401 });
    }

    const { id: laboratoryId } = await params;
    if (!laboratoryId) {
      return NextResponse.json({ success: false, message: "Laboratoire requis" }, { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ success: false, message: "Fichier requis" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = file.name.toLowerCase();
    const isPdf = fileName.endsWith(".pdf");
    const tests = isPdf ? await parsePdfFile(buffer) : await parseExcelFile(buffer);

    const rows: string[][] = tests.map((t) => [
      t.name ?? "",
      t.code ?? "",
      String(t.price),
      t.category ?? "",
      t.unit ?? "",
    ]);

    return NextResponse.json({
      success: true,
      data: {
        headers: [...HEADERS],
        rows,
        totalRows: tests.length,
      },
    });
  } catch (error) {
    logger.error({ err: error }, "[POST /api/laboratories/:id/price-lists/preview]");
    const message = error instanceof Error ? error.message : "Erreur lors de l'aperçu du fichier";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
