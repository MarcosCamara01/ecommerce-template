/**
 * Decides whether an OAuth identity may be attached to an existing user row.
 *
 * Extracted as a pure function (no imports) so the security-critical branch of
 * REPORT-1732 can be unit tested without standing up better-auth, Postgres and
 * a Google token endpoint.
 *
 * Background: better-auth links a social identity to an existing account when
 * the email addresses match and the *incoming* provider reports the address as
 * verified. It never asks whether the *pre-existing* account ever proved it
 * owns that address. That let an attacker register victim@example.test with a
 * password, wait for the real owner to "Continue with Google", and end up
 * sharing the account — retaining password access to it.
 */

export type AccountLinkDecision =
  /** Safe to link: no pre-existing claim, or the claim is already proven. */
  | "allow"
  /**
   * The address was pre-claimed by an account that never proved ownership and
   * holds nothing of value. Drop the stale credential and let the verified
   * identity take the row, so a squatter cannot lock the real owner out.
   */
  | "reclaim"
  /**
   * A pre-existing account has real history. Refuse rather than silently
   * rewriting it; the owner must sign in and link deliberately.
   */
  | "refuse";

export type AccountLinkContext = {
  /** Provider of the row being created. `credential` is a sign-up, not a link. */
  providerId: string;
  /** Whether the target user row was found. */
  userExists: boolean;
  /** Whether that user has independently proven ownership of the address. */
  userEmailVerified: boolean;
  /** Provider ids already attached to that user. */
  existingProviderIds: readonly string[];
  /** Whether that user has any order history. */
  hasOrderHistory: boolean;
};

export function decideAccountLink({
  providerId,
  userExists,
  userEmailVerified,
  existingProviderIds,
  hasOrderHistory,
}: AccountLinkContext): AccountLinkDecision {
  // Creating the credential row *is* the sign-up; there is nothing to link to.
  if (providerId === "credential") return "allow";

  // A fresh social sign-up creates the user from this same verified identity.
  if (!userExists) return "allow";

  // The account already proved it owns this address, so linking is legitimate.
  if (userEmailVerified) return "allow";

  // Below here the target account has NEVER verified the address.
  const hasCredential = existingProviderIds.includes("credential");
  const hasOtherSocial = existingProviderIds.some((id) => id !== "credential");

  // Nothing attached yet, so nothing can be displaced.
  if (!hasCredential && !hasOtherSocial) return "allow";

  // Another social identity is already attached, or the account has orders:
  // it is not provably inert, so do not rewrite it.
  if (hasOtherSocial || hasOrderHistory) return "refuse";

  return "reclaim";
}
