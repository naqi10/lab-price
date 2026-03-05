import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getActiveBundleDeals } from "@/lib/services/bundle-deal.service";
import { getProfileMeta } from "@/lib/data/profile-metadata";
import prisma from "@/lib/db";
import logger from "@/lib/logger";

export async function GET() {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ success: false, message: "Non autorisé" }, { status: 401 });

    const deals = await getActiveBundleDeals();

    // Batch-resolve all testMappingIds → canonical names in a single query
    const allIds = [...new Set(deals.flatMap((d) => d.testMappingIds))];
    const mappings = allIds.length > 0
      ? await prisma.testMapping.findMany({
          where: { id: { in: allIds } },
          select: { id: true, canonicalName: true },
        })
      : [];

    const idToName = new Map(mappings.map((m) => [m.id, m.canonicalName]));

    const enriched = deals.map((deal) => {
      const canonicalNames = deal.testMappingIds
        .map((id) => idToName.get(id))
        .filter((n): n is string => !!n);

      // Enrich with profile metadata (tube type, turnaround, notes)
      const meta = getProfileMeta(deal.profileCode);

      return {
        ...deal,
        canonicalNames,
        profileTube: meta?.tube ?? null,
        profileTurnaround: meta?.turnaroundDays ?? null,
        profileNotes: meta?.notes ?? null,
      };
    });

    return NextResponse.json({ success: true, data: enriched });
  } catch (error) {
    logger.error({ err: error }, "[GET /api/tests/deals/active]");
    return NextResponse.json({ success: false, message: "Erreur serveur" }, { status: 500 });
  }
}
