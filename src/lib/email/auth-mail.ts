import "server-only";

import { escapeHtml, sendMail } from "./mailer";

export type AuthMailRecipient = Readonly<{ email: string }>;

export type AuthMail =
  | Readonly<{ kind: "verify-email"; url: string; expiresInSeconds: number }>
  | Readonly<{ kind: "existing-account"; signInUrl: string; googleEnabled: boolean }>;

type AuthMailContent = Readonly<{
  subject: string;
  paragraphs: readonly string[];
  action: Readonly<{ label: string; url: string }>;
  closing: string;
}>;

function contentFor(mail: AuthMail): AuthMailContent {
  switch (mail.kind) {
    case "verify-email":
      return {
        subject: "Confirm your email address",
        paragraphs: [
          "Confirm your email address to finish creating your account.",
          `The link expires in ${duration(mail.expiresInSeconds)}.`,
        ],
        action: { label: "Confirm email", url: mail.url },
        closing: "If you didn't ask for this, ignore this email.",
      };
    case "existing-account":
      return {
        subject: "You already have an account",
        paragraphs: [
          "Someone tried to create an account with this email address, but you already have one.",
          mail.googleEnabled
            ? "Sign in with your password, or with Continue with Google if that is how you joined."
            : "Sign in with your password.",
        ],
        action: { label: "Sign in", url: mail.signInUrl },
        closing: "If this wasn't you, ignore this email. Your account has not changed.",
      };
  }
}

function duration(seconds: number) {
  const unit = (count: number, name: string) => `${count} ${name}${count === 1 ? "" : "s"}`;
  return seconds % 3600 === 0
    ? unit(seconds / 3600, "hour")
    : unit(Math.max(1, Math.round(seconds / 60)), "minute");
}

function renderText(content: AuthMailContent) {
  return [
    "Hello,",
    ...content.paragraphs,
    `${content.action.label}: ${content.action.url}`,
    content.closing,
  ].join("\n\n");
}

function renderHtml(content: AuthMailContent) {
  const paragraphs = content.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("");
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <p>Hello,</p>
      ${paragraphs}
      <p style="margin: 28px 0;">
        <a href="${escapeHtml(content.action.url)}" style="background-color: #111214; color: #ffffff; padding: 12px 24px; border-radius: 999px; text-decoration: none; font-weight: bold;">${escapeHtml(content.action.label)}</a>
      </p>
      <p style="color: #666; font-size: 14px;">Or open this link: ${escapeHtml(content.action.url)}</p>
      <p style="color: #666; font-size: 14px; margin-top: 30px;">${escapeHtml(content.closing)}</p>
    </div>
  `;
}

export async function sendAuthMail(recipient: AuthMailRecipient, mail: AuthMail): Promise<void> {
  const content = contentFor(mail);
  await sendMail({
    to: recipient.email,
    subject: content.subject,
    html: renderHtml(content),
    text: renderText(content),
  });
}
