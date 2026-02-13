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
  clientReference?: string | null;
  notes?: string | null;
  validityDays?: number;
  createdById: string;
}) {
  const { title, laboratoryId, testMappingIds, clientReference, notes,
    validityDays = 30, createdById } = data;

  const quotationNumber = generateQuotationNumber();
  const now = new Date();
  const validUntil = new Date(now);
  validUntil.setDate(validUntil.getDate() + validityDays);

  const labTestMappings = await prisma.labTestMapping.findMany({
    where: { testMappingId: { in: testMappingIds }, laboratoryId },
    include: {
      labTest: { select: { id: true, name: true, price: true, code: true } },
      testMapping: { select: { id: true, referenceTestName: true, referenceTestCode: true } },
    },
  });

  if (labTestMappings.length === 0) {
    throw new Error("Aucun test trouvé pour ce laboratoire");
  }

  const totalPrice = labTestMappings.reduce((sum, m) => sum + m.labTest.price, 0);

  return prisma.$transaction(async (tx) => {
    const quotation = await tx.quotation.create({
      data: {
        quotationNumber, title, laboratoryId,
        clientReference: clientReference ?? null,
        notes: notes ?? null, totalPrice, validUntil,
        status: "DRAFT", createdById,
        items: {
          createMany: {
            data: labTestMappings.map((mapping, index) => ({
              position: index + 1,
              testName: mapping.testMapping.referenceTestName,
              testCode: mapping.testMapping.referenceTestCode,
              labTestName: mapping.labTest.name,
              labTestCode: mapping.labTest.code,
              price: mapping.labTest.price,
              testMappingId: mapping.testMappingId,
              labTestId: mapping.labTestId,
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
  page?: number; pageSize?: number;
}) {
  const { status, laboratoryId, search, page = 1, pageSize = 20 } = options ?? {};
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
  const [quotations, total] = await Promise.all([
    prisma.quotation.findMany({
      where, orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize, take: pageSize,
      include: {
        laboratory: { select: { id: true, name: true, code: true } },
        _count: { select: { items: true } },
        createdBy: { select: { id: true, name: true } },
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
    SENT: ["ACCEPTED", "REJECTED", "CANCELLED"],
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
