import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { compareTestsWithEmail } from "@/lib/services/comparison.service";
import logger from "@/lib/logger";

/**
 * POST /api/comparison/email
 *
 * Compare selected tests, find the cheapest laboratory,
 * automatically create an Estimate record, and send the result by email.
 *
 * Body: { 
 *   testMappingIds: string[], 
 *   clientEmail: string, 
 *   clientName?: string,
 *   customerId?: string,
 *   selections?: Record<string, string>,
 *   customPrices?: Record<string, number>,
 *   validUntil?: string (ISO date)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Non autorisé" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { testMappingIds, clientEmail, clientName, customerId, selections, customPrices, validUntil } = body;

    // ── Validation ─────────────────────────────────────────────────────────
    if (!testMappingIds || !Array.isArray(testMappingIds) || testMappingIds.length === 0) {
      return NextResponse.json(
        { success: false, message: "Au moins un test doit être sélectionné" },
        { status: 400 }
      );
    }

    if (!clientEmail || typeof clientEmail !== "string" || !clientEmail.includes("@")) {
      return NextResponse.json(
        { success: false, message: "Adresse email du client invalide" },
        { status: 400 }
      );
    }

    // ── Service call ───────────────────────────────────────────────────────
    if (!session.user?.id) {
      return NextResponse.json(
        { success: false, message: "Utilisateur non identifié" },
        { status: 401 }
      );
    }

    const result = await compareTestsWithEmail({
      testMappingIds,
      clientEmail,
      clientName: clientName || undefined,
      customerId: customerId || undefined,
      selections: selections || undefined,
      customPrices: customPrices || undefined,
      createdByUserId: session.user.id,
      validUntil: validUntil ? new Date(validUntil) : undefined,
    });

    return NextResponse.json({
      success: true,
      message: `Comparaison envoyée à ${clientEmail}`,
      data: result,
    });
  } catch (error) {
    logger.error({ err: error }, "[POST /api/comparison/email]");
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
