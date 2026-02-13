import prisma from "@/lib/db";
import { createTransporter } from "@/lib/email/config";
import { generateQuotationPdf } from "@/lib/services/pdf.service";
import { getQuotationById } from "@/lib/services/quotation.service";

/**
 * Send a quotation PDF via email.
 * @param data - Email sending parameters
 * @returns Send result with message ID
 */
export async function sendQuotationEmail(data: {
  quotationId: string;
  to: string[];
  cc?: string[];
  subject: string;
  message?: string;
}) {
  const { quotationId, to, cc = [], subject, message = "" } = data;

  const quotation = await getQuotationById(quotationId);
  if (!quotation) throw new Error("Devis non trouvé");

  const pdfBuffer = await generateQuotationPdf({
    quotationNumber: quotation.quotationNumber,
    title: quotation.title,
    createdAt: quotation.createdAt,
    validUntil: quotation.validUntil,
    clientReference: quotation.clientReference,
    notes: quotation.notes,
    totalPrice: quotation.totalPrice,
    laboratory: quotation.laboratory,
    items: quotation.items,
    createdBy: quotation.createdBy,
  });

  const emailConfig = await getEmailConfig();
  if (!emailConfig) {
    throw new Error("Configuration email non définie. Configurez les paramètres SMTP.");
  }

  const transporter = createTransporter(emailConfig);
  const mailOptions = {
    from: emailConfig.fromAddress,
    to: to.join(", "),
    cc: cc.length > 0 ? cc.join(", ") : undefined,
    subject,
    text: message || "Veuillez trouver ci-joint le devis " + quotation.quotationNumber + ".",
    attachments: [{
      filename: "Devis-" + quotation.quotationNumber + ".pdf",
      content: pdfBuffer,
      contentType: "application/pdf",
    }],
  };

  try {
    const result = await transporter.sendMail(mailOptions);
    await prisma.emailLog.create({
      data: {
        quotationId, recipients: to, ccRecipients: cc,
        subject, status: "SENT", messageId: result.messageId, sentAt: new Date(),
      },
    });
    return { success: true, messageId: result.messageId };
  } catch (error) {
    await prisma.emailLog.create({
      data: {
        quotationId, recipients: to, ccRecipients: cc,
        subject, status: "FAILED",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        sentAt: new Date(),
      },
    });
    throw new Error("Échec de l'envoi: " + (error instanceof Error ? error.message : "Erreur inconnue"));
  }
}

/** Retrieve the current email configuration. */
export async function getEmailConfig() {
  return prisma.emailConfig.findFirst({
    where: { isActive: true },
    orderBy: { updatedAt: "desc" },
  });
}

/** Create or update the email configuration. */
export async function updateEmailConfig(config: {
  host: string; port: number; secure: boolean;
  username: string; password: string;
  fromAddress: string; fromName?: string;
}) {
  await prisma.emailConfig.updateMany({
    where: { isActive: true }, data: { isActive: false },
  });
  return prisma.emailConfig.create({
    data: {
      host: config.host, port: config.port, secure: config.secure,
      username: config.username, password: config.password,
      fromAddress: config.fromAddress,
      fromName: config.fromName ?? "Lab Price Comparator",
      isActive: true,
    },
  });
}

/**
 * Retry sending failed emails.
 * @param options.maxRetries - Maximum number of retries (default: 3)
 * @returns Summary of retry results
 */
export async function retryFailedEmails(options?: { maxRetries?: number }) {
  const { maxRetries = 3 } = options ?? {};
  const failedEmails = await prisma.emailLog.findMany({
    where: { status: "FAILED", retryCount: { lt: maxRetries } },
    include: { quotation: { select: { id: true, quotationNumber: true } } },
    orderBy: { sentAt: "asc" },
  });

  const results = { total: failedEmails.length, succeeded: 0, failed: 0,
    errors: [] as Array<{ emailLogId: string; error: string }> };

  for (const emailLog of failedEmails) {
    try {
      await sendQuotationEmail({
        quotationId: emailLog.quotationId,
        to: emailLog.recipients, cc: emailLog.ccRecipients ?? [],
        subject: emailLog.subject,
      });
      await prisma.emailLog.update({
        where: { id: emailLog.id },
        data: { status: "SENT", retryCount: { increment: 1 }, errorMessage: null },
      });
      results.succeeded++;
    } catch (error) {
      await prisma.emailLog.update({
        where: { id: emailLog.id },
        data: { retryCount: { increment: 1 },
          errorMessage: error instanceof Error ? error.message : "Unknown error" },
      });
      results.failed++;
      results.errors.push({
        emailLogId: emailLog.id,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
  return results;
}
