import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { emailTemplateCreateSchema } from "@/lib/validations/email-template";
import logger from "@/lib/logger";
import { logAudit } from "@/lib/services/audit.service";

/**
 * GET /api/settings/email-templates
 *
 * List email templates, ordered by type then name.
 * Any authenticated user can read templates (needed by email dialogs).
 * Supports optional `?type=QUOTATION` query filter.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Non autorisé" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const typeFilter = searchParams.get("type");

    const where: Record<string, unknown> = {};
    if (
      typeFilter &&
      ["QUOTATION", "COMPARISON", "GENERAL"].includes(typeFilter)
    ) {
      where.type = typeFilter;
    }

    const templates = await prisma.emailTemplate.findMany({
      where,
      orderBy: [{ type: "asc" }, { isDefault: "desc" }, { name: "asc" }],
    });

    return NextResponse.json({ success: true, data: templates });
  } catch (error) {
    logger.error({ err: error }, "[GET /api/settings/email-templates]");
    return NextResponse.json(
      { success: false, message: "Erreur serveur" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/settings/email-templates
 *
 * Create a new email template.
 * If `isDefault` is true, any existing default template of the same type
 * is demoted so only one default exists per type.
 * Requires ADMIN role.
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
    const parsed = emailTemplateCreateSchema.safeParse(body);

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

    const { type, name, subject, htmlBody, isDefault, variables } = parsed.data;

    // If this template is set as default, demote any existing default of the same type
    if (isDefault) {
      await prisma.emailTemplate.updateMany({
        where: { type, isDefault: true },
        data: { isDefault: false },
      });
    }

    const template = await prisma.emailTemplate.create({
      data: {
        type,
        name,
        subject,
        htmlBody,
        isDefault: isDefault ?? false,
        variables: variables ?? undefined,
      },
    });

    logAudit({ userId: session.user!.id!, action: "CREATE", entity: "email_template", entityId: template.id, details: { name: template.name } });

    return NextResponse.json(
      { success: true, data: template },
      { status: 201 },
    );
  } catch (error) {
    logger.error({ err: error }, "[POST /api/settings/email-templates]");
    const message =
      error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json(
      { success: false, message },
      { status: 500 },
    );
  }
}
