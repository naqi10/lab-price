import prisma from "@/lib/db";

export async function getCustomers(options?: { search?: string }) {
  const { search } = options ?? {};
  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { company: { contains: search, mode: "insensitive" } },
    ];
  }

  return prisma.customer.findMany({
    where,
    orderBy: { name: "asc" },
    include: {
      _count: { select: { emailLogs: true, estimates: true } },
    },
  });
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
  // Get both email logs and estimate emails for this customer
  const [emailLogs, estimateEmails] = await Promise.all([
    prisma.emailLog.findMany({
      where: { customerId },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.estimateEmail.findMany({
      where: { estimate: { customerId } },
      include: { estimate: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  // Combine and sort by date
  const combined = [
    ...emailLogs.map((log) => ({
      id: log.id,
      toEmail: log.toEmail,
      subject: log.subject,
      status: log.status,
      source: log.source || "system",
      error: log.error,
      createdAt: log.createdAt,
      estimateNumber: null,
    })),
    ...estimateEmails.map((email) => ({
      id: email.id,
      toEmail: email.toEmail,
      subject: email.subject,
      status: email.status,
      source: "estimate",
      error: email.error,
      createdAt: email.createdAt || new Date(),
      estimateNumber: email.estimate.estimateNumber,
    })),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return combined.slice(0, 50);
}
