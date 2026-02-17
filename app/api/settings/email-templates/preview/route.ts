import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { emailTemplatePreviewSchema } from "@/lib/validations/email-template";
import logger from "@/lib/logger";
import {
  renderTemplate,
  renderSubject,
  getVariablesForType,
  buildSampleVariables,
  getRawHtmlVariableNames,
  type TemplateVariableDescriptor,
  type TemplateVariables,
} from "@/lib/email/template-renderer";

/**
 * POST /api/settings/email-templates/preview
 *
 * Render an email template with variables and return the resulting HTML.
 * Supports two modes:
 *   1. `templateId` — load template from DB, render with supplied (or sample) variables
 *   2. `htmlBody` — render an inline template string (for live editor preview)
 *
 * Returns `{ success, data: { subject, html } }`.
 * Requires authenticated user (any role).
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

    const body = await request.json();
    const parsed = emailTemplatePreviewSchema.safeParse(body);

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

    const { templateId, htmlBody, subject, type, variables } = parsed.data;

    let templateHtml: string;
    let templateSubject: string;
    let templateType: "QUOTATION" | "COMPARISON" | "GENERAL";
    let descriptors: TemplateVariableDescriptor[];

    if (templateId) {
      // Load template from DB
      const template = await prisma.emailTemplate.findUnique({
        where: { id: templateId },
      });

      if (!template) {
        return NextResponse.json(
          { success: false, message: "Template non trouvé" },
          { status: 404 },
        );
      }

      templateHtml = template.htmlBody;
      templateSubject = subject ?? template.subject;
      templateType = template.type;

      // Use stored variable descriptors if available, otherwise use defaults for the type
      if (
        template.variables &&
        Array.isArray(template.variables) &&
        template.variables.length > 0
      ) {
        descriptors = template.variables as unknown as TemplateVariableDescriptor[];
      } else {
        descriptors = getVariablesForType(template.type);
      }
    } else {
      // Inline template mode (live editor preview)
      templateHtml = htmlBody!;
      templateSubject = subject ?? "";
      templateType = type ?? "GENERAL";
      descriptors = getVariablesForType(templateType);
    }

    // Build the variables to use: merge sample values with any user-supplied overrides
    const sampleVars = buildSampleVariables(descriptors);
    const mergedVars: TemplateVariables = {
      ...sampleVars,
      ...(variables ?? {}),
    };

    // Determine which variables are raw HTML
    const rawHtmlNames = getRawHtmlVariableNames(descriptors);

    // Render
    const renderedHtml = renderTemplate(templateHtml, mergedVars, {
      missingStrategy: "keep",
      rawHtmlVariables: rawHtmlNames,
    });

    const renderedSubject = renderSubject(templateSubject, mergedVars, "keep");

    return NextResponse.json({
      success: true,
      data: {
        subject: renderedSubject,
        html: renderedHtml,
      },
    });
  } catch (error) {
    logger.error({ err: error }, "[POST /api/settings/email-templates/preview]");
    const message =
      error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json(
      { success: false, message },
      { status: 500 },
    );
  }
}
