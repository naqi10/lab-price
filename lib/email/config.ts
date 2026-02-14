import prisma from "@/lib/db";

/**
 * Email configuration - supports both Brevo HTTP API and SMTP transport.
 *
 * Strategy:
 *   1. If BREVO_API_KEY is set → use Brevo HTTP API
 *   2. If SMTP_HOST is set → use nodemailer SMTP transport (Brevo relay, etc.)
 *
 * SMTP env vars (used by Brevo SMTP relay):
 *   SMTP_HOST       - e.g. smtp-relay.brevo.com
 *   SMTP_PORT       - e.g. 587
 *   SMTP_USER       - Brevo SMTP login
 *   SMTP_PASS       - Brevo SMTP password / key
 *   FROM_EMAIL      - Sender email address
 *   FROM_NAME       - Sender display name (optional)
 *
 * Brevo API env vars:
 *   BREVO_API_KEY   - Brevo API key
 *   EMAIL_FROM      - Sender email address
 *   EMAIL_FROM_NAME - Sender display name (optional)
 */

import nodemailer from "nodemailer";

export interface EmailConfig {
  mode: "api" | "smtp";
  apiKey?: string;
  fromEmail: string;
  fromName: string;
  smtp?: {
    host: string;
    port: number;
    user: string;
    pass: string;
  };
}

export function getEmailConfig(): EmailConfig | null {
  // Strategy 1: Brevo HTTP API
  const apiKey = process.env.BREVO_API_KEY?.trim();
  const apiFromEmail = process.env.EMAIL_FROM?.trim();
  if (apiKey && apiFromEmail) {
    return {
      mode: "api",
      apiKey,
      fromEmail: apiFromEmail,
      fromName: process.env.EMAIL_FROM_NAME?.trim() || "Lab Price Comparator",
    };
  }

  // Strategy 2: SMTP transport
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const fromEmail = process.env.FROM_EMAIL;
  if (smtpHost && smtpUser && smtpPass && fromEmail) {
    return {
      mode: "smtp",
      fromEmail,
      fromName: process.env.FROM_NAME || "Lab Price Comparator",
      smtp: {
        host: smtpHost,
        port: parseInt(smtpPort || "587", 10),
        user: smtpUser,
        pass: smtpPass,
      },
    };
  }

  return null;
}

interface SendEmailParams {
  to: { email: string; name?: string }[];
  subject: string;
  htmlContent?: string;
  textContent?: string;
  attachments?: { name: string; content: string }[];
  /** Source identifier for tracking (e.g. "comparison", "quotation") */
  source?: string;
}

/**
 * Send an email via Brevo HTTP API or SMTP transport.
 * Automatically selects transport based on available env vars.
 * Every email (success or failure) is logged to the email_logs table.
 */
export async function sendEmail(params: SendEmailParams): Promise<{ messageId: string }> {
  const config = getEmailConfig();
  if (!config) {
    throw new Error(
      "Email non configuré. Définissez SMTP_HOST/SMTP_USER/SMTP_PASS/FROM_EMAIL ou BREVO_API_KEY/EMAIL_FROM."
    );
  }

  const toEmail = params.to.map((r) => r.email).join(", ");

  try {
    const result = config.mode === "smtp"
      ? await sendViaSmtp(config, params)
      : await sendViaBrevoApi(config, params);

    // Log successful send
    await logEmail(toEmail, params.subject, "SENT", params.source || "system");

    return result;
  } catch (error) {
    // Log failed send
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    await logEmail(toEmail, params.subject, "FAILED", params.source || "system", errMsg);
    throw error;
  }
}

/** Persist an email log entry (fire-and-forget, never throws). */
async function logEmail(
  toEmail: string, subject: string,
  status: "SENT" | "FAILED" | "PENDING", source: string, error?: string
) {
  try {
    await prisma.emailLog.create({
      data: { toEmail, subject, status, source, error: error || null },
    });
  } catch (e) {
    // Never let logging break email sending
    console.error("[EmailLog] Failed to log email:", e);
  }
}

/** Send email via nodemailer SMTP transport. */
async function sendViaSmtp(
  config: EmailConfig,
  params: SendEmailParams
): Promise<{ messageId: string }> {
  const transporter = nodemailer.createTransport({
    host: config.smtp!.host,
    port: config.smtp!.port,
    secure: config.smtp!.port === 465,
    auth: {
      user: config.smtp!.user,
      pass: config.smtp!.pass,
    },
  });

  const mailOptions: nodemailer.SendMailOptions = {
    from: `"${config.fromName}" <${config.fromEmail}>`,
    to: params.to.map((r) => (r.name ? `"${r.name}" <${r.email}>` : r.email)).join(", "),
    subject: params.subject,
  };

  if (params.htmlContent) mailOptions.html = params.htmlContent;
  if (params.textContent) mailOptions.text = params.textContent;
  if (!params.htmlContent && !params.textContent) {
    mailOptions.text = "(no content)";
  }

  if (params.attachments && params.attachments.length > 0) {
    mailOptions.attachments = params.attachments.map((a) => ({
      filename: a.name,
      content: Buffer.from(a.content, "base64"),
    }));
  }

  const info = await transporter.sendMail(mailOptions);
  return { messageId: info.messageId || "sent" };
}

/** Send email via Brevo HTTP API. */
async function sendViaBrevoApi(
  config: EmailConfig,
  params: SendEmailParams
): Promise<{ messageId: string }> {
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

  const maskedKey = config.apiKey
    ? `${config.apiKey.slice(0, 12)}...${config.apiKey.slice(-6)}`
    : "(empty)";
  console.log(`[Brevo API] Sending email with key: ${maskedKey}, from: ${config.fromEmail}`);

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": config.apiKey!,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    console.error(`[Brevo API] ${response.status} ${response.statusText}:`, errorBody);
    let message = response.statusText;
    try {
      const parsed = JSON.parse(errorBody);
      message = parsed.message || message;
    } catch { /* ignore */ }
    throw new Error(`Brevo API error (${response.status}): ${message}`);
  }

  const result = await response.json();
  return { messageId: result.messageId || result.messageIds?.[0] || "sent" };
}
