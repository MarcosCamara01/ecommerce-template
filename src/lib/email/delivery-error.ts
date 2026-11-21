const RETRYABLE_BY_REASON = {
  not_configured: false,
  rejected: false,
  unauthorized: false,
  quota_exceeded: false,
  idempotency_conflict: false,
  rate_limited: true,
  in_flight: true,
  unavailable: true,
} as const satisfies Record<string, boolean>;

export type MailFailureReason = keyof typeof RETRYABLE_BY_REASON;

export class MailDeliveryError extends Error {
  readonly reason: MailFailureReason;
  readonly retryable: boolean;
  readonly status: number | null;

  constructor(reason: MailFailureReason, message: string, status: number | null = null) {
    super(message);
    this.name = "MailDeliveryError";
    this.reason = reason;
    this.retryable = RETRYABLE_BY_REASON[reason];
    this.status = status;
  }
}

/**
 * Resend's error envelope is not pinned, so only a string `name` is read, and
 * its `message` never is: it can echo addresses, and this error's message
 * ends up in `last_error_detail`.
 */
export function failureFromResendResponse(status: number, body: unknown): MailDeliveryError {
  const name = errorName(body);
  const reason = reasonFor(status, name);
  return new MailDeliveryError(
    reason,
    `Resend answered ${status}${name ? ` (${name})` : ""}`,
    status,
  );
}

function reasonFor(status: number, name: string | null): MailFailureReason {
  if (status === 401) return "unauthorized";
  if (status === 403) {
    return name === "restricted_api_key" || name === "suspended_api_key"
      ? "unauthorized"
      : "rejected";
  }
  if (status === 400 || status === 404 || status === 422) return "rejected";
  if (status === 409) {
    return name === "invalid_idempotent_request" ? "idempotency_conflict" : "in_flight";
  }
  if (status === 429) return name?.includes("quota") ? "quota_exceeded" : "rate_limited";
  return "unavailable";
}

function errorName(body: unknown): string | null {
  if (typeof body !== "object" || body === null || !("name" in body)) return null;
  const { name } = body;
  return typeof name === "string" && /^[a-z_]{1,64}$/.test(name) ? name : null;
}
