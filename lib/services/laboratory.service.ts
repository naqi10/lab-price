import prisma from "@/lib/db";

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
      _count: { select: { priceLists: true } },
    },
  });
}

export async function getLaboratoryById(id: string) {
  return prisma.laboratory.findUnique({
    where: { id },
    include: {
      priceLists: {
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { tests: true } },
        },
      },
    },
  });
}

export async function createLaboratory(data: {
  name: string;
  code: string;
  address?: string | null;
  city?: string | null;
  phone?: string | null;
  email?: string | null;
  contactName?: string | null;
}) {
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
      contactName: data.contactName ?? null,
    },
  });
}

export async function updateLaboratory(
  id: string,
  data: {
    name?: string;
    code?: string;
    address?: string | null;
    city?: string | null;
    phone?: string | null;
    email?: string | null;
    contactName?: string | null;
  }
) {
  if (data.code) {
    const existing = await prisma.laboratory.findFirst({
      where: { code: data.code, deletedAt: null, NOT: { id } },
    });
    if (existing) {
      throw new Error(`Un laboratoire avec le code "${data.code}" existe déjà`);
    }
  }

  return prisma.laboratory.update({ where: { id }, data });
}

export async function deleteLaboratory(id: string) {
  return prisma.laboratory.update({
    where: { id },
    data: { deletedAt: new Date(), isActive: false },
  });
}

export async function getLaboratoryStats(id: string) {
  const [laboratory, priceListCount, testCount] =
    await Promise.all([
      prisma.laboratory.findUnique({ where: { id } }),
      prisma.priceList.count({ where: { laboratoryId: id } }),
      prisma.test.count({ where: { priceList: { laboratoryId: id } } }),
    ]);

  if (!laboratory) throw new Error("Laboratoire non trouvé");

  const activePriceList = await prisma.priceList.findFirst({
    where: { laboratoryId: id, isActive: true },
  });

  let averageTestPrice: number | null = null;
  if (activePriceList) {
    const aggregation = await prisma.test.aggregate({
      where: { priceListId: activePriceList.id },
      _avg: { price: true },
    });
    averageTestPrice = aggregation._avg.price;
  }

  return { laboratory, priceListCount, testCount, averageTestPrice };
}
