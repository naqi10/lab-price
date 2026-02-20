import prisma from "@/lib/db";

export async function getCustomers(options?: {
  search?: string;
  page?: number;
  limit?: number;
}) {
  const { search, page = 1, limit = 20 } = options ?? {};
  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { company: { contains: search, mode: "insensitive" } },
    ];
  }

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: { name: "asc" },
      include: {
        _count: { select: { emailLogs: true, estimates: true } },
      },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.customer.count({ where }),
  ]);

  return { customers, total };
}

export async function getCustomerById(id: string) {
  return prisma.customer.findUnique({
    where: { id },
    include: {
      _count: { select: { emailLogs: true, estimates: true } },
    },
  });
}

export async function createCustomer(data: {
  name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
}) {
  const existing = await prisma.customer.findUnique({
    where: { email: data.email },
  });

  if (existing) {
    throw new Error(`Un client avec l'email "${data.email}" existe déjà`);
  }

  return prisma.customer.create({
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone ?? null,
      company: data.company ?? null,
    },
  });
}

export async function updateCustomer(
  id: string,
  data: {
    name?: string;
    email?: string;
    phone?: string | null;
    company?: string | null;
  }
) {
  if (data.email) {
    const existing = await prisma.customer.findFirst({
      where: { email: data.email, NOT: { id } },
    });
    if (existing) {
      throw new Error(`Un client avec l'email "${data.email}" existe déjà`);
    }
  }

  return prisma.customer.update({ where: { id }, data });
}

export async function deleteCustomer(id: string) {
  return prisma.customer.delete({ where: { id } });
}

export async function searchCustomers(query: string) {
  if (!query || query.length < 1) return [];

  return prisma.customer.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
      ],
    },
    select: { id: true, name: true, email: true, company: true },
    take: 10,
    orderBy: { name: "asc" },
  });
}

export async function getCustomerHistory(customerId: string) {
  // Get estimate emails (all estimate-related emails - both initial sends and resends)
  const estimateEmails = await prisma.estimateEmail.findMany({
    where: { estimate: { customerId } },
    include: { 
      estimate: true,
      sentBy: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  // Map to timeline items with estimate details
  const timeline = estimateEmails.map((email) => {
    // Parse test details from estimate
    let testMappingDetails: any[] = [];
    if (email.estimate.testDetails) {
      try {
        testMappingDetails = JSON.parse(email.estimate.testDetails as string);
      } catch (e) {
        // If parsing fails, leave empty
      }
    }

    return {
      id: email.id,
      toEmail: email.toEmail,
      subject: email.subject,
      status: email.status,
      source: "estimate",
      error: email.error,
      createdAt: email.createdAt || new Date(),
      estimateNumber: email.estimate.estimateNumber,
      estimateId: email.estimate.id,
      estimate: {
        testMappingIds: email.estimate.testMappingIds,
        selections: email.estimate.selections,
        customPrices: email.estimate.customPrices,
        testMappingDetails,
      },
    };
  });

  return timeline;
}
