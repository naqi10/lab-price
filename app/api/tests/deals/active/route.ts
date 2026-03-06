import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getActiveBundleDeals } from "@/lib/services/bundle-deal.service";
import { getProfileMeta } from "@/lib/data/profile-metadata";
import { getProfileDescription, getProfileComponents } from "@/lib/data/profile-descriptions";
import { cdlSeedData, qcSeedData } from "@/prisma/seed1";
import prisma from "@/lib/db";
import logger from "@/lib/logger";

function cleanProfileName(name: string): string {
  return name.replace(/,\s*PROFIL(E)?$/i, "").replace(/\s+PROFIL(E)?$/i, "").trim();
}

function normalizeLookup(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

function extractComponentsFromName(name: string): string[] {
  const match = name.match(/\(([^)]+)\)/);
  if (!match) return [];
  return match[1]
    .split(",")
    .map((n) => n.trim())
    .filter(Boolean);
}

function firstTubeValue(value: unknown): string | null {
  if (Array.isArray(value)) {
    const first = value.find((v) => typeof v === "string" && v.trim().length > 0);
    return typeof first === "string" ? first : null;
  }
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function resolveProfileTubeValue(params: {
  metaTube: string | null;
  seedTube: string | null;
  componentTests: Array<{ tubeType: string | null }>;
}): string | null {
  if (params.metaTube) return params.metaTube;
  if (params.seedTube) return params.seedTube;

  const unique = Array.from(
    new Set(
      params.componentTests
        .map((t) => (t.tubeType ?? "").trim())
        .filter(Boolean)
    )
  );

  if (unique.length === 0) return null;
  if (unique.length === 1) return unique[0];
  // Avoid misleading single-color dot for multi-tube profiles.
  return "Tubes multiples";
}

export async function GET() {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ success: false, message: "Non autorisé" }, { status: 401 });

    const [deals, activeProfileTests, testsWithMapping, allMappings] = await Promise.all([
      getActiveBundleDeals(),
      prisma.test.findMany({
        where: {
          priceList: { isActive: true },
          OR: [
            { category: { equals: "Profil", mode: "insensitive" } },
            { category: { equals: "Profile", mode: "insensitive" } },
          ],
          code: { not: null },
        },
        select: {
          id: true,
          name: true,
          code: true,
          price: true,
          tubeType: true,
          turnaroundTime: true,
          testMappingEntry: {
            select: {
              testMappingId: true,
              testMapping: { select: { canonicalName: true } },
            },
          },
          priceList: {
            select: {
              laboratory: { select: { code: true } },
            },
          },
        },
        orderBy: [{ name: "asc" }],
      }),
      prisma.test.findMany({
        where: {
          priceList: { isActive: true },
          code: { not: null },
          testMappingEntryId: { not: null },
        },
        select: {
          code: true,
          tubeType: true,
          testMappingEntry: { select: { testMappingId: true } },
        },
      }),
      prisma.testMapping.findMany({
        select: { id: true, canonicalName: true, code: true },
      }),
    ]);

    const codeToMappingId = new Map<string, string>();
    const mappingIdToTubeType = new Map<string, string>();
    const codeToTubeType = new Map<string, string>();
    for (const t of testsWithMapping) {
      if (!t.code || !t.testMappingEntry?.testMappingId) continue;
      const mappingId = t.testMappingEntry.testMappingId;
      codeToMappingId.set(t.code.toUpperCase(), mappingId);
      if (t.tubeType && !codeToTubeType.has(t.code.toUpperCase())) {
        codeToTubeType.set(t.code.toUpperCase(), t.tubeType);
      }
      if (t.tubeType && !mappingIdToTubeType.has(mappingId)) {
        mappingIdToTubeType.set(mappingId, t.tubeType);
      }
    }

    for (const test of cdlSeedData.all) {
      const code = test.code?.toUpperCase();
      const tube = firstTubeValue(test.tube);
      if (code && tube && !codeToTubeType.has(code)) {
        codeToTubeType.set(code, tube);
      }
    }
    for (const test of qcSeedData) {
      const code = test.code?.toUpperCase();
      const tube = firstTubeValue(test.tube);
      if (code && tube && !codeToTubeType.has(code)) {
        codeToTubeType.set(code, tube);
      }
    }

    const profileCodeToComponents = new Map<string, string[]>();
    const profileCodeToComponentNames = new Map<string, string[]>();
    const profileCodeToDisplayName = new Map<string, string>();
    for (const p of cdlSeedData.profiles) {
      if (p.code && p.componentCodes?.length) profileCodeToComponents.set(p.code.toUpperCase(), p.componentCodes);
      if (p.code) {
        const namesFromParens = extractComponentsFromName(p.name);
        if (namesFromParens.length > 0) profileCodeToComponentNames.set(p.code.toUpperCase(), namesFromParens);
        profileCodeToDisplayName.set(p.code.toUpperCase(), p.name);
      }
    }
    for (const p of qcSeedData) {
      if (p.code && p.componentCodes?.length) profileCodeToComponents.set(p.code.toUpperCase(), p.componentCodes);
      if (p.code && /^profil\b/i.test(p.name)) {
        const namesFromParens = extractComponentsFromName(p.name);
        if (namesFromParens.length > 0) profileCodeToComponentNames.set(p.code.toUpperCase(), namesFromParens);
      }
      if (p.code) profileCodeToDisplayName.set(p.code.toUpperCase(), p.name);
    }

    const normalizedCanonical = allMappings.map((m) => ({
      id: m.id,
      canonicalName: m.canonicalName,
      normalized: normalizeLookup(m.canonicalName),
    }));

    const resolveByCanonicalName = (name: string): string | null => {
      const target = normalizeLookup(name);
      if (!target) return null;
      // Exact normalized match first.
      const exact = normalizedCanonical.find((m) => m.normalized === target);
      if (exact) return exact.id;
      // Prefix/contains fallback for catalog variations.
      const loose = normalizedCanonical.find(
        (m) =>
          (m.normalized.includes(target) || target.includes(m.normalized)) &&
          Math.min(m.normalized.length, target.length) >= 4
      );
      return loose?.id ?? null;
    };

    const resolveProfileComponents = (profileCode: string | null | undefined): string[] => {
      if (!profileCode) return [];
      const components = profileCodeToComponents.get(profileCode.toUpperCase()) ?? [];
      const componentNames = profileCodeToComponentNames.get(profileCode.toUpperCase()) ?? [];
      const explicitCodes = getProfileComponents(profileCode);
      const ids = new Set<string>();
      for (const code of components) {
        const id = codeToMappingId.get(code.toUpperCase());
        if (id) ids.add(id);
      }
      for (const componentName of componentNames) {
        const id = resolveByCanonicalName(componentName);
        if (id) ids.add(id);
      }
      for (const code of explicitCodes) {
        const id = codeToMappingId.get(code.toUpperCase());
        if (id) ids.add(id);
      }
      return Array.from(ids);
    };

    // Add missing profile bundles from active seeded profile tests.
    const existingKeys = new Set(
      deals
        .filter((d) => d.profileCode && d.sourceLabCode)
        .map((d) => `${d.sourceLabCode}:${d.profileCode}`)
    );

    const fallbackDeals = activeProfileTests
      .filter((t) => !!t.code && !!t.testMappingEntry?.testMappingId && !!t.priceList?.laboratory?.code)
      .filter((t) => !existingKeys.has(`${t.priceList!.laboratory.code}:${t.code!}`))
      .map((t, idx) => ({
        id: `auto-${t.priceList!.laboratory.code}-${t.code}`,
        dealName: cleanProfileName(t.name),
        description: getProfileDescription(t.code) ?? `Profil ${t.priceList!.laboratory.code} — ${t.code}`,
        category: "Profil",
        icon: "🧪",
        popular: false,
        sortOrder: 100000 + idx,
        customRate: t.price,
        testMappingIds:
          resolveProfileComponents(t.code).length > 0
            ? resolveProfileComponents(t.code)
            : [t.testMappingEntry!.testMappingId],
        sourceLabCode: t.priceList!.laboratory.code,
        profileCode: t.code,
        profilePrice: t.price,
        isAutoGenerated: true,
        isActive: true,
      }));

    const profileByLabAndCode = new Map(
      activeProfileTests
        .filter((t) => t.code && t.priceList?.laboratory?.code)
        .map((t) => [`${t.priceList!.laboratory.code}:${t.code!}`, t] as const)
    );

    const allDeals = [...deals, ...fallbackDeals].map((deal) => {
      const resolved = resolveProfileComponents(deal.profileCode);
      // If we can resolve richer component mappings for a profile, prefer them.
      if (resolved.length > 0) {
        return { ...deal, testMappingIds: resolved };
      }
      // Fallback: if the BundleDeal was seeded with empty testMappingIds and we couldn't
      // resolve components, use the test's own TestMapping as a single-test bundle.
      if (deal.testMappingIds.length === 0 && deal.profileCode && deal.sourceLabCode) {
        const seedTest = profileByLabAndCode.get(`${deal.sourceLabCode}:${deal.profileCode}`);
        if (seedTest?.testMappingEntry?.testMappingId) {
          logger.warn({ profileCode: deal.profileCode, labCode: deal.sourceLabCode }, "[deals/active] bundle has no resolved components, using self-mapping");
          return { ...deal, testMappingIds: [seedTest.testMappingEntry.testMappingId] };
        }
      }
      return deal;
    });

    // Resolve canonical names and codes from already-loaded mappings.
    const allIds = [...new Set(allDeals.flatMap((d) => d.testMappingIds))];
    const filteredMappings = allMappings.filter((m) => allIds.includes(m.id));
    const idToName = new Map(filteredMappings.map((m) => [m.id, m.canonicalName]));
    const idToCode = new Map(filteredMappings.map((m) => [m.id, m.code]));

    const enriched = allDeals.map((deal) => {
      const seen = new Set<string>();
      const canonicalNames: string[] = [];
      const componentTests: { id: string; name: string; code: string | null; tubeType: string | null }[] = [];
      for (const id of deal.testMappingIds) {
        if (seen.has(id)) continue;
        seen.add(id);
        const name = idToName.get(id);
        if (!name) continue;
        canonicalNames.push(name);
        const code = idToCode.get(id) ?? null;
        const fallbackTubeByCode = code ? codeToTubeType.get(code.toUpperCase()) ?? null : null;
        componentTests.push({
          id,
          name,
          code,
          tubeType: mappingIdToTubeType.get(id) ?? fallbackTubeByCode,
        });
      }

      // Enrich with profile metadata (tube type, turnaround, notes).
      // Fallback to active seeded profile test data when metadata is absent.
      const profileFromSeed = deal.profileCode && deal.sourceLabCode
        ? profileByLabAndCode.get(`${deal.sourceLabCode}:${deal.profileCode}`)
        : null;
      const meta = getProfileMeta(deal.profileCode);
      const profileCodeKey = deal.profileCode?.toUpperCase();
      const componentNamesFromSeed = profileCodeKey
        ? profileCodeToComponentNames.get(profileCodeKey) ?? []
        : [];
      const seedDisplayName = profileCodeKey ? profileCodeToDisplayName.get(profileCodeKey) : null;
      const fallbackParsed = seedDisplayName ? extractComponentsFromName(seedDisplayName) : [];
      const profileComponentNames =
        componentNamesFromSeed.length > 0
          ? componentNamesFromSeed
          : fallbackParsed.length > 0
            ? fallbackParsed
            : canonicalNames;

      // Enrich description: prefer map lookup over old generic stored value
      const descriptionFromMap = getProfileDescription(deal.profileCode);
      const description =
        descriptionFromMap ??
        (deal.description && !/^Profil (CDL|Dynacare|QC) — /.test(deal.description)
          ? deal.description
          : null) ??
        deal.description;

      return {
        ...deal,
        description,
        canonicalNames,
        componentTests,
        profileComponentNames,
        profileTube: resolveProfileTubeValue({
          metaTube: meta?.tube ?? null,
          seedTube: profileFromSeed?.tubeType ?? null,
          componentTests,
        }),
        profileTurnaround: meta?.turnaroundDays ?? profileFromSeed?.turnaroundTime ?? null,
        profileNotes: meta?.notes ?? null,
      };
    });

    return NextResponse.json({ success: true, data: enriched });
  } catch (error) {
    logger.error({ err: error }, "[GET /api/tests/deals/active]");
    return NextResponse.json({ success: false, message: "Erreur serveur" }, { status: 500 });
  }
}
