import prisma from "@/lib/db";

/**
 * Upload and register a new price list for a laboratory.
 *
 * Schema fields: fileName, fileType (EXCEL|PDF), fileSize, isActive
 * Related: tests (Test[]) via priceListId
 */
export async function uploadPriceList(data: {
  laboratoryId: string;
  fileName: string;
  fileType: "EXCEL" | "PDF";
  fileSize: number;
  setAsActive?: boolean;
  uploadedById?: string | null;
  tests: Array<{
    name: string;
    code?: string | null;
    category?: string | null;
    price: number;
    unit?: string | null;
    description?: string | null;
    turnaroundTime?: string | null;
    tubeType?: string | null;
  }>;
}) {
  return prisma.$transaction(async (tx) => {
    if (data.setAsActive) {
      await tx.priceList.updateMany({
        where: { laboratoryId: data.laboratoryId, isActive: true },
        data: { isActive: false },
      });
    }

    const priceList = await tx.priceList.create({
      data: {
        laboratoryId: data.laboratoryId,
        fileName: data.fileName,
        fileType: data.fileType,
        fileSize: data.fileSize,
        isActive: data.setAsActive ?? false,
        uploadedById: data.uploadedById ?? null,
        tests: {
          createMany: {
            data: data.tests.map((test) => ({
              name: test.name,
              code: test.code ?? null,
              category: test.category ?? null,
              price: test.price,
              unit: test.unit ?? null,
              description: test.description ?? null,
              turnaroundTime: test.turnaroundTime ?? null,
              tubeType: test.tubeType ?? null,
            })),
          },
        },
      },
      include: {
        _count: { select: { tests: true } },
      },
    });

    return priceList;
  });
}

/**
 * Retrieve all price lists, optionally filtered by laboratory.
 */
export async function getPriceLists(options?: {
  laboratoryId?: string;
  activeOnly?: boolean;
}) {
  const { laboratoryId, activeOnly = false } = options ?? {};
  const where: Record<string, unknown> = {};

  if (laboratoryId) where.laboratoryId = laboratoryId;
  if (activeOnly) where.isActive = true;

  return prisma.priceList.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      laboratory: { select: { id: true, name: true, code: true } },
      uploadedBy: { select: { id: true, name: true } },
      _count: { select: { tests: true } },
    },
  });
}

/**
 * Delete a price list and its associated tests (cascade via schema).
 */
export async function deletePriceList(id: string) {
  return prisma.priceList.delete({ where: { id } });
}

/**
 * Activate a specific price list and deactivate all others for the same laboratory.
 */
export async function activatePriceList(id: string) {
  const priceList = await prisma.priceList.findUnique({
    where: { id },
    select: { laboratoryId: true },
  });

  if (!priceList) {
    throw new Error("Liste de prix non trouvée");
  }

  return prisma.$transaction(async (tx) => {
    await tx.priceList.updateMany({
      where: { laboratoryId: priceList.laboratoryId, isActive: true },
      data: { isActive: false },
    });

    return tx.priceList.update({
      where: { id },
      data: { isActive: true },
    });
  });
}
