import "server-only";

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError } from "better-auth/api";
import { admin } from "better-auth/plugins";
import { sql } from "drizzle-orm";
import { after } from "next/server";

import { getCanonicalAppOrigin } from "@/lib/app-origin";
import {
  RESET_LINK_TTL_SECONDS,
  VERIFICATION_LINK_TTL_SECONDS,
  authPageHref,
  verificationLandingLink,
} from "@/lib/auth/email-flows";
import { db } from "@/lib/db/drizzle/connection";
import { sendAuthMail } from "@/lib/email";
import {
  accounts,
  sessions,
  users,
  verifications,
} from "@/lib/db/drizzle/schema";
import {
  legacyAccounts,
  legacySessions,
  legacyUsers,
  legacyVerifications,
} from "@/lib/db/drizzle/schema/legacy-auth";

const authTables =
  process.env.AUTH_DATABASE_LAYOUT === "public"
    ? {
        user: legacyUsers,
        session: legacySessions,
        account: legacyAccounts,
        verification: legacyVerifications,
      }
    : { user: users, session: sessions, account: accounts, verification: verifications };

const authDatabaseSchema = process.env.AUTH_DATABASE_LAYOUT === "public"
  ? "public"
  : "app_private";
const authSchemaIdentifier = sql.identifier(authDatabaseSchema);
const authBaseURL = getCanonicalAppOrigin();
const authTrustedOrigins = [authBaseURL];
const googleAuthEnabled = process.env.GOOGLE_AUTH_ENABLED === "true";
const googleAuthUiEnabled =
  process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true";
if (googleAuthEnabled !== googleAuthUiEnabled) {
  throw new Error(
    "GOOGLE_AUTH_ENABLED and NEXT_PUBLIC_GOOGLE_AUTH_ENABLED must match",
  );
}
if (
  googleAuthEnabled &&
  (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET)
) {
  throw new Error("Enabled Google auth requires its client id and secret");
}
const googleSocialProvider =
  googleAuthEnabled
    ? {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        },
      }
    : {};

async function rejectUnverifiedProviderLink(userId: string) {
  const [user] = await db.execute<{ emailVerified: boolean }>(sql`
    select email_verified as "emailVerified"
    from ${authSchemaIdentifier}."user"
    where id = ${userId}
    limit 1
  `);
  if (user && !user.emailVerified) {
    throw new APIError("UNAUTHORIZED", {
      message: "Verify your existing email address before linking another provider.",
    });
  }
}

async function markEmailVerifiedAfterReset(userId: string) {
  await db.execute(sql`
    update ${authSchemaIdentifier}."user"
    set email_verified = true, updated_at = now()
    where id = ${userId} and email_verified = false
  `);
}

function runAfterResponse(task: Promise<unknown>) {
  try {
    after(task);
  } catch {
    // after() throws outside a Next request, as when a Node script calls
    // auth.handler. The task is already running; it only misses the extended lifetime.
  }
}

export const auth = betterAuth({
  baseURL: authBaseURL,
  trustedOrigins: authTrustedOrigins,
  disabledPaths: ["/send-verification-email"],
  database: drizzleAdapter(db, {
    provider: "pg",
    transaction: true,
    schema: authTables,
  }),
  secret: process.env.BETTER_AUTH_SECRET,

  plugins: [admin({ defaultRole: "user", adminRoles: ["admin"] })],

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    resetPasswordTokenExpiresIn: RESET_LINK_TTL_SECONDS,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: ({ user, url }) =>
      sendAuthMail(user, {
        kind: "reset-password",
        url,
        expiresInSeconds: RESET_LINK_TTL_SECONDS,
      }),
    onPasswordReset: ({ user }) => markEmailVerifiedAfterReset(user.id),
    onExistingUserSignUp: ({ user }) =>
      sendAuthMail(user, {
        kind: "existing-account",
        signInUrl: authPageHref("signIn", { origin: authBaseURL }),
        resetUrl: authPageHref("forgotPassword", { origin: authBaseURL }),
        googleEnabled: googleAuthEnabled,
      }),
    customSyntheticUser: ({ coreFields, additionalFields, id }) => ({
      ...coreFields,
      ...additionalFields,
      id,
      role: "user",
      banned: false,
      banReason: null,
      banExpires: null,
    }),
  },

  emailVerification: {
    // sendOnSignUp stays unset: it then follows requireEmailVerification for
    // credential sign-ups and the unset Google option for OAuth, so Google
    // sign-ups get no mail.
    sendOnSignIn: true,
    // A link opened in another browser would sign that browser into the
    // registrant's account, so verifying never signs anyone in.
    autoSignInAfterVerification: false,
    expiresIn: VERIFICATION_LINK_TTL_SECONDS,
    sendVerificationEmail: ({ user, url }) =>
      sendAuthMail(user, {
        kind: "verify-email",
        url: verificationLandingLink(url, authBaseURL),
        expiresInSeconds: VERIFICATION_LINK_TTL_SECONDS,
      }),
  },

  advanced: {
    backgroundTasks: { handler: runAfterResponse },
  },

  account: {
    encryptOAuthTokens: true,
    accountLinking: {
      enabled: true,
      trustedProviders: [],
      allowDifferentEmails: false,
      requireLocalEmailVerified: true,
      updateUserInfoOnLink: true,
    },
  },

  databaseHooks: {
    account: {
      create: {
        before: async (account) => {
          if (account.providerId !== "credential") {
            await rejectUnverifiedProviderLink(account.userId);
          }
        },
      },
    },
  },

  socialProviders: googleSocialProvider,
});
