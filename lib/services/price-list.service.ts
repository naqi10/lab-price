import prisma from "@/lib/db";

/**
 * Upload and register a new price list for a laboratory.
 *
 * This function:
 * 1. Creates the PriceList record
 * 2. Stores the parsed test entries as LabTest records
 * 3. Optionally sets the new list as the active one
 *
 * @param data.laboratoryId  - Target laboratory ID
 * @param data.name          - Human-readable name for the price list
 * @param data.effectiveDate - Date the price list becomes effective
 * @param data.fileType      - "EXCEL" or "PDF"
 * @param data.filePath      - Stored file path (after upload)
 * @param data.setAsActive   - Whether to activate this list immediately
 * @param data.tests         - Parsed test entries from the file
 * @returns The newly created PriceList with test count
 */
export async function uploadPriceList(data: {
  laboratoryId: string;
  name: string;
  effectiveDate: Date;
  fileType: "EXCEL" | "PDF";
  filePath: string;
  setAsActive?: boolean;
  tests: Array<{
    name: string;
    code?: string | null;
    category?: string | null;
    price: number;
    unit?: string | null;
    description?: string | null;
  }>;
}) {
  return prisma.$transaction(async (tx) => {
    // If setting as active, deactivate all other price lists for this lab
    if (data.setAsActive) {
      await tx.priceList.updateMany({
        where: {
          laboratoryId: data.laboratoryId,
          isActive: true,
        },
        data: { isActive: false },
      });
    }

    // Create the price list record
    const priceList = await tx.priceList.create({
      data: {
        laboratoryId: data.laboratoryId,
        name: data.name,
        effectiveDate: data.effectiveDate,
        fileType: data.fileType,
        filePath: data.filePath,
        isActive: data.setAsActive ?? false,
        tests: {
          createMany: {
            data: data.tests.map((test) => ({
              name: test.name,
              code: test.code ?? null,
              category: test.category ?? null,
              price: test.price,
              unit: test.unit ?? null,
              description: test.description ?? null,
            })),
          },
        },
      },
      include: {
        _count: {
          select: { tests: true },
        },
      },
    });

    return priceList;
  });
}

/**
 * Retrieve all price lists, optionally filtered by laboratory.
 *
 * @param options.laboratoryId - Filter by laboratory
 * @param options.activeOnly   - Only return active price lists
 * @returns Array of price list records
 */
export async function getPriceLists(options?: {
  laboratoryId?: string;
  activeOnly?: boolean;
}) {
  const { laboratoryId, activeOnly = false } = options ?? {};

  const where: Record<string, unknown> = {};

  if (laboratoryId) {
    where.laboratoryId = laboratoryId;
  }

  if (activeOnly) {
    where.isActive = true;
  }

  return prisma.priceList.findMany({
    where,
    orderBy: { effectiveDate: "desc" },
    include: {
      laboratory: {
        select: { id: true, name: true, code: true },
      },
      _count: {
        select: { tests: true },
      },
    },
  });
}

/**
 * Delete a price list and its associated test entries.
 *
 * @param id - The price list's unique identifier
 * @returns The deleted price list record
 */
export async function deletePriceList(id: string) {
  return prisma.$transaction(async (tx) => {
    // Delete all associated lab tests first
    await tx.labTest.deleteMany({
      where: { priceListId: id },
    });

    // Delete the price list
    const deleted = await tx.priceList.delete({
      where: { id },
    });

    return deleted;
  });
}

/**
 * Activate a specific price list and deactivate all others
 * for the same laboratory.
 *
 * @param id - The price list's unique identifier
 * @returns The activated price list record
 */
export async function activatePriceList(id: string) {
  // First, find the price list to get its laboratory ID
  const priceList = await prisma.priceList.findUnique({
    where: { id },
    select: { laboratoryId: true },
  });

  if (!priceList) {
    throw new Error("Liste de prix non trouvée");
  }

  return prisma.$transaction(async (tx) => {
    // Deactivate all price lists for this laboratory
    await tx.priceList.updateMany({
      where: {
        laboratoryId: priceList.laboratoryId,
        isActive: true,
      },
      data: { isActive: false },
    });

    // Activate the target price list
    return tx.priceList.update({
      where: { id },
      data: { isActive: true },
    });
  });
}
