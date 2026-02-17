import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { emailSettingsSchema } from "@/lib/validations/email-settings";
import { invalidateEmailConfigCache } from "@/lib/email/config";
import logger from "@/lib/logger";
import { logAudit } from "@/lib/services/audit.service";

/**
 * GET /api/settings/email
 *
 * Retrieve the current email configuration (singleton row from EmailSettings).
 * Falls back to a default object when no DB row exists.
 * Sensitive fields (smtpPass, apiKey) are masked in the response.
 * Also includes a `configSource` field so the UI can display where
 * the active config comes from (database vs environment variables).
 */
export async function GET() {
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

    const settings = await prisma.emailSettings.findFirst();

    if (!settings) {
      // Return defaults derived from env vars so the UI can show something
      const hasEnvSmtp = !!(
        process.env.SMTP_HOST &&
        process.env.SMTP_USER &&
        process.env.SMTP_PASS &&
        process.env.FROM_EMAIL
      );
      const hasEnvApi = !!(
        process.env.BREVO_API_KEY &&
        process.env.EMAIL_FROM
      );

      return NextResponse.json({
        success: true,
        data: {
          id: null,
          mode: hasEnvApi ? "API" : "SMTP",
          smtpHost: process.env.SMTP_HOST || null,
          smtpPort: process.env.SMTP_PORT
            ? parseInt(process.env.SMTP_PORT, 10)
            : 587,
          smtpUser: process.env.SMTP_USER || null,
          smtpPass: process.env.SMTP_PASS ? "••••••••" : null,
          apiKey: process.env.BREVO_API_KEY ? "••••••••" : null,
          fromEmail:
            process.env.FROM_EMAIL ||
            process.env.EMAIL_FROM ||
            null,
          fromName:
            process.env.FROM_NAME ||
            process.env.EMAIL_FROM_NAME ||
            null,
          companyLogoUrl: null,
          signatureHtml: null,
          configSource: hasEnvSmtp || hasEnvApi ? "env" : "none",
          updatedAt: null,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        ...settings,
        // Mask sensitive fields
        smtpPass: settings.smtpPass ? "••••••••" : null,
        apiKey: settings.apiKey ? "••••••••" : null,
        configSource: "database",
      },
    });
  } catch (error) {
    logger.error({ err: error }, "[GET /api/settings/email]");
    return NextResponse.json(
      { success: false, message: "Erreur serveur" },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/settings/email
 *
 * Create or update the EmailSettings singleton.
 * If a masked value ("••••••••") is sent for smtpPass or apiKey,
 * the existing DB value is preserved (allows saving other fields
 * without re-entering secrets every time).
 */
export async function PUT(request: NextRequest) {
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

    // Preserve existing secrets when masked placeholder is sent
    const MASK = "••••••••";
    const existing = await prisma.emailSettings.findFirst();

    if (body.smtpPass === MASK) {
      body.smtpPass = existing?.smtpPass || null;
    }
    if (body.apiKey === MASK) {
      body.apiKey = existing?.apiKey || null;
    }

    // Validate after secret restoration
    const parsed = emailSettingsSchema.safeParse(body);
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

    const data = {
      mode: parsed.data.mode,
      smtpHost: parsed.data.smtpHost || null,
      smtpPort: parsed.data.smtpPort || null,
      smtpUser: parsed.data.smtpUser || null,
      smtpPass: parsed.data.smtpPass || null,
      apiKey: parsed.data.apiKey || null,
      fromEmail: parsed.data.fromEmail || null,
      fromName: parsed.data.fromName || null,
      companyLogoUrl: parsed.data.companyLogoUrl || null,
      signatureHtml: parsed.data.signatureHtml || null,
    };

    let settings;

    if (existing) {
      settings = await prisma.emailSettings.update({
        where: { id: existing.id },
        data,
      });
    } else {
      settings = await prisma.emailSettings.create({ data });
    }

    // Invalidate the in-memory cache so subsequent sends use the new config
    invalidateEmailConfigCache();

    logAudit({ userId: session.user!.id!, action: "UPDATE", entity: "email_settings", entityId: settings.id, details: { mode: data.mode } });

    return NextResponse.json({
      success: true,
      data: {
        ...settings,
        smtpPass: settings.smtpPass ? "••••••••" : null,
        apiKey: settings.apiKey ? "••••••••" : null,
        configSource: "database",
      },
    });
  } catch (error) {
    logger.error({ err: error }, "[PUT /api/settings/email]");
    const message =
      error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json(
      { success: false, message },
      { status: 500 },
    );
  }
}
