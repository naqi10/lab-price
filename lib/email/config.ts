import prisma from "@/lib/db";

/**
 * Email configuration - supports both Brevo HTTP API and SMTP transport.
 *
 * Config resolution order:
 *   1. EmailSettings DB table (singleton row) — takes priority
 *   2. Environment variables — fallback when no DB row exists
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
  companyLogoUrl?: string;
  signatureHtml?: string;
  /** Where the active configuration was loaded from */
  configSource: "database" | "env";
}

// ---------------------------------------------------------------------------
// DB settings cache (short TTL to avoid repeated queries within a burst of
// emails while still picking up changes quickly)
// ---------------------------------------------------------------------------
let _dbSettingsCache: {
  data: Awaited<ReturnType<typeof prisma.emailSettings.findFirst>>;
  fetchedAt: number;
} | null = null;
const DB_CACHE_TTL_MS = 30_000; // 30 seconds

async function getDbEmailSettings() {
  const now = Date.now();
  if (_dbSettingsCache && now - _dbSettingsCache.fetchedAt < DB_CACHE_TTL_MS) {
    return _dbSettingsCache.data;
  }

  try {
    const settings = await prisma.emailSettings.findFirst();
    _dbSettingsCache = { data: settings, fetchedAt: now };
    return settings;
  } catch (e) {
    console.error("[EmailConfig] Failed to read DB settings, falling back to env:", e);
    return null;
  }
}

/** Invalidate the cached DB settings (call after updating EmailSettings). */
export function invalidateEmailConfigCache() {
  _dbSettingsCache = null;
}

// ---------------------------------------------------------------------------
// Build EmailConfig from DB row
// ---------------------------------------------------------------------------
function buildConfigFromDb(
  db: NonNullable<Awaited<ReturnType<typeof prisma.emailSettings.findFirst>>>
): EmailConfig | null {
  const mode = db.mode === "API" ? "api" : "smtp";

  if (mode === "api") {
    const apiKey = db.apiKey || process.env.BREVO_API_KEY?.trim();
    const fromEmail = db.fromEmail || process.env.EMAIL_FROM?.trim();
    if (!apiKey || !fromEmail) return null;
    return {
      mode: "api",
      apiKey,
      fromEmail,
      fromName: db.fromName || process.env.EMAIL_FROM_NAME?.trim() || "Lab Price Comparator",
      companyLogoUrl: db.companyLogoUrl || undefined,
      signatureHtml: db.signatureHtml || undefined,
      configSource: "database",
    };
  }

  // SMTP mode
  const host = db.smtpHost || process.env.SMTP_HOST;
  const user = db.smtpUser || process.env.SMTP_USER;
  const pass = db.smtpPass || process.env.SMTP_PASS;
  const fromEmail = db.fromEmail || process.env.FROM_EMAIL;
  if (!host || !user || !pass || !fromEmail) return null;

  return {
    mode: "smtp",
    fromEmail,
    fromName: db.fromName || process.env.FROM_NAME || "Lab Price Comparator",
    smtp: {
      host,
      port: db.smtpPort || parseInt(process.env.SMTP_PORT || "587", 10),
      user,
      pass,
    },
    companyLogoUrl: db.companyLogoUrl || undefined,
    signatureHtml: db.signatureHtml || undefined,
    configSource: "database",
  };
}

// ---------------------------------------------------------------------------
// Build EmailConfig from env vars only (original logic)
// ---------------------------------------------------------------------------
function getEnvEmailConfig(): EmailConfig | null {
  // Strategy 1: Brevo HTTP API
  const apiKey = process.env.BREVO_API_KEY?.trim();
  const apiFromEmail = process.env.EMAIL_FROM?.trim();
  if (apiKey && apiFromEmail) {
    return {
      mode: "api",
      apiKey,
      fromEmail: apiFromEmail,
      fromName: process.env.EMAIL_FROM_NAME?.trim() || "Lab Price Comparator",
      configSource: "env",
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
      configSource: "env",
    };
  }

  return null;
}

// ---------------------------------------------------------------------------
// Public: resolve email config (DB first, then env)
// ---------------------------------------------------------------------------

/**
 * Resolve the active email configuration.
 *
 * Resolution order:
 *   1. `EmailSettings` DB table (singleton) — overrides env vars
 *   2. Environment variables — fallback
 *
 * DB values are cached for 30 s to avoid repeated queries.
 * Call `invalidateEmailConfigCache()` after writing to EmailSettings.
 */
export async function getEmailConfig(): Promise<EmailConfig | null> {
  const dbSettings = await getDbEmailSettings();

  if (dbSettings) {
    const config = buildConfigFromDb(dbSettings);
    if (config) return config;
  }

  // Fall back to environment variables
  return getEnvEmailConfig();
}

interface SendEmailParams {
  to: { email: string; name?: string }[];
  subject: string;
  htmlContent?: string;
  textContent?: string;
  attachments?: { name: string; content: string }[];
  /** Source identifier for tracking (e.g. "comparison", "quotation") */
  source?: string;
  /** Optional customer ID for tracking email history */
  customerId?: string;
}

// ---------------------------------------------------------------------------
// Custom error class to distinguish transient (retryable) failures from
// permanent ones (e.g. 4xx auth/validation errors).
// ---------------------------------------------------------------------------
class EmailSendError extends Error {
  /** If true the caller may retry the request. */
  retryable: boolean;

