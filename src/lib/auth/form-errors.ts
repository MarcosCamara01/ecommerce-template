type AuthField = "name" | "email" | "password";

/** The fields each Better Auth error code is about. */
const FIELDS_BY_CODE: Record<string, ReadonlySet<AuthField>> = {
  INVALID_EMAIL_OR_PASSWORD: new Set(["email", "password"]),
  INVALID_EMAIL: new Set(["email"]),
  USER_ALREADY_EXISTS: new Set(["email"]),
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: new Set(["email"]),
  INVALID_PASSWORD: new Set(["password"]),
  PASSWORD_TOO_SHORT: new Set(["password"]),
  PASSWORD_TOO_LONG: new Set(["password"]),
};

/**
 * The fields of a sign-in or sign-up form that an error points at, in form
 * order: the ones its code names, or every field when it names none.
 */
export function invalidFields<Field extends AuthField>(
  error: unknown,
  fields: readonly Field[],
): readonly Field[] {
  if (!error) return [];
  const code = (error as { code?: unknown }).code;
  const named = typeof code === "string" ? FIELDS_BY_CODE[code] : undefined;
  return named ? fields.filter((field) => named.has(field)) : fields;
}
