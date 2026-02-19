import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import logger from "@/lib/logger";

/**
 * GET /api/dashboard
 *
 * Returns all dashboard statistics in a single request:
 *   - Total laboratories, tests, manual mappings, active users
 *   - Last price list update per laboratory
 *   - Email delivery statistics (sent, failed)
 *   - Recent activity log (last 10)
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Non autorisé" },
        { status: 401 }
      );
    }

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

     const [
       totalLaboratories,
       totalTests,
       totalMappings,
       totalUsers,
       totalCustomers,
       labPriceListUpdates,
       // Centralized email_logs (new — tracks all emails)
       emailLogSent,
       emailLogFailed,
       emailLogPending,
       recentActivity,
       recentCustomers,
       recentMappings,
     ] = await Promise.all([
      // Total active laboratories
      prisma.laboratory.count({ where: { isActive: true, deletedAt: null } }),

      // Total tests in system
      prisma.test.count(),

      // Number of manual test mappings (MANUAL match type)
      prisma.testMappingEntry.count({ where: { matchType: "MANUAL" } }),

      // Number of active users
      prisma.user.count(),

      // Total customers
      prisma.customer.count(),

       // Last price list update per laboratory
       prisma.laboratory.findMany({
         where: { isActive: true, deletedAt: null },
         select: {
           id: true,
           name: true,
           code: true,
           priceLists: {
             orderBy: { uploadedAt: "desc" },
             take: 1,
             select: {
               fileName: true,
               uploadedAt: true,
               fileType: true,
             },
           },
         },
         orderBy: { name: "asc" },
       }),

       // Email delivery stats — centralized email_logs table
       prisma.emailLog.count({ where: { status: "SENT" } }),
       prisma.emailLog.count({ where: { status: "FAILED" } }),
       prisma.emailLog.count({ where: { status: "PENDING" } }),

      // Recent activity log (last 10)
      prisma.auditLog.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          action: true,
          entity: true,
          entityId: true,
          details: true,
          createdAt: true,
          user: { select: { name: true } },
        },
      }),

      // Recent customers (last 5)
      prisma.customer.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          company: true,
          createdAt: true,
        },
      }),

      // Recently created test mappings (last 10)
      prisma.testMapping.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          canonicalName: true,
          category: true,
          createdAt: true,
          _count: { select: { entries: true } },
        },
      }),
    ]);

     // Combine counts from both tables
     const sent = emailLogSent;
     const failed = emailLogFailed;
     const pending = emailLogPending;

    // Format lab price list updates
    const priceListUpdates = labPriceListUpdates.map((lab) => ({
      labId: lab.id,
      labName: lab.name,
      labCode: lab.code,
      lastUpdate: lab.priceLists[0]?.uploadedAt || null,
      lastFileName: lab.priceLists[0]?.fileName || null,
      lastFileType: lab.priceLists[0]?.fileType || null,
    }));

    // Count labs with stale (>90 days) or missing price lists
    const stalePriceListCount = priceListUpdates.filter(
      (u) => !u.lastUpdate || new Date(u.lastUpdate) < ninetyDaysAgo
    ).length;

    return NextResponse.json({
      success: true,
      data: {
       stats: {
         totalLaboratories,
         totalTests,
         totalMappings,
         totalUsers,
         totalCustomers,
         stalePriceListCount,
       },
       priceListUpdates,
       emailStats: {
         sent,
         failed,
         pending,
         total: sent + failed + pending,
       },
       recentActivity,
       recentCustomers,
       recentMappings,
      },
    });
  } catch (error) {
    logger.error({ err: error }, "[GET /api/dashboard]");
    return NextResponse.json(
      { success: false, message: "Erreur serveur" },
      { status: 500 }
    );
  }
}
