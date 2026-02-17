import prisma from "@/lib/db";
import { generateQuotationNumber } from "@/lib/utils";

/**
 * Create a new quotation from a price comparison result.
 * @param data - Quotation creation data
 * @returns The newly created quotation with its items
 */
export async function createQuotation(data: {
  title: string;
  laboratoryId: string;
  testMappingIds: string[];
  clientName?: string | null;
  clientEmail?: string | null;
  clientReference?: string | null;
  notes?: string | null;
  taxRate?: number;
  validityDays?: number;
  createdById: string;
}) {
  const { title, laboratoryId, testMappingIds, clientName, clientEmail,
    clientReference, notes, taxRate = 20, validityDays = 30, createdById } = data;

  const quotationNumber = generateQuotationNumber();
  const now = new Date();
  const validUntil = new Date(now);
  validUntil.setDate(validUntil.getDate() + validityDays);

  const entries = await prisma.testMappingEntry.findMany({
    where: { testMappingId: { in: testMappingIds }, laboratoryId },
    include: {
      testMapping: { select: { id: true, canonicalName: true } },
    },
  });

  if (entries.length === 0) {
    throw new Error("Aucun test trouvé pour ce laboratoire");
  }

  const subtotal = entries.reduce((sum, e) => sum + (e.price ?? 0), 0);
  const taxAmount = taxRate > 0 ? subtotal * (taxRate / 100) : 0;
  const totalPrice = subtotal + taxAmount;

  return prisma.$transaction(async (tx) => {
    const quotation = await tx.quotation.create({
      data: {
        quotationNumber, title, laboratoryId,
        clientName: clientName ?? null,
        clientEmail: clientEmail ?? null,
        clientReference: clientReference ?? null,
        notes: notes ?? null,
        subtotal,
        taxRate: taxRate ?? null,
        taxAmount: taxAmount || null,
        totalPrice,
        validUntil,
        status: "DRAFT", createdById,
        items: {
          createMany: {
            data: entries.map((entry, index) => ({
              position: index + 1,
              testName: entry.testMapping.canonicalName,
              testCode: null,
              labTestName: entry.localTestName,
              labTestCode: null,
              price: entry.price ?? 0,
              testMappingId: entry.testMappingId,
            })),
          },
        },
      },
      include: {
        laboratory: { select: { id: true, name: true, code: true } },
        items: { orderBy: { position: "asc" } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });
    return quotation;
  });
}

/**
 * Retrieve all quotations with optional filtering.
 * @param options - Filter and pagination options
 * @returns Paginated quotation records
 */
export async function getQuotations(options?: {
  status?: string; laboratoryId?: string; search?: string;
  dateFrom?: string; dateTo?: string;
  page?: number; pageSize?: number;
}) {
  const { status, laboratoryId, search, dateFrom, dateTo, page = 1, pageSize = 20 } = options ?? {};
  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (laboratoryId) where.laboratoryId = laboratoryId;
  if (search) {
    where.OR = [
      { quotationNumber: { contains: search, mode: "insensitive" } },
      { title: { contains: search, mode: "insensitive" } },
      { clientReference: { contains: search, mode: "insensitive" } },
    ];
  }
  if (dateFrom || dateTo) {
    const createdAt: Record<string, Date> = {};
    if (dateFrom) createdAt.gte = new Date(dateFrom);
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      createdAt.lte = end;
    }
    where.createdAt = createdAt;
  }
  const [quotations, total] = await Promise.all([
    prisma.quotation.findMany({
      where, orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize, take: pageSize,
      include: {
        laboratory: { select: { id: true, name: true, code: true } },
        _count: { select: { items: true } },
        createdBy: { select: { id: true, name: true } },
        emails: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { id: true, status: true, toEmail: true, sentAt: true, error: true },
        },
      },
    }),
    prisma.quotation.count({ where }),
  ]);
  return { quotations, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } };
}

/** Retrieve a single quotation by its ID with full details. */
export async function getQuotationById(id: string) {
  return prisma.quotation.findUnique({
    where: { id },
    include: {
      laboratory: true,
      items: { orderBy: { position: "asc" } },
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });
}

/**
 * Update quotation status with transition validation.
 * Valid: DRAFT->SENT, DRAFT->CANCELLED, SENT->ACCEPTED/REJECTED/CANCELLED
 */
export async function updateQuotationStatus(
  id: string,
  status: "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED" | "CANCELLED"
) {
  const quotation = await prisma.quotation.findUnique({
    where: { id }, select: { status: true },
  });
  if (!quotation) throw new Error("Devis non trouvé");

  const validTransitions: Record<string, string[]> = {
    DRAFT: ["SENT", "CANCELLED"],
    SENT: ["SENT", "ACCEPTED", "REJECTED", "CANCELLED"],
    ACCEPTED: [], REJECTED: [], CANCELLED: [],
  };
  const allowed = validTransitions[quotation.status] ?? [];
  if (!allowed.includes(status)) {
    throw new Error("Transition invalide: " + quotation.status + " -> " + status);
  }

  return prisma.quotation.update({
    where: { id },
    data: { status, ...(status === "SENT" && { sentAt: new Date() }) },
  });
}
