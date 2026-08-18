import "server-only";

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError } from "better-auth/api";
import { admin } from "better-auth/plugins";
import { sql } from "drizzle-orm";

import { db } from "@/lib/db/drizzle/connection";
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
const authBaseURL =
  process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL;
const authTrustedOrigins = Array.from(
  new Set(
    [process.env.BETTER_AUTH_URL, process.env.NEXT_PUBLIC_APP_URL].filter(
      (origin): origin is string => Boolean(origin),
    ),
  ),
);

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

export const auth = betterAuth({
  baseURL: authBaseURL,
  trustedOrigins: authTrustedOrigins,
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
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
    expiresIn: 60 * 60,
    sendVerificationEmail: async ({ user, url }) => {
      const { sendMail, escapeHtml } = await import("@/lib/email/mailer");
      try {
        await sendMail({
          to: user.email,
          subject: "Verify your email address",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto;">
              <h2 style="color: #111827;">Confirm your email</h2>
              <p>Hi ${escapeHtml(user.name)}, please confirm this address to activate your account.</p>
              <p style="margin: 24px 0;"><a href="${url}" style="background-color: #111827; color: #ffffff; padding: 12px 20px; border-radius: 8px; text-decoration: none;">Verify email</a></p>
              <p style="color: #6b7280; font-size: 14px;">This link expires in 1 hour. If you did not create an account, you can ignore this email.</p>
            </div>
          `,
        });
      } catch (error) {
        console.error(
          "[auth] failed to send verification email:",
          error instanceof Error ? error.message : error,
        );
      }
    },
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

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
});
