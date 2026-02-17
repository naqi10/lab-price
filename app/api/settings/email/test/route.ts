import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sendEmail } from "@/lib/email/config";
import { testEmailSchema } from "@/lib/validations/email-settings";
import logger from "@/lib/logger";

/**
 * POST /api/settings/email/test
 *
 * Send a test email to verify the current email configuration.
 * Requires ADMIN role. The active config (DB or env) is resolved
 * automatically by `sendEmail()`.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Non autorisé" },
        { status: 401 },
      );
    }

    if ((session.user as any).role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Accès réservé aux administrateurs" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const parsed = testEmailSchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.flatten();
      return NextResponse.json(
        {
          success: false,
          message: "Données invalides",
          errors: errors.fieldErrors,
        },
        { status: 400 },
      );
    }

    const { to } = parsed.data;

    await sendEmail({
      to: [{ email: to }],
      subject: "Test de configuration email — Lab Price Comparator",
      htmlContent: buildTestEmailHtml(),
      textContent:
        "Ceci est un email de test envoyé depuis Lab Price Comparator. " +
        "Si vous recevez ce message, votre configuration email fonctionne correctement.",
      source: "test",
    });

    return NextResponse.json({
      success: true,
      message: `Email de test envoyé à ${to}`,
    });
  } catch (error) {
    logger.error({ err: error }, "[POST /api/settings/email/test]");
    const message =
      error instanceof Error ? error.message : "Erreur lors de l'envoi";
    return NextResponse.json(
      { success: false, message },
      { status: 500 },
    );
  }
}

/**
 * Build a simple HTML body for the test email.
 */
function buildTestEmailHtml(): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8" /></head>
<body style="font-family: Arial, Helvetica, sans-serif; background-color: #f4f4f5; padding: 40px 0;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" role="presentation"
               style="background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <tr>
            <td style="background-color: #2563eb; padding: 24px 32px;">
              <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 600;">
                Lab Price Comparator
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">
              <h2 style="margin: 0 0 16px; color: #18181b; font-size: 18px;">
                ✅ Configuration email réussie
              </h2>
              <p style="margin: 0 0 12px; color: #3f3f46; font-size: 14px; line-height: 1.6;">
                Ceci est un email de test envoyé depuis <strong>Lab Price Comparator</strong>.
              </p>
              <p style="margin: 0 0 12px; color: #3f3f46; font-size: 14px; line-height: 1.6;">
                Si vous recevez ce message, votre configuration email fonctionne correctement.
                Vous pouvez maintenant envoyer des devis et des comparaisons par email.
              </p>
              <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;" />
              <p style="margin: 0; color: #71717a; font-size: 12px;">
                Cet email a été envoyé automatiquement depuis la page des paramètres.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}
