import prisma from "@/lib/db";
import { sendEmail, getEmailConfig } from "@/lib/email/config";
import { generateQuotationPdf } from "@/lib/services/pdf.service";
import { getQuotationById } from "@/lib/services/quotation.service";

/**
 * Send a quotation PDF via email using Brevo API.
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

  // Convert to base64 for Brevo attachment
  const pdfBase64 = Buffer.from(pdfBuffer).toString("base64");

  try {
    const result = await sendEmail({
      to: [{ email: to }],
      subject,
      textContent:
        message ||
        `Veuillez trouver ci-joint le devis ${quotation.quotationNumber}.`,
      attachments: [
        {
          name: `Devis-${quotation.quotationNumber}.pdf`,
          content: pdfBase64,
        },
      ],
    });

    // Log success
    await prisma.quotationEmail.create({
      data: {
        quotationId,
        sentById,
        toEmail: to,
        subject,
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
        subject,
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

/** Check if email is configured (env vars present). */
export function isEmailConfigured(): boolean {
  return getEmailConfig() !== null;
}
