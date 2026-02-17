import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { emailTemplateUpdateSchema } from "@/lib/validations/email-template";
import logger from "@/lib/logger";
import { logAudit } from "@/lib/services/audit.service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/settings/email-templates/[id]
 *
 * Retrieve a single email template by ID.
 * Requires ADMIN role.
 */
export async function GET(
  _request: NextRequest,
  context: RouteContext,
) {
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

    const { id } = await context.params;

    const template = await prisma.emailTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      return NextResponse.json(
        { success: false, message: "Template non trouvé" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: template });
  } catch (error) {
    logger.error({ err: error }, "[GET /api/settings/email-templates/[id]]");
    return NextResponse.json(
      { success: false, message: "Erreur serveur" },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/settings/email-templates/[id]
 *
 * Update an existing email template.
 * If `isDefault` is set to true, any other default template of the same
 * type is demoted so only one default exists per type.
 * Requires ADMIN role.
 */
export async function PUT(
  request: NextRequest,
  context: RouteContext,
) {
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

    const { id } = await context.params;

    const existing = await prisma.emailTemplate.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Template non trouvé" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const parsed = emailTemplateUpdateSchema.safeParse(body);

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

    // Determine the effective type (updated or existing)
    const effectiveType = type ?? existing.type;

    // If setting as default, demote other defaults of the same type
    if (isDefault === true) {
      await prisma.emailTemplate.updateMany({
        where: {
          type: effectiveType,
          isDefault: true,
          id: { not: id },
        },
        data: { isDefault: false },
      });
    }

    // Build update payload — only include fields that were actually sent
    const updateData: Record<string, unknown> = {};
    if (type !== undefined) updateData.type = type;
    if (name !== undefined) updateData.name = name;
    if (subject !== undefined) updateData.subject = subject;
    if (htmlBody !== undefined) updateData.htmlBody = htmlBody;
    if (isDefault !== undefined) updateData.isDefault = isDefault;
    if (variables !== undefined) updateData.variables = variables;

    const template = await prisma.emailTemplate.update({
      where: { id },
      data: updateData,
    });

    logAudit({ userId: session.user!.id!, action: "UPDATE", entity: "email_template", entityId: id, details: { name: body.name } });

    return NextResponse.json({ success: true, data: template });
  } catch (error) {
    logger.error({ err: error }, "[PUT /api/settings/email-templates/[id]]");
    const message =
      error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json(
      { success: false, message },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/settings/email-templates/[id]
 *
 * Delete an email template. Default templates cannot be deleted
 * unless they are the only template of their type (safety net).
 * Requires ADMIN role.
 */
export async function DELETE(
  _request: NextRequest,
  context: RouteContext,
) {
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

    const { id } = await context.params;

    const existing = await prisma.emailTemplate.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Template non trouvé" },
        { status: 404 },
      );
    }

    // Prevent deleting a default template if others of the same type exist
    if (existing.isDefault) {
      const othersCount = await prisma.emailTemplate.count({
        where: { type: existing.type, id: { not: id } },
      });

      if (othersCount > 0) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Impossible de supprimer le template par défaut. " +
              "Définissez d'abord un autre template comme défaut pour ce type.",
          },
          { status: 400 },
        );
      }
    }

    await prisma.emailTemplate.delete({ where: { id } });

    logAudit({ userId: session.user!.id!, action: "DELETE", entity: "email_template", entityId: id });

    return NextResponse.json({
      success: true,
      message: "Template supprimé",
    });
  } catch (error) {
    logger.error({ err: error }, "[DELETE /api/settings/email-templates/[id]]");
    const message =
      error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json(
      { success: false, message },
      { status: 500 },
    );
  }
}
