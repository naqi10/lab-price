import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export interface ProfileMatchResult {
  id: string;
  dealName: string;
  description: string;
  category: string;
  icon: string;
  profilePrice: number; // customRate
  testMappingIds: string[];
  // Enriched per-test detail
  components: {
    testMappingId: string;
    canonicalName: string;
    cdlPrice: number | null;
    dynaPrice: number | null;
  }[];
  // Sum of individual chosen prices for the user's selected tests that are in this profile
  selectedIndividualSum: number;
  isRecommended: boolean; // profilePrice < selectedIndividualSum
}

/**
 * POST /api/tests/profile-match
 * Body: { testMappingIds: string[], labPref?: "CDL"|"DYNACARE"|null }
 *
 * Returns bundle_deals where ALL of the submitted testMappingIds are contained
 * in the bundle's testMappingIds array (selected ⊆ profile).
 *
 * Uses PostgreSQL array containment: test_mapping_ids @> ARRAY[...]::uuid[]
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { testMappingIds, selectedPrices } = body as {
      testMappingIds: string[];
      // price per testMappingId as chosen by the user (for savings comparison)
      selectedPrices: Record<string, number>;
    };

    if (!testMappingIds || testMappingIds.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    // Use PostgreSQL @> (contains) operator for efficient array matching
    // This returns profiles where the profile's testMappingIds array contains ALL selected IDs
    const matchingBundles = await prisma.$queryRawUnsafe<
      Array<{
        id: string;
        deal_name: string;
        description: string;
        category: string;
        icon: string;
        custom_rate: number;
        test_mapping_ids: string[];
      }>
    >(
      `SELECT id, deal_name, description, category, icon, custom_rate, test_mapping_ids
       FROM bundle_deals
       WHERE is_active = true
         AND test_mapping_ids @> $1::uuid[]
       ORDER BY custom_rate ASC`,
      testMappingIds
    );

    if (matchingBundles.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    // Collect all unique testMappingIds across matched bundles for batch lookup
    const allIds = new Set<string>();
    for (const b of matchingBundles) {
      for (const id of b.test_mapping_ids ?? []) allIds.add(id);
    }

    // Batch fetch all canonical names + lab prices
    const canonicals = await prisma.testMapping.findMany({
      where: { id: { in: [...allIds] } },
      include: {
        entries: {
          include: { laboratory: true },
        },
      },
    });
    const canonicalMap = new Map(canonicals.map((c) => [c.id, c]));

    const results: ProfileMatchResult[] = matchingBundles.map((b) => {
      const components = (b.test_mapping_ids ?? []).map((id) => {
        const c = canonicalMap.get(id);
        if (!c) return null;
        const cdlEntry = c.entries.find(
          (e: any) => e.laboratory.code === "CDL"
        );
        const dynEntry = c.entries.find(
          (e: any) => e.laboratory.code === "DYNACARE"
        );
        return {
          testMappingId: id,
          canonicalName: c.canonicalName,
          cdlPrice: cdlEntry?.price ?? null,
          dynaPrice: dynEntry?.price ?? null,
        };
      }).filter(Boolean) as ProfileMatchResult["components"];

      // Sum of user's individually chosen prices for the tests in this profile
      // Only count tests that were actually selected by the user
      const selectedIndividualSum = testMappingIds.reduce(
        (sum, id) => sum + (selectedPrices[id] ?? 0),
        0
      );

      const profilePrice = Number(b.custom_rate) || 0;
      const isRecommended = profilePrice > 0 && profilePrice < selectedIndividualSum;

      return {
        id: b.id,
        dealName: b.deal_name,
        description: b.description,
        category: b.category,
        icon: b.icon,
        profilePrice,
        testMappingIds: b.test_mapping_ids ?? [],
        components,
        selectedIndividualSum,
        isRecommended,
      };
    });

    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    console.error("[profile-match]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
