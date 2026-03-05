import prisma from "@/lib/db";

export interface ComponentReport {
  canonicalName: string;
  code: string | null;
  found: boolean;
  individualPrice: number | null;
}

export interface BundleComponentReport {
  bundleId: string;
  dealName: string;
  sourceLabCode: string | null;
  profilePrice: number | null;
  customRate: number;
  components: ComponentReport[];
  sumIndividualPrices: number | null;
  savings: number | null;
  savingsPercent: number | null;
  hasComponentData: boolean;
}

/**
 * Returns a per-component breakdown for a bundle.
 * For each TestMapping in testMappingIds, finds the matching
 * TestMappingEntry for the bundle's source lab and compares prices.
 */
export async function getBundleComponentReport(
  bundleId: string
): Promise<BundleComponentReport | null> {
  const bundle = await prisma.bundleDeal.findUnique({
    where: { id: bundleId },
  });
  if (!bundle) return null;

  if (bundle.testMappingIds.length === 0) {
    return {
      bundleId: bundle.id,
      dealName: bundle.dealName,
      sourceLabCode: bundle.sourceLabCode,
      profilePrice: bundle.profilePrice,
      customRate: bundle.customRate,
      components: [],
      sumIndividualPrices: null,
      savings: null,
      savingsPercent: null,
      hasComponentData: false,
    };
  }

  // Find the lab by sourceLabCode
  const lab = bundle.sourceLabCode
    ? await prisma.laboratory.findFirst({
        where: { code: bundle.sourceLabCode },
      })
    : null;

  // Fetch all component TestMappings with their entries for this lab
  const mappings = await prisma.testMapping.findMany({
    where: { id: { in: bundle.testMappingIds } },
    include: {
      entries: {
        where: lab ? { laboratoryId: lab.id } : undefined,
      },
    },
  });

  const components: ComponentReport[] = mappings.map((m) => {
    const entry = m.entries[0] ?? null;
    return {
      canonicalName: m.canonicalName,
      code: m.code,
      found: entry !== null,
      individualPrice: entry?.price ?? null,
    };
  });

  const foundComponents = components.filter((c) => c.found && c.individualPrice !== null);
  const sumIndividualPrices =
    foundComponents.length === components.length
      ? foundComponents.reduce((acc, c) => acc + (c.individualPrice ?? 0), 0)
      : null;

  const bundlePrice = bundle.profilePrice ?? bundle.customRate;
  const savings =
    sumIndividualPrices !== null ? sumIndividualPrices - bundlePrice : null;
  const savingsPercent =
    savings !== null && sumIndividualPrices
      ? Math.round((savings / sumIndividualPrices) * 100)
      : null;

  return {
    bundleId: bundle.id,
    dealName: bundle.dealName,
    sourceLabCode: bundle.sourceLabCode,
    profilePrice: bundle.profilePrice,
    customRate: bundle.customRate,
    components,
    sumIndividualPrices,
    savings,
    savingsPercent,
    hasComponentData: true,
  };
}
