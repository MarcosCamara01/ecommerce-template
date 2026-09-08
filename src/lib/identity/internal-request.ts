type CronEnvironment = Readonly<Record<string, string | undefined>>;

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
  if (headers.get("authorization") !== `Bearer ${secret}`) {
    throw new InternalIdentityError(
      "authentication_required",
      "A valid internal request credential is required",
    );
  }
}
