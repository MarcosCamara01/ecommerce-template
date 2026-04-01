import "server-only";

import nodemailer from "nodemailer";
import { z } from "zod";

const contactEmailSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().email("A valid email is required"),
  subject: z.string().trim().min(1, "Subject is required"),
  message: z.string().trim().min(1, "Message is required"),
});

type MailOptions = {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
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
  const port = Number(process.env.EMAIL_SERVER_PORT ?? "587");
  const user = getFirstEnvValue([
    "EMAIL_SERVER_USER",
    "NEXT_PUBLIC_EMAIL_USERNAME",
  ]);
  const pass = getFirstEnvValue([
    "EMAIL_SERVER_PASSWORD",
    "NEXT_PUBLIC_EMAIL_PASSWORD",
  ], false);
  const from = getFirstEnvValue([
    "EMAIL_FROM",
    "EMAIL_SERVER_USER",
    "NEXT_PUBLIC_EMAIL_USERNAME",
  ]);
  const contactTo = getFirstEnvValue([
    "EMAIL_CONTACT_TO",
    "ADMIN_EMAIL",
    "NEXT_PUBLIC_PERSONAL_EMAIL",
    "EMAIL_FROM",
    "EMAIL_SERVER_USER",
    "NEXT_PUBLIC_EMAIL_USERNAME",
  ]);

  if (!user || !pass || !from || !contactTo) {
    throw new Error(
      "Email is not configured. Set EMAIL_SERVER_USER, EMAIL_SERVER_PASSWORD, EMAIL_FROM, and EMAIL_CONTACT_TO/ADMIN_EMAIL.",
    );
  }

  return {
    host,
    port: Number.isFinite(port) && port > 0 ? port : 587,
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

  transporter = config.host
    ? nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.port === 465,
        auth: {
          user: config.user,
          pass: config.pass,
        },
      })
    : nodemailer.createTransport({
        service: "gmail",
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

export async function sendMail({ to, subject, html, replyTo }: MailOptions) {
  const config = getEmailConfig();

  await getTransporter().sendMail({
    from: config.from,
    to,
    subject,
    html,
    ...(replyTo ? { replyTo } : {}),
  });
}

export async function sendContactEmail(input: z.infer<typeof contactEmailSchema>) {
  const safeName = escapeHtml(input.name);
  const safeEmail = escapeHtml(input.email);
  const safeSubject = escapeHtml(input.subject);
  const safeMessage = escapeHtml(input.message).replaceAll("\n", "<br />");

  await sendMail({
    to: getContactEmailAddress(),
    subject: `[Contact] ${input.subject.trim()}`,
    replyTo: input.email,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto;">
        <h2 style="color: #111827;">New contact message</h2>
        <p><strong>Name:</strong> ${safeName}</p>
        <p><strong>Email:</strong> ${safeEmail}</p>
        <p><strong>Subject:</strong> ${safeSubject}</p>
        <div style="margin-top: 24px; padding: 16px; background-color: #f3f4f6; border-radius: 8px;">
          ${safeMessage}
        </div>
      </div>
    `,
  });
}

export { contactEmailSchema, escapeHtml };
