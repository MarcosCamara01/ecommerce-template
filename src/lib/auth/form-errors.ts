export type AuthField = "name" | "email" | "password";

const FOREIGN_FORM = {
  message: "This form was sent from another site. Try again from this page.",
  fields: [],
} as const;

const AUTH_ERRORS = {
  INVALID_EMAIL_OR_PASSWORD: {
    message: "Invalid email or password",
    fields: ["email", "password"],
  },
  INVALID_EMAIL: { message: "Enter a valid email address.", fields: ["email"] },
  INVALID_PASSWORD: { message: "Enter a valid password.", fields: ["password"] },
  PASSWORD_TOO_SHORT: { message: "Use at least 8 characters.", fields: ["password"] },
  PASSWORD_TOO_LONG: { message: "Use at most 128 characters.", fields: ["password"] },
  EMAIL_NOT_VERIFIED: {
    message: "Verify your email to sign in. We just sent you a new link.",
    fields: [],
  },
  INVALID_TOKEN: { message: "This link is not valid, or it was already used.", fields: [] },
  TOKEN_EXPIRED: { message: "This link has expired.", fields: [] },
  USER_NOT_FOUND: { message: "This link is for an account that no longer exists.", fields: [] },
  RATE_LIMITED: { message: "Too many attempts. Wait a minute and try again.", fields: [] },
  INVALID_ORIGIN: FOREIGN_FORM,
  MISSING_OR_NULL_ORIGIN: FOREIGN_FORM,
  CROSS_SITE_NAVIGATION_LOGIN_BLOCKED: FOREIGN_FORM,
} as const satisfies Record<string, { message: string; fields: readonly AuthField[] }>;

type KnownAuthErrorCode = keyof typeof AUTH_ERRORS;

export type AuthErrorCode = KnownAuthErrorCode | "UNKNOWN";

const UNKNOWN_MESSAGE = "Something went wrong. Check the form and try again.";

export function authErrorCode(raw: unknown): AuthErrorCode {
  return typeof raw === "string" && Object.hasOwn(AUTH_ERRORS, raw)
    ? (raw as KnownAuthErrorCode)
    : "UNKNOWN";
}

export function authErrorMessage(code: AuthErrorCode): string {
  return code === "UNKNOWN" ? UNKNOWN_MESSAGE : AUTH_ERRORS[code].message;
}

export function authFailureMessage(failure: unknown): string | null {
  if (!failure) return null;
  if (typeof failure === "string") return failure;
  const code = authErrorCode((failure as { code?: unknown }).code);
  if (code !== "UNKNOWN") return authErrorMessage(code);
  const { message } = failure as { message?: unknown };
  return typeof message === "string" && message ? message : UNKNOWN_MESSAGE;
}

export function invalidFields<Field extends AuthField>(
  failure: unknown,
  fields: readonly Field[],
): readonly Field[] {
  if (!failure) return [];
  const code = authErrorCode((failure as { code?: unknown }).code);
  if (code === "UNKNOWN") return fields;
  const named = new Set<AuthField>(AUTH_ERRORS[code].fields);
  return fields.filter((field) => named.has(field));
}
