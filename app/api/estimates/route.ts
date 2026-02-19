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

    const where: any = {
      createdById: session.user.id,
    };

    if (customerId) {
      where.customerId = customerId;
    }

    const [estimates, total] = await Promise.all([
      prisma.estimate.findMany({
        where,
        include: {
          customer: true,
          createdBy: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.estimate.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        estimates,
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
