import { ExistingOrderMismatchError } from "../orders/existing-order-idempotency.ts";
import { externalErrorFacts } from "../external/error-facts.ts";

const RETRYABLE_POSTGRES_CODES = new Set([
  "40001",
  "40P01",
  "53300",
  "57P01",
  "57P03",
]);

const RETRYABLE_STRIPE_ERROR_TYPES = new Set([
  "StripeAPIError",
  "StripeConnectionError",
  "StripeRateLimitError",
]);

export class FulfillmentFailure extends Error {
  readonly code: string;
  readonly retryable: boolean;

  constructor(
    code: string,
    retryable: boolean,
    message: string,
  ) {
    super(message);
    this.name = "FulfillmentFailure";
    this.code = code;
    this.retryable = retryable;
  }
}

export type PermanentReconciliationFailureCode =
  | "durable_snapshot_corrupt"
  | "stripe_evidence_incomplete"
  | "stripe_evidence_mismatch"
  | "historical_catalog_identity_missing";

export function permanentReconciliationFailure(
  code: PermanentReconciliationFailureCode,
  message: string,
) {
  return new FulfillmentFailure(code, false, message);
}

export function classifyFulfillmentError(error: unknown): {
  code: string;
  detail: string;
  retryable: boolean;
} {
  if (error instanceof FulfillmentFailure) {
    return { code: error.code, detail: error.message, retryable: error.retryable };
  }
  if (error instanceof ExistingOrderMismatchError) {
    return { code: error.code, detail: error.message, retryable: false };
  }
  if (typeof error === "object" && error !== null) {
    const facts = externalErrorFacts(error);
    const code = facts.code;
    if (code && RETRYABLE_POSTGRES_CODES.has(code)) {
      return { code: `postgres_${code}`, detail: facts.detail, retryable: true };
    }
    const status = facts.statusCode;
    const type = facts.type;
    if (type?.startsWith("Stripe")) {
      const retryable = RETRYABLE_STRIPE_ERROR_TYPES.has(type) ||
        status === 409 || status === 429 || Boolean(status && status >= 500);
      return { code: type, detail: facts.detail, retryable };
    }
  }
  return {
    code: "unexpected",
    detail: externalErrorFacts(error).detail,
    retryable: true,
  };
}

export function retryAt(attemptCount: number, retryable: boolean): Date | null {
  if (!retryable || attemptCount >= 8) return null;
  const delaySeconds = Math.min(60 * 60, 15 * 2 ** Math.max(0, attemptCount - 1));
  return new Date(Date.now() + delaySeconds * 1000);
}
