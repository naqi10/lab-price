import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getProfileComponents } from "@/lib/data/profile-descriptions";

export interface ProfileMatchResult {
  id: string;
  dealName: string;
  description: string;
  category: string;
  icon: string;
  profilePrice: number; // customRate
  sourceLabCode?: string | null;
  profileCode?: string | null;
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
  extraIncludedCount: number;
  savingsAmount: number;
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

    type BundleRow = {
      id: string;
      dealName: string;
      description: string;
      category: string;
      icon: string;
      customRate: number;
      testMappingIds: string[];
      sourceLabCode: string | null;
      profileCode: string | null;
    };

    // Prisma-native array containment match (avoids raw SQL failures / P2010).
    const matchingBundles: BundleRow[] = await prisma.bundleDeal.findMany({
      where: {
        isActive: true,
        testMappingIds: { hasEvery: testMappingIds },
      },
      select: {
        id: true,
        dealName: true,
        description: true,
        category: true,
        icon: true,
        customRate: true,
        testMappingIds: true,
        sourceLabCode: true,
        profileCode: true,
      },
      orderBy: { customRate: "asc" },
    });

    // Recovery path for profiles seeded with empty test_mapping_ids:
    // resolve profile components from profileCode -> component test codes -> mapping IDs.
    const emptyBundles = await prisma.bundleDeal.findMany({
      where: {
        isActive: true,
        profileCode: { not: null },
        testMappingIds: { equals: [] },
      },
      select: {
        id: true,
        dealName: true,
        description: true,
        category: true,
        icon: true,
        customRate: true,
        sourceLabCode: true,
        profileCode: true,
      },
    });

    if (emptyBundles.length > 0) {
      const mappingCodes = await prisma.testMapping.findMany({
        where: { code: { not: null } },
        select: { id: true, code: true },
      });
      const testsWithMapping = await prisma.test.findMany({
        where: {
          priceList: { isActive: true },
          code: { not: null },
          testMappingEntryId: { not: null },
        },
        select: {
          code: true,
          testMappingEntry: { select: { testMappingId: true } },
        },
      });

      const codeToMapping = new Map<string, string>();
      for (const mapping of mappingCodes) {
        if (!mapping.code) continue;
        const key = mapping.code.toUpperCase();
        if (!codeToMapping.has(key)) {
          codeToMapping.set(key, mapping.id);
        }
      }
      for (const test of testsWithMapping) {
        if (!test.code || !test.testMappingEntry?.testMappingId) continue;
        const key = test.code.toUpperCase();
        if (!codeToMapping.has(key)) {
          codeToMapping.set(key, test.testMappingEntry.testMappingId);
        }
      }

      const selectedSet = new Set(testMappingIds);
      const existingBundleIds = new Set(matchingBundles.map((b) => b.id));

      for (const bundle of emptyBundles) {
        const componentCodes = getProfileComponents(bundle.profileCode);
        if (componentCodes.length === 0) continue;

        const resolvedIds = Array.from(
          new Set(
            componentCodes
              .map((code) => codeToMapping.get(code.toUpperCase()))
              .filter((id): id is string => Boolean(id))
          )
        );

        if (resolvedIds.length === 0) continue;
        if (existingBundleIds.has(bundle.id)) continue;

        const resolvedSet = new Set(resolvedIds);
        const coversAllSelected = testMappingIds.every((id) => selectedSet.has(id) && resolvedSet.has(id));
        if (!coversAllSelected) continue;

        matchingBundles.push({
          id: bundle.id,
          dealName: bundle.dealName,
          description: bundle.description ?? "",
          category: bundle.category ?? "Profil",
          icon: bundle.icon ?? "🧪",
          customRate: Number(bundle.customRate ?? 0),
          testMappingIds: resolvedIds,
          sourceLabCode: bundle.sourceLabCode,
          profileCode: bundle.profileCode,
        });
        existingBundleIds.add(bundle.id);
      }
    }

    if (matchingBundles.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    // Collect all unique testMappingIds across matched bundles for batch lookup
    const allIds = new Set<string>();
    for (const b of matchingBundles) {
      for (const id of b.testMappingIds ?? []) allIds.add(id);
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
      const components = (b.testMappingIds ?? []).map((id) => {
        const c = canonicalMap.get(id);
        if (!c) return null;
        const cdlEntry = c.entries.find((e) => e.laboratory.code === "CDL");
        const dynEntry = c.entries.find((e) => e.laboratory.code === "DYNACARE");
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

      const profilePrice = Number(b.customRate) || 0;
      const extraIncludedCount = Math.max(
        0,
        (b.testMappingIds?.length ?? 0) - testMappingIds.length
      );
      const savingsAmount = Math.max(0, selectedIndividualSum - profilePrice);
      const isRecommended = profilePrice > 0 && profilePrice < selectedIndividualSum;

      return {
        id: b.id,
        dealName: b.dealName,
        description: b.description,
        category: b.category,
        icon: b.icon,
        profilePrice,
        sourceLabCode: b.sourceLabCode,
        profileCode: b.profileCode,
        testMappingIds: b.testMappingIds ?? [],
        components,
        selectedIndividualSum,
        extraIncludedCount,
        savingsAmount,
        isRecommended,
      };
    });

    results.sort((a, b) => {
      if (a.isRecommended !== b.isRecommended) return a.isRecommended ? -1 : 1;
      if (a.savingsAmount !== b.savingsAmount) return b.savingsAmount - a.savingsAmount;
      if (a.extraIncludedCount !== b.extraIncludedCount) return b.extraIncludedCount - a.extraIncludedCount;
      return a.profilePrice - b.profilePrice;
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
