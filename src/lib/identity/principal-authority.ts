export type Capability = "catalog:manage" | "fulfillment:manage";
export type SystemPurpose = "catalog-sync" | "order-fulfillment";

type IdentityErrorCode =
  | "authentication_required"
  | "capability_denied"
  | "invalid_principal";

const principalBrand: unique symbol = Symbol("Principal");
type PrincipalBrand = { readonly [principalBrand]: true };

export type UserPrincipal = Readonly<{
  kind: "user";
  userId: string;
  capabilities: readonly Capability[];
} & PrincipalBrand>;

export type SystemPrincipal = Readonly<{
  kind: "system";
  purpose: SystemPurpose;
} & PrincipalBrand>;

export type Principal = UserPrincipal | SystemPrincipal;

const principals = new WeakSet<object>();

export class IdentityError extends Error {
  readonly code: IdentityErrorCode;

  constructor(
    code: IdentityErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "IdentityError";
    this.code = code;
  }
}

export function identityErrorHttpStatus(error: IdentityError): 401 | 403 {
  return error.code === "authentication_required" ? 401 : 403;
}

export function createUserPrincipalForIdentityModule(input: {
  userId: string;
  role?: string | null;
}): UserPrincipal {
  const capabilities: Capability[] = input.role
    ?.split(",")
    .map((role) => role.trim())
    .includes("admin")
    ? ["catalog:manage", "fulfillment:manage"]
    : [];
  const principal = Object.freeze({
    [principalBrand]: true as const,
    kind: "user" as const,
    userId: input.userId,
    capabilities: Object.freeze(capabilities),
  });
  principals.add(principal);
  return principal;
}

export function createSystemPrincipalForOrderFulfillment(): SystemPrincipal {
  return createSystemPrincipal("order-fulfillment");
}

export function createSystemPrincipalForCatalogSync(): SystemPrincipal {
  return createSystemPrincipal("catalog-sync");
}

function createSystemPrincipal(purpose: SystemPurpose): SystemPrincipal {
  const principal = Object.freeze({
    [principalBrand]: true as const,
    kind: "system" as const,
    purpose,
  });
  principals.add(principal);
  return principal;
}

export function isPrincipal(value: unknown): value is Principal {
  return typeof value === "object" && value !== null && principals.has(value);
}

export function assertUserPrincipal(value: unknown): UserPrincipal {
  if (!isPrincipal(value) || value.kind !== "user") {
    throw new IdentityError("invalid_principal", "A valid User Principal is required");
  }
  return value;
}

export function assertSystemPrincipal(
  value: unknown,
  purpose: SystemPurpose,
): SystemPrincipal {
  if (
    !isPrincipal(value) ||
    value.kind !== "system" ||
    value.purpose !== purpose
  ) {
    throw new IdentityError(
      "invalid_principal",
      `A valid ${purpose} System Principal is required`,
    );
  }
  return value;
}

export function hasCapability(
  principal: Principal | null,
  capability: Capability,
): boolean {
  return (
    principal?.kind === "user" && principal.capabilities.includes(capability)
  );
}

export function assertCapability(
  value: unknown,
  capability: Capability,
): UserPrincipal {
  const principal = assertUserPrincipal(value);
  if (!principal.capabilities.includes(capability)) {
    throw new IdentityError(
      "capability_denied",
      `Capability ${capability} is required`,
    );
  }
  return principal;
}
