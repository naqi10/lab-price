import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getEmailConfig } from "@/lib/email/config";

/**
 * GET /api/settings/email-status
 *
 * Returns the current email configuration status (without exposing secrets).
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ success: false, message: "Non autorisé" }, { status: 401 });
    }

    const config = getEmailConfig();

    return NextResponse.json({
      success: true,
      data: {
        configured: !!config,
        mode: config?.mode || null,
        fromEmail: config?.fromEmail || null,
      },
    });
  } catch (error) {
    console.error("[GET /api/settings/email-status]", error);
    return NextResponse.json({ success: false, message: "Erreur serveur" }, { status: 500 });
  }
}
