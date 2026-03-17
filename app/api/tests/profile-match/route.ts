import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import {
  CDL_PROFILE_COMPONENTS,
  QC_PROFILE_COMPONENTS,
  getProfileComponents,
} from "@/lib/data/profile-descriptions";

export interface ProfileMatchResult {
  id: string;
  dealName: string;
  description: string;
  category: string;
  icon: string;
  profilePrice: number; // customRate
  sourceLabCode?: string | null;
  normalizedSourceLabCode?: "CDL" | "DYNACARE" | null;
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
  matchedSelectedCount: number;
  profileTestCount: number;
  extraIncludedCount: number;
  savingsAmount: number;
  isRecommended: boolean; // profilePrice < selectedIndividualSum
}

/**
 * POST /api/tests/profile-match
 * Body: {
 *   testMappingIds: string[],
 *   profileHints?: string[],
 *   labPref?: "CDL"|"DYNACARE"|null
 * }
 *
 * Returns bundle_deals where ALL of the submitted testMappingIds are contained
 * in the bundle's testMappingIds array (selected ⊆ profile).
 *
 * Uses PostgreSQL array containment: test_mapping_ids @> ARRAY[...]::uuid[]
 */
export async function POST(req: NextRequest) {
  try {
    const resolveProfileComponentCodes = (
      profileCode: string | null,
      sourceLabCode: string | null
    ): string[] => {
      if (!profileCode) return [];
      const key = profileCode.toUpperCase();
      const lab = sourceLabCode?.toUpperCase() ?? "";
      if (lab === "QC" || lab === "DYNACARE" || lab === "DYN") {
        return QC_PROFILE_COMPONENTS[key] ?? CDL_PROFILE_COMPONENTS[key] ?? [];
      }
      if (lab === "CDL") {
        return CDL_PROFILE_COMPONENTS[key] ?? QC_PROFILE_COMPONENTS[key] ?? [];
      }
      return getProfileComponents(profileCode);
    };

    const body = await req.json();
    const { testMappingIds, selectedPrices, profileHints, preferredLabCode } = body as {
      testMappingIds: string[];
      // price per testMappingId as chosen by the user (for savings comparison)
      selectedPrices: Record<string, number>;
      // optional user-entered profile hints (e.g. ITSS, GONO-CHLAM)
      profileHints?: string[];
      // optional selected lab context from UI (CDL / DYNACARE)
      preferredLabCode?: string | null;
    };
    const normalizeLabCode = (code: string | null | undefined): "CDL" | "DYNACARE" | null => {
      const c = (code ?? "").toUpperCase();
      if (!c) return null;
      if (c.includes("CDL")) return "CDL";
      if (c.includes("DYN")) return "DYNACARE";
      if (c === "QC") return "DYNACARE";
      return null;
    };
    const preferredLab = normalizeLabCode(preferredLabCode);

    const selectedIds = Array.isArray(testMappingIds) ? testMappingIds : [];
    const selectedPriceMap = selectedPrices ?? {};
    const rawHints = (profileHints ?? [])
      .map((h) => h?.toString().trim())
      .filter((h): h is string => Boolean(h))
      .map((h) => h.toUpperCase());
    const compactToken = (value: string): string =>
      value.toUpperCase().replace(/[^A-Z0-9]+/g, "");
    const compactHintSet = new Set(rawHints.map(compactToken).filter(Boolean));
    const stoneHintTokens = new Set([
      "STONE",
      "UROLITHIASE",
      "UROLITHIASIS",
      "24UPHOS",
      "24UCREA",
      "24UURIC",
      "OXAUR",
    ]);
    const stoneHintTriggered = Array.from(compactHintSet).some((t) =>
      Array.from(stoneHintTokens).some((s) => t.includes(s) || s.includes(t))
    );
    const hasSelectedTests = selectedIds.length > 0;
    const hasHints = rawHints.length > 0;

    if (!hasSelectedTests && !hasHints) {
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

    const matchingBundles: BundleRow[] = [];
    const bundleById = new Map<string, BundleRow>();

    if (hasSelectedTests) {
      // Prisma-native array containment match (avoids raw SQL failures / P2010).
      const selectedMatches = await prisma.bundleDeal.findMany({
        where: {
          isActive: true,
          testMappingIds: { hasEvery: selectedIds },
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
      for (const bundle of selectedMatches) {
        bundleById.set(bundle.id, bundle);
      }
    }

    if (hasHints) {
      const hintMatches = await prisma.bundleDeal.findMany({
        where: {
          isActive: true,
          OR: [
            ...rawHints.map((hint) => ({
              profileCode: { equals: hint, mode: "insensitive" as const },
            })),
            ...rawHints.flatMap((hint) => [
              { dealName: { contains: hint, mode: "insensitive" as const } },
              { description: { contains: hint, mode: "insensitive" as const } },
            ]),
          ],
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
      for (const bundle of hintMatches) {
        bundleById.set(bundle.id, bundle);
      }
    }

    matchingBundles.push(...bundleById.values());

    // Recovery / normalization path for profile bundles:
    // resolve profile components from profileCode -> component test codes -> mapping IDs.
    // This also fixes bundles seeded with stale or partial testMappingIds.
    const profileBundles = await prisma.bundleDeal.findMany({
      where: {
        isActive: true,
        profileCode: { not: null },
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
    });

    if (profileBundles.length > 0) {
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

      const selectedSet = new Set(selectedIds);
      const existingBundleIds = new Set(matchingBundles.map((b) => b.id));
      const hintSet = new Set(rawHints);

      const componentCodeAliases: Record<string, string[]> = {
        // Common chemistry code variants across labs/canonicals.
        PO4: ["PHOS"],
        PHOS: ["PO4"],
        LD: ["LDH"],
        LDH: ["LD"],
        ELEC: ["LYTES", "UELER"],
        LYTES: ["ELEC", "UELER"],
        CBC: ["FSC"],
        FSC: ["CBC"],
        PT: ["PTPT", "PTPTT"],
        PTT: ["PTPT", "PTPTT"],
        PTPT: ["PT", "PTT"],
        PTPTT: ["PT", "PTT"],
        // STI bundle variants across labs.
        CMPCR: ["CMPC", "CMPCU", "CGPCR1", "CGPCR2", "CGPCR3", "NGPCRD", "PCRCHSD", "STDMU"],
        GONOU: ["GONO", "NGPCRD", "TGCD", "STDMU"],
        // Hepatitis naming/code variants.
        HBAB: ["ANHBS"],
        ANHBS: ["HBAB"],
        HBCS: ["HEPBC"],
        HEPBC: ["HBCS"],
        HAVM: ["HEPAM"],
        HEPAM: ["HAVM"],
        DEGLIAG: ["GLIA"],
        GLIA: ["DEGLIAG"],
        TRANSGLUT: ["GTTG"],
        GTTG: ["TRANSGLUT"],
        // Lipid / CRP variants.
        LDLD: ["LDL"],
        LDL: ["LDLD"],
        CRPHS: ["CH4SC", "HSCRP", "CRPHS"],
        CH4SC: ["CRPHS", "HSCRP"],
        HSCRP: ["CRPHS", "CH4SC"],
        MONO: ["MON+"],
        "MON+": ["MONO"],
        BLDT: ["BLOOD"],
        BLOOD: ["BLDT"],
        TOXG: ["TOXO"],
        TOXO: ["TOXG"],
        RUB: ["RUBEOLA", "RUBIGG"],
        T4F: ["FT4", "T4L", "T4FREE"],
        FT4: ["T4F", "T4L", "T4FREE"],
        TAPRO: ["TPO", "ANTITPO"],
        TPO: ["TAPRO", "ANTITPO"],
        IRON: ["TIBCP"],
        TIBCP: ["IRON"],
        B2GP: ["B2GPIGA", "B2GPIGM", "B2GPIGG"],
        B2GPIGA: ["B2GP"],
        B2GPIGM: ["B2GP"],
        B2GPIGG: ["B2GP"],
      };

      const expandCandidateCodes = (code: string): string[] => {
        const upper = code.toUpperCase();
        const aliases = componentCodeAliases[upper] ?? [];
        return [upper, ...aliases];
      };

      for (const bundle of profileBundles) {
        const componentCodes = resolveProfileComponentCodes(
          bundle.profileCode,
          bundle.sourceLabCode
        );
        if (componentCodes.length === 0) continue;

        // Resolve each logical component code to exactly one mapping id.
        // This prevents alias expansion (e.g. CMPCR/CGPCR*/NGPCRD) from inflating
        // a profile into many extra pseudo-components.
        const resolvedIds = Array.from(
          new Set(
            componentCodes
              .map((code) => {
                const candidateIds = expandCandidateCodes(code)
                  .map((candidateCode) => codeToMapping.get(candidateCode))
                  .filter((id): id is string => Boolean(id));
                if (candidateIds.length === 0) return null;
                const preferredSelected = candidateIds.find((id) => selectedSet.has(id));
                return preferredSelected ?? candidateIds[0];
              })
              .filter((id): id is string => Boolean(id))
          )
        );

        if (resolvedIds.length === 0) continue;

        const resolvedSet = new Set(resolvedIds);
        const coversAllSelected = hasSelectedTests
          ? selectedIds.every((id) => selectedSet.has(id) && resolvedSet.has(id))
          : false;
        const bundleProfileCode = (bundle.profileCode ?? "").toUpperCase();
        const bundleDealName = (bundle.dealName ?? "").toUpperCase();
        const bundleDesc = (bundle.description ?? "").toUpperCase();
        const matchesHint = hasHints && Boolean(
          (bundleProfileCode && hintSet.has(bundleProfileCode)) ||
          compactHintSet.has(compactToken(bundleProfileCode)) ||
          (bundleProfileCode === "STONE" && stoneHintTriggered) ||
          rawHints.some((hint) =>
            bundleDealName.includes(hint) || bundleDesc.includes(hint)
          ) ||
          rawHints.some((hint) => {
            const compactHint = compactToken(hint);
            if (!compactHint) return false;
            return (
              compactToken(bundleDealName).includes(compactHint) ||
              compactToken(bundleDesc).includes(compactHint)
            );
          })
        );
        const normalizedBundle: BundleRow = {
          id: bundle.id,
          dealName: bundle.dealName,
          description: bundle.description ?? "",
          category: bundle.category ?? "Profil",
          icon: bundle.icon ?? "🧪",
          customRate: Number(bundle.customRate ?? 0),
          testMappingIds: resolvedIds,
          sourceLabCode: bundle.sourceLabCode,
          profileCode: bundle.profileCode,
        };

        if (existingBundleIds.has(bundle.id)) {
          const idx = matchingBundles.findIndex((b) => b.id === bundle.id);
          if (idx >= 0) matchingBundles[idx] = normalizedBundle;
          continue;
        }

        if (!coversAllSelected && !matchesHint) continue;
        matchingBundles.push(normalizedBundle);
        existingBundleIds.add(bundle.id);
      }

      // Safety net: when urolithiasis short-codes are entered, always surface STONE
      // as an alternative profile even if several component tests are not directly
      // discoverable through the generic test search endpoint.
      if (stoneHintTriggered && !matchingBundles.some((b) => (b.profileCode ?? "").toUpperCase() === "STONE")) {
        const stoneBundle = profileBundles.find(
          (b) => (b.profileCode ?? "").toUpperCase() === "STONE"
        );
        if (stoneBundle) {
          const stoneCodes = resolveProfileComponentCodes(
            stoneBundle.profileCode,
            stoneBundle.sourceLabCode
          );
          const stoneResolvedIds = Array.from(
            new Set(
              stoneCodes
                .map((code) => {
                  const candidateIds = expandCandidateCodes(code)
                    .map((candidateCode) => codeToMapping.get(candidateCode))
                    .filter((id): id is string => Boolean(id));
                  if (candidateIds.length === 0) return null;
                  const preferredSelected = candidateIds.find((id) => selectedSet.has(id));
                  return preferredSelected ?? candidateIds[0];
                })
                .filter((id): id is string => Boolean(id))
            )
          );
          if (stoneResolvedIds.length > 0) {
            matchingBundles.push({
              id: stoneBundle.id,
              dealName: stoneBundle.dealName,
              description: stoneBundle.description ?? "",
              category: stoneBundle.category ?? "Profil",
              icon: stoneBundle.icon ?? "🧪",
              customRate: Number(stoneBundle.customRate ?? 0),
              testMappingIds: stoneResolvedIds,
              sourceLabCode: stoneBundle.sourceLabCode,
              profileCode: stoneBundle.profileCode,
            });
            existingBundleIds.add(stoneBundle.id);
          }
        }
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

      const profileTestIds = new Set(b.testMappingIds ?? []);
      const selectedIdsInProfile = selectedIds.filter((id) => profileTestIds.has(id));
      const selectedIndividualSum = selectedIdsInProfile.reduce(
        (sum, id) => sum + (selectedPriceMap[id] ?? 0),
        0
      );

      const profilePrice = Number(b.customRate) || 0;
      const matchedSelectedCount = selectedIdsInProfile.length;
      const profileTestCount = b.testMappingIds?.length ?? 0;
      const extraIncludedCount = Math.max(
        0,
        profileTestCount - matchedSelectedCount
      );
      const savingsAmount = Math.max(0, selectedIndividualSum - profilePrice);
      const coversAllSelected =
        selectedIds.length > 0 && selectedIdsInProfile.length === selectedIds.length;
      const isRecommended =
        profilePrice > 0 &&
        selectedIndividualSum > 0 &&
        coversAllSelected &&
        profilePrice < selectedIndividualSum;

      return {
        id: b.id,
        dealName: b.dealName,
        description: b.description,
        category: b.category,
        icon: b.icon,
        profilePrice,
        sourceLabCode: b.sourceLabCode,
        normalizedSourceLabCode: normalizeLabCode(b.sourceLabCode),
        profileCode: b.profileCode,
        testMappingIds: b.testMappingIds ?? [],
        components,
        selectedIndividualSum,
        matchedSelectedCount,
        profileTestCount,
        extraIncludedCount,
        savingsAmount,
        isRecommended,
      };
    });

    results.sort((a, b) => {
      if (preferredLab) {
        const aSameLab = a.normalizedSourceLabCode === preferredLab;
        const bSameLab = b.normalizedSourceLabCode === preferredLab;
        if (aSameLab !== bSameLab) return aSameLab ? -1 : 1;
      }
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
