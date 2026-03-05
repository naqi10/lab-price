import { NextResponse } from "next/server";
import { compareBundlesAcrossLabs } from "@/lib/services/cross-lab-bundle.service";

export async function GET() {
  const report = await compareBundlesAcrossLabs();
  return NextResponse.json(report);
}
