import { NextRequest, NextResponse } from "next/server";
import { getBundleComponentReport } from "@/lib/services/bundle-matching.service";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const report = await getBundleComponentReport(id);
  if (!report) {
    return NextResponse.json({ error: "Bundle not found" }, { status: 404 });
  }
  return NextResponse.json(report);
}
