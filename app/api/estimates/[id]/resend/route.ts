import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import logger from "@/lib/logger";
import prisma from "@/lib/db";

/**
 * POST /api/estimates/[id]/resend
 * 
 * Resend an estimate to multiple customers by creating EstimateEmail records.
 * 
 * Body: { customerIds: string[] }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ success: false, message: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { customerIds } = body as { customerIds: string[] };

    if (!customerIds || !Array.isArray(customerIds) || customerIds.length === 0) {
      return NextResponse.json(
        { success: false, message: "customerIds is required and must be a non-empty array" },
        { status: 400 }
      );
    }

    // Fetch the estimate
    const estimate = await prisma.estimate.findUnique({
      where: { id },
      include: {
        customer: true,
        createdBy: true,
      },
    });

    if (!estimate) {
      return NextResponse.json(
        { success: false, message: "Estimate not found" },
        { status: 404 }
      );
    }

    // Fetch customers
    const customers = await prisma.customer.findMany({
      where: { id: { in: customerIds } },
    });

    if (customers.length === 0) {
      return NextResponse.json(
        { success: false, message: "No customers found" },
        { status: 404 }
      );
    }

    // Create EstimateEmail records (in real scenario, would generate PDF and send email)
    // For now, just create the EstimateEmail records to track the resend intent
    const emailIds: string[] = [];
    const errors: string[] = [];

    for (const customer of customers) {
      try {
        // Create EstimateEmail record (this would be followed by actual email send in production)
         const estimateEmail = await prisma.estimateEmail.create({
          data: {
            estimateId: estimate.id,
            sentById: session.user?.id || estimate.createdById,
            toEmail: customer.email,
            subject: `Estimation ${estimate.estimateNumber}`,
            status: "SENT",
            message: null,
            error: null,
            sentAt: new Date(),
          },
        });

        emailIds.push(estimateEmail.id);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Unknown error";
        errors.push(`Failed to create email record for ${customer.email}: ${errorMsg}`);
        logger.error(
          { err: error },
          `[POST /api/estimates/:id/resend] Failed to create email record for ${customer.email}`
        );
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        estimateId: estimate.id,
        sentCount: emailIds.length,
        emailIds,
        errors: errors.length > 0 ? errors : undefined,
      },
    });
  } catch (error) {
    logger.error({ err: error }, "[POST /api/estimates/:id/resend]");
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
