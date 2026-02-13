import prisma from "@/lib/db";

/**
 * Retrieve all laboratories, optionally filtered.
 *
 * @param options.includeInactive - Whether to include soft-deleted / inactive labs
 * @param options.search          - Optional search term for name or code
 * @returns Array of laboratory records
 */
export async function getLaboratories(options?: {
  includeInactive?: boolean;
  search?: string;
}) {
  const { includeInactive = false, search } = options ?? {};

  const where: Record<string, unknown> = {};

  if (!includeInactive) {
    where.isActive = true;
    where.deletedAt = null;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { code: { contains: search, mode: "insensitive" } },
      { city: { contains: search, mode: "insensitive" } },
    ];
  }

  return prisma.laboratory.findMany({
    where,
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { priceLists: true },
      },
    },
  });
}

/**
 * Retrieve a single laboratory by its ID, including related price lists.
 *
 * @param id - The laboratory's unique identifier
 * @returns The laboratory record or null if not found
 */
export async function getLaboratoryById(id: string) {
  return prisma.laboratory.findUnique({
    where: { id },
    include: {
      priceLists: {
        orderBy: { effectiveDate: "desc" },
        include: {
          _count: {
            select: { tests: true },
          },
        },
      },
    },
  });
}

/**
 * Create a new laboratory.
 *
 * @param data - Laboratory fields (validated upstream via laboratorySchema)
 * @returns The newly created laboratory record
 */
export async function createLaboratory(data: {
  name: string;
  code: string;
  address?: string | null;
  city?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  contactPerson?: string | null;
  notes?: string | null;
  isActive?: boolean;
}) {
  // Check for duplicate code before creating
  const existing = await prisma.laboratory.findFirst({
    where: { code: data.code, deletedAt: null },
  });

  if (existing) {
    throw new Error(`Un laboratoire avec le code "${data.code}" existe déjà`);
  }

  return prisma.laboratory.create({
    data: {
      name: data.name,
      code: data.code,
      address: data.address ?? null,
      city: data.city ?? null,
      phone: data.phone ?? null,
      email: data.email ?? null,
      website: data.website ?? null,
      contactPerson: data.contactPerson ?? null,
      notes: data.notes ?? null,
      isActive: data.isActive ?? true,
    },
  });
}

/**
 * Update an existing laboratory.
 *
 * @param id   - The laboratory's unique identifier
 * @param data - Partial laboratory fields to update
 * @returns The updated laboratory record
 */
export async function updateLaboratory(
  id: string,
  data: {
    name?: string;
    code?: string;
    address?: string | null;
    city?: string | null;
    phone?: string | null;
    email?: string | null;
    website?: string | null;
    contactPerson?: string | null;
    notes?: string | null;
    isActive?: boolean;
  }
) {
  // If code is changing, check for duplicates
  if (data.code) {
    const existing = await prisma.laboratory.findFirst({
      where: {
        code: data.code,
        deletedAt: null,
        NOT: { id },
      },
    });

    if (existing) {
      throw new Error(`Un laboratoire avec le code "${data.code}" existe déjà`);
    }
  }

  return prisma.laboratory.update({
    where: { id },
    data,
  });
}

/**
 * Soft-delete a laboratory by setting the deletedAt timestamp.
 *
 * This preserves historical data (quotations, price lists) while
 * hiding the laboratory from active listings.
 *
 * @param id - The laboratory's unique identifier
 * @returns The soft-deleted laboratory record
 */
export async function deleteLaboratory(id: string) {
  return prisma.laboratory.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      isActive: false,
    },
  });
}

/**
 * Retrieve aggregate statistics for a laboratory.
 *
 * @param id - The laboratory's unique identifier
 * @returns Statistics object with counts and price info
 */
export async function getLaboratoryStats(id: string) {
  const [laboratory, priceListCount, testCount, quotationCount] =
    await Promise.all([
      prisma.laboratory.findUnique({ where: { id } }),
      prisma.priceList.count({ where: { laboratoryId: id } }),
      prisma.labTest.count({
        where: { priceList: { laboratoryId: id } },
      }),
      prisma.quotation.count({ where: { laboratoryId: id } }),
    ]);

  if (!laboratory) {
    throw new Error("Laboratoire non trouvé");
  }

  // Get the active price list's average test price
  const activePriceList = await prisma.priceList.findFirst({
    where: { laboratoryId: id, isActive: true },
  });

  let averageTestPrice: number | null = null;
  if (activePriceList) {
    const aggregation = await prisma.labTest.aggregate({
      where: { priceListId: activePriceList.id },
      _avg: { price: true },
      _min: { price: true },
      _max: { price: true },
    });
    averageTestPrice = aggregation._avg.price;
  }

  return {
    laboratory,
    priceListCount,
    testCount,
    quotationCount,
    averageTestPrice,
  };
}
