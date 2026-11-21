import "server-only";

import { getCanonicalAppOrigin } from "@/lib/app-origin";

import { MailDeliveryError, failureFromResendResponse } from "./delivery-error";

const RESEND_EMAILS_URL = "https://api.resend.com/emails";
const RESEND_TIMEOUT_MS = 10_000;
const MAX_IDEMPOTENCY_KEY_LENGTH = 256;

export type MailMessage = Readonly<{
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  /**
   * For at-least-once senders only: Resend sends one message per key and
   * payload within 24 hours. The key is scoped to the store's host before it
   * is sent, because fulfillment work ids are a serial per database: a local
   * and a production database sharing one Resend key both have a
   * `work:7:email:customer`, and Resend would skip the second one.
   */
  idempotencyKey?: string;
}>;

type MailConfig =
  | Readonly<{ mode: "resend"; apiKey: string; from: string }>
  | Readonly<{ mode: "console" }>;

function readMailConfig(env: NodeJS.ProcessEnv): MailConfig {
  const apiKey = env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    if (env.NODE_ENV !== "production") return { mode: "console" };
    throw new MailDeliveryError(
      "not_configured",
      "Email is disabled. Set RESEND_API_KEY and EMAIL_FROM to send through Resend.",
    );
  }
  const from = env.EMAIL_FROM?.trim();
  if (!from) {
    throw new MailDeliveryError(
      "not_configured",
      "EMAIL_FROM is required with RESEND_API_KEY.",
    );
  }
  return { mode: "resend", apiKey, from };
}

function getFirstEnvValue(keys: string[]) {
  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (value) return value;
  }
  return undefined;
}

function scopedIdempotencyKey(key: string) {
  const scoped = `${new URL(getCanonicalAppOrigin()).host}/${key}`;
  if (scoped.length > MAX_IDEMPOTENCY_KEY_LENGTH) {
    throw new MailDeliveryError("rejected", "The idempotency key is longer than Resend accepts.");
  }
  return scoped;
}

export function escapeHtml(value: string | number | null | undefined) {
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

export function getContactEmailAddress() {
  const contactTo = getFirstEnvValue(["EMAIL_CONTACT_TO", "ADMIN_EMAIL"]);
  if (!contactTo) {
    throw new MailDeliveryError(
      "not_configured",
      "Set EMAIL_CONTACT_TO or ADMIN_EMAIL to receive owner notices.",
    );
  }
  return contactTo;
}

export async function sendMail(message: MailMessage): Promise<void> {
  const config = readMailConfig(process.env);
  if (config.mode === "console") {
    console.info(
      `[mail] to=${message.to} subject=${message.subject}\n${message.text ?? "(html only)"}`,
    );
    return;
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${config.apiKey}`,
    "Content-Type": "application/json",
    "User-Agent": "store-template-mailer",
  };
  if (message.idempotencyKey) {
    headers["Idempotency-Key"] = scopedIdempotencyKey(message.idempotencyKey);
  }

  let response: Response;
  try {
    response = await fetch(RESEND_EMAILS_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({
        from: config.from,
        to: message.to,
        subject: message.subject,
        html: message.html,
        text: message.text,
        reply_to: message.replyTo,
      }),
      signal: AbortSignal.timeout(RESEND_TIMEOUT_MS),
    });
  } catch (error) {
    throw new MailDeliveryError(
      "unavailable",
      `Resend could not be reached (${error instanceof Error ? error.name : "unknown error"})`,
    );
  }

  if (!response.ok) {
    throw failureFromResendResponse(
      response.status,
      await response.json().catch(() => null),
    );
  }
}
