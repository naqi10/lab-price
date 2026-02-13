import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPriceLists, uploadPriceList } from "@/lib/services/price-list.service";
import { parseExcelFile, parsePdfFile } from "@/lib/services/file-parser.service";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ success: false, message: "Non autorisé" }, { status: 401 });

    const { id } = await params;
    const priceLists = await getPriceLists(id);

    return NextResponse.json({ success: true, data: priceLists });
  } catch (error) {
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
    const notes = formData.get("notes") as string | null;

    if (!file) return NextResponse.json({ success: false, message: "Fichier requis" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = file.name;
    const fileType = fileName.endsWith(".pdf") ? "PDF" : fileName.endsWith(".xls") && !fileName.endsWith(".xlsx") ? "XLS" : "XLSX";

    let tests;
    if (fileType === "PDF") {
      tests = await parsePdfFile(buffer);
    } else {
      tests = await parseExcelFile(buffer);
    }

    const priceList = await uploadPriceList({
      laboratoryId: id,
      fileName,
      originalFileName: fileName,
      fileType,
      uploadedById: session.user.id,
      notes: notes || undefined,
      tests,
    });

    return NextResponse.json({ success: true, data: priceList }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Erreur lors du téléchargement" }, { status: 500 });
  }
}
