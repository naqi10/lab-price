import nodemailer from "nodemailer";

/**
 * Email configuration interface matching the EmailConfig database model.
 */
interface EmailConfigData {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  fromAddress: string;
  fromName?: string | null;
}

/**
 * Create a Nodemailer transporter from an EmailConfig database record.
 * @param config - The email configuration from the database
 * @returns A configured Nodemailer transporter
 */
export function createTransporter(config: EmailConfigData) {
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.username,
      pass: config.password,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 30000,
  });

  transporter.verify().catch((error) => {
    console.error("Email transporter verification failed:", error);
  });

  return transporter;
}

/**
 * Create a transporter from environment variables as a fallback.
 * @returns A configured Nodemailer transporter, or null if env vars are missing
 */
export function createTransporterFromEnv(): ReturnType<typeof nodemailer.createTransport> | null {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !port || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port: parseInt(port, 10),
    secure: parseInt(port, 10) === 465,
    auth: { user, pass },
  });
}
