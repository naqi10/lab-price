import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { compareTestsWithEmail } from "@/lib/services/comparison.service";

/**
 * POST /api/comparison/email
 *
 * Compare selected tests, find the cheapest laboratory,
 * and automatically send the result to the client by email.
 *
 * Body: { testMappingIds: string[], clientEmail: string, clientName?: string }
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
    const { testMappingIds, clientEmail, clientName } = body;

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
    const result = await compareTestsWithEmail({
      testMappingIds,
      clientEmail,
      clientName: clientName || undefined,
    });

    return NextResponse.json({
      success: true,
      message: `Comparaison envoyée à ${clientEmail}`,
      data: result,
    });
  } catch (error) {
    console.error("[POST /api/comparison/email]", error);
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
