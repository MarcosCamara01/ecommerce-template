import { createAuthMiddleware } from "better-auth/api";
import { verifyJWT } from "better-auth/crypto";

const UNVERIFIABLE_TOKEN = "";

// Better Auth's verification link is a stateless JWT it accepts until expiry.
export const refuseUsedVerificationLink = createAuthMiddleware(async (ctx) => {
  const token = ctx.query?.token;
  if (ctx.path !== "/verify-email" || typeof token !== "string") return;

  const payload = await verifyJWT<{ email?: unknown; updateTo?: unknown }>(
    token,
    ctx.context.secret,
  );
  if (typeof payload?.email !== "string" || payload.updateTo) return;

  const found = await ctx.context.internalAdapter.findUserByEmail(payload.email);
  if (!found?.user.emailVerified) return;

  // Hooks run before verifyEmail's callbackURL origin check, so a redirect from here would skip it.
  return { context: { query: { ...ctx.query, token: UNVERIFIABLE_TOKEN } } };
});
