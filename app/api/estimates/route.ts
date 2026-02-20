import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import logger from "@/lib/logger";
import { logAudit } from "@/lib/services/audit.service";
import { z } from "zod";

const createEstimateSchema = z.object({
   testMappingIds: z.array(z.string()),
   selections: z.record(z.string(), z.string()).optional(),
   customPrices: z.record(z.string(), z.number()).default({}),
   totalPrice: z.number(),
   subtotal: z.number().optional(),
   customerId: z.string().optional().nullable(),
   notes: z.string().optional(),
   validUntil: z.string().datetime().optional(),
   selectionMode: z.enum(["CHEAPEST", "FASTEST", "CUSTOM"]).optional().nullable(),
});

type CreateEstimateInput = z.infer<typeof createEstimateSchema>;

// Generate unique estimate number: EST-YYYY-NNNNN
async function generateEstimateNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const lastEstimate = await prisma.estimate.findFirst({
    where: {
      estimateNumber: {
        startsWith: `EST-${year}-`,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  let number = 1;
  if (lastEstimate) {
    const match = lastEstimate.estimateNumber.match(/EST-\d+-(\d+)/);
    if (match) {
      number = parseInt(match[1]) + 1;
    }
  }

  return `EST-${year}-${String(number).padStart(5, "0")}`;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json(
        { success: false, message: "Non autorisé" },
        { status: 401 }
      );

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const customerId = searchParams.get("customerId") || undefined;
    const search = searchParams.get("search")?.trim() || undefined;
    const statusFilter = searchParams.get("status") || undefined;
    const sortParam = searchParams.get("sort") || "createdAt:desc";

    const where: any = {
      createdById: session.user.id,
    };

    if (customerId) {
      where.customerId = customerId;
    }

    if (search) {
      where.OR = [
        { estimateNumber: { contains: search, mode: "insensitive" } },
        { customer: { name: { contains: search, mode: "insensitive" } } },
        { customer: { email: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (statusFilter) {
      const statuses = statusFilter.split(",").map((s) => s.trim()).filter(Boolean);
      if (statuses.length > 0) {
        where.status = { in: statuses };
      }
    }

    // Parse sort param (field:direction)
    const [sortField, sortDir] = sortParam.split(":");
    const allowedSortFields = ["createdAt", "totalPrice", "estimateNumber", "status"];
    const orderBy: any = allowedSortFields.includes(sortField)
      ? { [sortField]: sortDir === "asc" ? "asc" : "desc" }
      : { createdAt: "desc" };

     const [estimates, total] = await Promise.all([
       prisma.estimate.findMany({
         where,
         include: {
          customer: true,
          createdBy: { select: { name: true } },
          _count: { select: { emailLogs: true } },
         },
         orderBy,
         skip: (page - 1) * limit,
         take: limit,
       }),
       prisma.estimate.count({ where }),
     ]);

      // Enhance estimates with test mapping details
      const enhancedEstimates = await Promise.all(
        estimates.map(async (est) => {
          // Parse customPrices if double-serialized
          let parsedCustomPrices = est.customPrices;
          if (typeof parsedCustomPrices === "string") {
            try { parsedCustomPrices = JSON.parse(parsedCustomPrices); } catch { /* keep as-is */ }
          }

          // If testDetails exists, parse it and use that (has all price info)
          if (est.testDetails) {
            try {
              const testDetails = typeof est.testDetails === 'string'
                ? JSON.parse(est.testDetails)
                : est.testDetails;

              // Return with parsed testDetails as testMappingDetails
              return {
                ...est,
                customPrices: parsedCustomPrices,
                testMappingDetails: testDetails,
              };
            } catch (e) {
              // Fall back to fetching from database
            }
          }

          // Fallback: fetch from database with lab codes
          const testMappings = await prisma.testMapping.findMany({
            where: { id: { in: est.testMappingIds } },
            include: {
              entries: {
                include: {
                  laboratory: { select: { id: true, name: true, code: true } },
                },
              },
            },
          });

          return { ...est, customPrices: parsedCustomPrices, testMappingDetails: testMappings };
        })
      );

     return NextResponse.json({
       success: true,
       data: {
         estimates: enhancedEstimates,
         pagination: {
           page,
           limit,
           total,
           pages: Math.ceil(total / limit),
         },
       },
     });
  } catch (error) {
    logger.error({ err: error }, "[GET /api/estimates]");
    return NextResponse.json(
      { success: false, message: "Erreur serveur" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json(
        { success: false, message: "Non autorisé" },
        { status: 401 }
      );

    const body = await request.json();
    const validated = createEstimateSchema.parse(body);

    const estimateNumber = await generateEstimateNumber();

     const estimate = await prisma.estimate.create({
       data: {
         estimateNumber,
         createdById: session.user.id,
         customerId: validated.customerId || null,
         testMappingIds: validated.testMappingIds,
         selections: validated.selections ? validated.selections : undefined,
         customPrices: validated.customPrices,
         totalPrice: validated.totalPrice,
         subtotal: validated.subtotal,
         notes: validated.notes || null,
         validUntil: validated.validUntil
           ? new Date(validated.validUntil)
           : null,
         status: "DRAFT",
         selectionMode: validated.selectionMode || null,
       },
       include: {
         customer: true,
         createdBy: { select: { name: true } },
       },
     });

    logAudit({
      userId: session.user.id,
      action: "CREATE",
      entity: "estimate",
      entityId: estimate.id,
      details: {
        estimateNumber: estimate.estimateNumber,
        totalPrice: estimate.totalPrice,
      },
    });

    return NextResponse.json({ success: true, data: estimate }, { status: 201 });
  } catch (error) {
    logger.error({ err: error }, "[POST /api/estimates]");
    const message =
      error instanceof Error
        ? error.message
        : "Erreur lors de la création";
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
