export {
  IdentityError,
  assertCapability,
  assertSystemPrincipal,
  assertUserPrincipal,
  hasCapability,
  identityErrorHttpStatus,
  isPrincipal,
  type Capability,
  type Principal,
  type SystemPrincipal,
  type SystemPurpose,
  type UserPrincipal,
} from "./principal-authority";

export {
  getPrincipal,
  getPrincipalFromHeaders,
  getIdentity,
  getIdentityFromHeaders,
  requireCapability,
  requireCapabilityFromHeaders,
  requirePrincipal,
  requirePrincipalFromHeaders,
  updateIdentityProfileFromHeaders,
} from "./server";

export type { AuthenticatedIdentity } from "./server";

export {
  InternalIdentityError,
  internalIdentityErrorHttpStatus,
  requireCronCredentialFromHeaders,
} from "./internal-request";
