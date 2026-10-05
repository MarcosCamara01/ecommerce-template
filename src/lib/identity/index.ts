export {
  IdentityError,
  assertCapability,
  assertSystemPrincipal,
  assertUserPrincipal,
  hasCapability,
  identityErrorHttpStatus,
  type Principal,
  type SystemPrincipal,
  type UserPrincipal,
} from "./principal-authority";

export {
  getPrincipal,
  getPrincipalFromHeaders,
  getIdentityFromHeaders,
  requireCapability,
  requireCapabilityFromHeaders,
  requirePrincipal,
  requirePrincipalFromHeaders,
  updateIdentityProfileFromHeaders,
} from "./server";

export {
  InternalIdentityError,
  internalIdentityErrorHttpStatus,
  requireCronCredentialFromHeaders,
} from "./internal-request";
