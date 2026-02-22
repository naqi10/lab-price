import prisma from "@/lib/db";

/** Return active bundle deals, ordered by sortOrder (for public display). */
export async function getActiveBundleDeals() {
  return prisma.bundleDeal.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
}

/** Paginated bundle deals with optional search (for management page). */
export async function getBundleDeals(options?: {
  search?: string;
  page?: number;
  limit?: number;
}) {
  const { search, page = 1, limit = 20 } = options ?? {};

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { dealName: { contains: search, mode: "insensitive" } },
      { category: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  const [deals, total] = await Promise.all([
    prisma.bundleDeal.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.bundleDeal.count({ where }),
  ]);

  return { deals, total };
}

/** Create a new bundle deal. Validates that all testMappingIds exist. */
export async function createBundleDeal(data: {
  dealName: string;
  description: string;
  category: string;
  icon: string;
  customRate: number;
  popular?: boolean;
  testMappingIds: string[];
  isActive?: boolean;
  sortOrder?: number;
}) {
  if (data.testMappingIds.length > 0) {
    const count = await prisma.testMapping.count({
      where: { id: { in: data.testMappingIds } },
    });
    if (count !== data.testMappingIds.length) {
      throw new Error("Certains IDs de correspondances sont invalides");
    }
  }

  return prisma.bundleDeal.create({ data });
}

/** Update an existing bundle deal. Validates testMappingIds if provided. */
export async function updateBundleDeal(
  id: string,
  data: {
    dealName?: string;
    description?: string;
    category?: string;
    icon?: string;
    customRate?: number;
    popular?: boolean;
    testMappingIds?: string[];
    isActive?: boolean;
    sortOrder?: number;
  }
) {
  if (data.testMappingIds && data.testMappingIds.length > 0) {
    const count = await prisma.testMapping.count({
      where: { id: { in: data.testMappingIds } },
    });
    if (count !== data.testMappingIds.length) {
      throw new Error("Certains IDs de correspondances sont invalides");
    }
  }

  return prisma.bundleDeal.update({ where: { id }, data });
}

/** Hard delete a bundle deal. */
export async function deleteBundleDeal(id: string) {
  return prisma.bundleDeal.delete({ where: { id } });
}
