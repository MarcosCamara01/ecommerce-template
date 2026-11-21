import { createHash, timingSafeEqual } from "node:crypto";

type CronEnvironment = Readonly<Record<string, string | undefined>>;

// `!==` stops at the first differing character, so its timing tells a caller
// how much of a guess was right. Hashing first gives equal-length inputs, which
// timingSafeEqual needs, without leaking the secret's length.
function sameCredential(received: string, expected: string): boolean {
  const digest = (value: string) => createHash("sha256").update(value).digest();
  return timingSafeEqual(digest(received), digest(expected));
}

export class InternalIdentityError extends Error {
  readonly code: "authentication_required" | "not_configured";

  constructor(
    code: "authentication_required" | "not_configured",
    message: string,
  ) {
    super(message);
    this.name = "InternalIdentityError";
    this.code = code;
  }
}

export function internalIdentityErrorHttpStatus(
  error: InternalIdentityError,
): 401 | 503 {
  return error.code === "not_configured" ? 503 : 401;
}

export function requireCronCredentialFromHeaders(
  headers: Headers,
  environment: CronEnvironment = process.env,
): void {
  const secret = environment.CRON_SECRET?.trim();
  if (!secret) {
    throw new InternalIdentityError(
      "not_configured",
      "Internal request authentication is not configured",
    );
  }
  if (!sameCredential(headers.get("authorization") ?? "", `Bearer ${secret}`)) {
    throw new InternalIdentityError(
      "authentication_required",
      "A valid internal request credential is required",
    );
  }
}
