import prisma from "@/lib/db";
import { sendEmail, getEmailConfig } from "@/lib/email/config";
import { generateQuotationPdf } from "@/lib/services/pdf.service";
import { getQuotationById } from "@/lib/services/quotation.service";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  renderTemplate,
  renderSubject,
  getRawHtmlVariableNames,
  getVariablesForType,
  type TemplateVariables,
} from "@/lib/email/template-renderer";

/**
 * Fetch the default EmailTemplate for a given type from the DB.
 * Returns null when no default template has been configured.
 */
async function getDefaultTemplate(type: "QUOTATION" | "COMPARISON" | "GENERAL") {
  return prisma.emailTemplate.findFirst({
    where: { type, isDefault: true },
  });
}

/**
 * Send a quotation PDF via email.
 *
 * When a default QUOTATION email template exists in the database it is
 * rendered with the quotation's variables (number, client, lab, total, etc.)
 * and sent as HTML.  Otherwise a plain-text fallback is used.
 */
export async function sendQuotationEmail(data: {
  quotationId: string;
  to: string;
  subject: string;
  message?: string;
  sentById: string;
}) {
  const { quotationId, to, subject, message, sentById } = data;

  const quotation = await getQuotationById(quotationId);
  if (!quotation) throw new Error("Devis non trouvé");

  // Generate PDF buffer
  const pdfBuffer = await generateQuotationPdf(quotation);
  const pdfBase64 = Buffer.from(pdfBuffer).toString("base64");

  // Fetch DB template + email settings in parallel
  const [template, emailConfig] = await Promise.all([
    getDefaultTemplate("QUOTATION"),
    getEmailConfig(),
  ]);

  let htmlContent: string | undefined;
  let textContent: string | undefined;
  let resolvedSubject = subject;

  if (template) {
    const variables: TemplateVariables = {
      quotationNumber: quotation.quotationNumber,
      title: quotation.title,
      clientName: quotation.clientName || undefined,
      clientEmail: quotation.clientEmail || undefined,
      laboratoryName: quotation.laboratory?.name || undefined,
      totalPrice: formatCurrency(quotation.totalPrice),
      validUntil: formatDate(quotation.validUntil),
      itemCount: String(quotation.items?.length ?? 0),
      customMessage: message || "",
      companyLogoUrl: emailConfig?.companyLogoUrl || undefined,
      signatureHtml: emailConfig?.signatureHtml || undefined,
    };

    const rawHtmlVars = getRawHtmlVariableNames(getVariablesForType("QUOTATION"));

    htmlContent = renderTemplate(template.htmlBody, variables, {
      missingStrategy: "remove",
      rawHtmlVariables: rawHtmlVars,
    });

    // Use the caller-provided subject; only fall back to the template subject
    // when no explicit subject was given.
    if (!subject) {
      resolvedSubject = renderSubject(template.subject, variables, "remove");
    }
  } else {
    // No DB template – plain-text fallback
    textContent =
      message ||
      `Veuillez trouver ci-joint le devis ${quotation.quotationNumber}.`;
  }

  try {
    const result = await sendEmail({
      to: [{ email: to }],
      subject: resolvedSubject,
      htmlContent,
      textContent,
      attachments: [
        {
          name: `Devis-${quotation.quotationNumber}.pdf`,
          content: pdfBase64,
        },
      ],
      source: "quotation",
    });

    // Log success
    await prisma.quotationEmail.create({
      data: {
        quotationId,
        sentById,
        toEmail: to,
        subject: resolvedSubject,
        message: message || null,
        status: "SENT",
        sentAt: new Date(),
      },
    });

    return { success: true, messageId: result.messageId };
  } catch (error) {
    // Log failure
    await prisma.quotationEmail.create({
      data: {
        quotationId,
        sentById,
        toEmail: to,
        subject: resolvedSubject,
        message: message || null,
        status: "FAILED",
        error: error instanceof Error ? error.message : "Erreur inconnue",
      },
    });

    throw new Error(
      "Échec de l'envoi: " +
        (error instanceof Error ? error.message : "Erreur inconnue")
    );
  }
}

/** Check if email is configured (DB settings or env vars present). */
export async function isEmailConfigured(): Promise<boolean> {
  return (await getEmailConfig()) !== null;
}