  constructor(message: string, retryable: boolean) {
    super(message);
    this.name = "EmailSendError";
    this.retryable = retryable;
  }
}

/** Check whether an unknown error should be considered transient. */
function isTransientError(error: unknown): boolean {
  if (error instanceof EmailSendError) return error.retryable;
  // Network-level errors (ECONNREFUSED, ETIMEDOUT, etc.) are retryable
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (
      msg.includes("econnrefused") ||
      msg.includes("econnreset") ||
      msg.includes("etimedout") ||
      msg.includes("esocket") ||
      msg.includes("network") ||
      msg.includes("fetch failed")
    ) {
      return true;
    }
  }
  // Default: treat unknown errors as transient to give the best chance
  return true;
}

// ---------------------------------------------------------------------------
// Retry helper
// ---------------------------------------------------------------------------
const MAX_RETRY_ATTEMPTS = 3;

/**
 * Delay helper – returns a promise that resolves after `ms` milliseconds.
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute `fn` with up to `MAX_RETRY_ATTEMPTS` attempts.
 *
 * Exponential backoff delays between retries: 1 s, 4 s.
 * Only transient errors are retried; permanent errors (4xx) throw immediately.
 */
async function sendWithRetry(
  fn: () => Promise<{ messageId: string }>,
  label: string,
): Promise<{ messageId: string }> {
  const RETRY_DELAYS_MS = [1_000, 4_000]; // after 1st fail → 1 s, after 2nd fail → 4 s
  let lastError: unknown;

  for (let attempt = 0; attempt < MAX_RETRY_ATTEMPTS; attempt++) {
    try {
      if (attempt > 0) {
        const backoff = RETRY_DELAYS_MS[attempt - 1];
        console.log(`[Email] Retry attempt ${attempt + 1}/${MAX_RETRY_ATTEMPTS} for ${label} – waiting ${backoff} ms`);
        await delay(backoff);
      }

      const result = await fn();
      if (attempt > 0) {
        console.log(`[Email] ${label} succeeded on attempt ${attempt + 1}`);
      }
      return result;
    } catch (error) {
      lastError = error;

      const errMsg = error instanceof Error ? error.message : "Unknown error";
      console.error(
        `[Email] ${label} attempt ${attempt + 1}/${MAX_RETRY_ATTEMPTS} failed: ${errMsg}`
      );

      // Don't retry permanent errors
      if (!isTransientError(error)) {
        console.error(`[Email] Error is not transient – aborting retries`);
        throw error;
      }

      // If this was the last attempt, throw
      if (attempt === MAX_RETRY_ATTEMPTS - 1) {
        console.error(`[Email] All ${MAX_RETRY_ATTEMPTS} attempts exhausted for ${label}`);
        throw error;
      }
    }
  }

  // Should be unreachable, but satisfy TypeScript
  throw lastError;
}

/**
 * Send an email via Brevo HTTP API or SMTP transport.
 * Automatically selects transport based on available env vars.
 * Retries up to 3 times with exponential backoff for transient errors.
 * Every email (success or failure) is logged to the email_logs table.
 */
export async function sendEmail(params: SendEmailParams): Promise<{ messageId: string }> {
  const config = await getEmailConfig();
  if (!config) {
    throw new Error(
      "Email non configuré. Définissez SMTP_HOST/SMTP_USER/SMTP_PASS/FROM_EMAIL ou BREVO_API_KEY/EMAIL_FROM."
    );
  }

  const toEmail = params.to.map((r) => r.email).join(", ");
  const label = `[${config.mode.toUpperCase()}→${toEmail}]`;

  console.log(`[Email] Config source: ${config.configSource}, mode: ${config.mode}, from: ${config.fromEmail}, to: ${toEmail}`);

  try {
    const result = await sendWithRetry(
      () =>
        config.mode === "smtp"
          ? sendViaSmtp(config, params)
          : sendViaBrevoApi(config, params),
      label,
    );

    // Log successful send
    await logEmail(toEmail, params.subject, "SENT", params.source || "system", undefined, params.customerId);

    return result;
  } catch (error) {
    // Log final failure after all retries exhausted
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    await logEmail(toEmail, params.subject, "FAILED", params.source || "system", errMsg, params.customerId);
    throw error;
  }
}

/** Persist an email log entry (fire-and-forget, never throws). */
async function logEmail(
  toEmail: string, subject: string,
  status: "SENT" | "FAILED" | "PENDING", source: string, error?: string, customerId?: string
) {
  try {
    await prisma.emailLog.create({
      data: { toEmail, subject, status, source, error: error || null, customerId: customerId || null },
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
    // 4xx errors are permanent (auth, validation) → not retryable
    // 5xx errors are transient (server-side) → retryable
    const retryable = response.status >= 500;
    throw new EmailSendError(`Brevo API error (${response.status}): ${message}`, retryable);
  }

  const result = await response.json();
  const messageId = result.messageId || result.messageIds?.[0] || "sent";
  console.log(`[Brevo API] Success! Status: ${response.status}, messageId: ${messageId}, full response:`, JSON.stringify(result));
  return { messageId };
}
