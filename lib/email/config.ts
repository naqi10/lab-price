/**
 * Email configuration - reads exclusively from environment variables.
 * Supports Brevo (Sendinblue) HTTP API for reliable email delivery.
 *
 * Required env vars:
 *   BREVO_API_KEY    - Brevo API key (from https://app.brevo.com/settings/keys/api)
 *   EMAIL_FROM       - Sender email address
 *   EMAIL_FROM_NAME  - Sender display name (optional, defaults to "Lab Price Comparator")
 */

export interface EmailConfig {
  apiKey: string;
  fromEmail: string;
  fromName: string;
}

export function getEmailConfig(): EmailConfig | null {
  const apiKey = process.env.BREVO_API_KEY;
  const fromEmail = process.env.EMAIL_FROM;

  if (!apiKey || !fromEmail) return null;

  return {
    apiKey,
    fromEmail,
    fromName: process.env.EMAIL_FROM_NAME || "Lab Price Comparator",
  };
}

interface SendEmailParams {
  to: { email: string; name?: string }[];
  subject: string;
  htmlContent?: string;
  textContent?: string;
  attachments?: { name: string; content: string }[];
}

/**
 * Send an email via Brevo HTTP API.
 * Attachments must be base64-encoded.
 */
export async function sendEmail(params: SendEmailParams): Promise<{ messageId: string }> {
  const config = getEmailConfig();
  if (!config) {
    throw new Error(
      "Email non configuré. Définissez BREVO_API_KEY et EMAIL_FROM dans les variables d'environnement."
    );
  }

  const body: Record<string, unknown> = {
    sender: { email: config.fromEmail, name: config.fromName },
    to: params.to,
    subject: params.subject,
  };

  if (params.htmlContent) body.htmlContent = params.htmlContent;
  if (params.textContent) body.textContent = params.textContent;
  if (!params.htmlContent && !params.textContent) {
    body.textContent = "(no content)";
  }

  if (params.attachments && params.attachments.length > 0) {
    body.attachment = params.attachments.map((a) => ({
      name: a.name,
      content: a.content,
    }));
  }

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": config.apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(`Brevo API error: ${error.message || response.statusText}`);
  }

  const result = await response.json();
  return { messageId: result.messageId || result.messageIds?.[0] || "sent" };
}
