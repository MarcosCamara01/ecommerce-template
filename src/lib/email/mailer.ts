import "server-only";

import nodemailer from "nodemailer";

type MailOptions = {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
  messageId?: string;
};

function getFirstEnvValue(keys: string[], trim = true) {
  for (const key of keys) {
    const rawValue = process.env[key];
    if (!rawValue) {
      continue;
    }

    const value = trim ? rawValue.trim() : rawValue;
    if (value) {
      return value;
    }
  }

  return undefined;
}

function getEmailConfig() {
  const host = process.env.EMAIL_SERVER_HOST?.trim();
  const portValue = process.env.EMAIL_SERVER_PORT?.trim();
  const port = portValue ? Number(portValue) : Number.NaN;
  const user = process.env.EMAIL_SERVER_USER?.trim();
  // Never fall back to a NEXT_PUBLIC_* name here: Next.js inlines those into
  // the client bundle, which would publish the SMTP password to every visitor.
  const rawPassword = process.env.EMAIL_SERVER_PASSWORD;
  const pass = rawPassword?.trim() ? rawPassword : undefined;
  const from = process.env.EMAIL_FROM?.trim();
  const contactTo = getFirstEnvValue([
    "EMAIL_CONTACT_TO",
    "ADMIN_EMAIL",
  ]);

  if (!host) {
    throw new Error(
      "Email is disabled. Set EMAIL_SERVER_HOST to enable an explicit SMTP transport.",
    );
  }
  if (
    !Number.isInteger(port) ||
    port < 1 ||
    port > 65_535 ||
    !user ||
    !pass ||
    !from ||
    !contactTo
  ) {
    throw new Error(
      "Email configuration is incomplete or invalid. Set a valid EMAIL_SERVER_PORT, EMAIL_SERVER_USER, EMAIL_SERVER_PASSWORD, EMAIL_FROM, and EMAIL_CONTACT_TO/ADMIN_EMAIL.",
    );
  }

  return {
    host,
    port,
    user,
    pass,
    from,
    contactTo,
  };
}

function escapeHtml(value: string | number | null | undefined) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) {
    return transporter;
  }

  const config = getEmailConfig();

  transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });

  return transporter;
}

export function getContactEmailAddress() {
  return getEmailConfig().contactTo;
}

export async function sendMail({
  to,
  subject,
  html,
  replyTo,
  messageId,
}: MailOptions) {
  const config = getEmailConfig();

  await getTransporter().sendMail({
    from: config.from,
    to,
    subject,
    html,
    ...(replyTo ? { replyTo } : {}),
    ...(messageId ? { messageId } : {}),
  });
}

export { escapeHtml };
