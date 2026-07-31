import { Pool } from "pg";
import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { decideAccountLink } from "@/lib/auth/account-linking";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/**
 * Providers whose asserted `email_verified` claim we accept as proof of
 * ownership *for the identity being linked*. Deliberately empty: better-auth's
 * built-in linking guard only inspects the INCOMING provider's `emailVerified`
 * flag, so listing a provider here makes it bypass that check entirely. Keeping
 * this empty means an OAuth identity that does not assert a verified email can
 * never be linked to a pre-existing account.
 */
const TRUSTED_PROVIDERS: string[] = [];

/**
 * Has this user ever placed an order? Used as a conservative "this account has
 * real history" signal before we reclaim a never-verified account. Orders are
 * owned by the app's own Drizzle schema (snake_case), not by better-auth.
 */
async function hasOrderHistory(userId: string) {
  const { rows } = await pool.query(
    `select 1 from order_items where user_id = $1 limit 1`,
    [userId],
  );
  return rows.length > 0;
}

export const auth = betterAuth({
  database: pool,
  secret: process.env.BETTER_AUTH_SECRET,

  emailAndPassword: {
    enabled: true,
    // A credential account is inert until the address is proven. Without this,
    // signing up is enough to *reserve* an address you do not own.
    requireEmailVerification: true,
  },

  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
    expiresIn: 60 * 60, // 1 hour
    sendVerificationEmail: async ({ user, url }) => {
      // Imported lazily: the mailer pulls in `server-only` + nodemailer, and
      // throws when SMTP is unconfigured. Keeping it out of module scope means
      // a missing mail config cannot break auth at import time.
      const { sendMail, escapeHtml } = await import("@/lib/email/mailer");

      // A mail outage must not take registration down with it. The account is
      // still created unverified, and `sendOnSignIn` re-sends the link on the
      // user's next sign-in attempt, so this is self-recovering.
      try {
        await sendMail({
          to: user.email,
          subject: "Verify your email address",
          html: `
          <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto;">
            <h2 style="color: #111827;">Confirm your email</h2>
            <p>Hi ${escapeHtml(user.name)}, please confirm this address to activate your account.</p>
            <p style="margin: 24px 0;">
              <a href="${url}" style="background-color: #111827; color: #ffffff; padding: 12px 20px; border-radius: 8px; text-decoration: none;">Verify email</a>
            </p>
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
    accountLinking: {
      // Linking stays enabled so that a verified owner can still attach Google
      // to their existing account, and so the authenticated `linkSocial`
      // endpoint keeps working. The dangerous case (linking into an account
      // that never proved it owns the address) is rejected by the hook below.
      enabled: true,
      trustedProviders: TRUSTED_PROVIDERS,
      allowDifferentEmails: false,
      // Applies to the authenticated `linkSocial` endpoint only. Sign-in-time
      // linking is governed by the per-provider `overrideUserInfoOnSignIn`,
      // which we deliberately leave off so a user's edited profile is not
      // overwritten by Google on every login.
      updateUserInfoOnLink: true,
    },
  },

  databaseHooks: {
    account: {
      create: {
        /**
         * Guards REPORT-1732 (account takeover via email pre-claim).
         *
         * better-auth decides whether to link a social identity to an existing
         * user by comparing email addresses and checking that the *incoming*
         * provider says the email is verified. It never checks whether the
         * *pre-existing* account ever proved ownership. So an attacker could
         * register victim@example.test with a password, wait for the real owner
         * to "Continue with Google", and have the verified Google identity
         * absorbed into the attacker's row — keeping password access.
         *
         * This runs on the single choke point every link flows through
         * (`internalAdapter.linkAccount` -> `createWithHooks("account")`),
         * so it covers both the OAuth redirect callback and the ID-token flow.
         *
         * It must THROW rather than return `false`: a `false` return makes
         * `linkAccount` resolve to `null` without raising, and the caller would
         * still go on to flip `emailVerified` to true and mint a session.
         */
        before: async (account, context) => {
          // Credential rows are the sign-up itself, not a link.
          if (account.providerId === "credential") return;

          const adapter = context?.context.adapter;
          const internalAdapter = context?.context.internalAdapter;
          if (!adapter || !internalAdapter) return;

          const user = await adapter.findOne<{
            id: string;
            email: string;
            emailVerified: boolean;
          }>({
            model: "user",
            where: [{ field: "id", value: account.userId }],
          });

          // Fresh social sign-up: the user row is created from this same
          // verified identity, so there is no pre-existing claim to protect.
          if (!user || user.emailVerified) return;

          const existing = await adapter.findMany<{
            id: string;
            providerId: string;
          }>({
            model: "account",
            where: [{ field: "userId", value: user.id }],
          });

          const decision = decideAccountLink({
            providerId: account.providerId,
            userExists: true,
            userEmailVerified: user.emailVerified,
            existingProviderIds: existing.map((a) => a.providerId),
            hasOrderHistory: await hasOrderHistory(user.id),
          });

          if (decision === "allow") return;

          if (decision === "refuse") {
            throw new APIError("UNAUTHORIZED", {
              message:
                "This email is already associated with an existing account. Sign in with your existing method, then link this provider from your account settings.",
            });
          }

          // Reclaim: the unverified password never proved ownership of this
          // address, while the incoming identity did. Drop the stale credential
          // so the pre-claimer keeps no way back in, then let the link proceed.
          for (const credential of existing.filter(
            (a) => a.providerId === "credential",
          )) {
            await internalAdapter.deleteAccount(credential.id);
          }

          // The name/image on the row were chosen by whoever pre-claimed the
          // address, not by its real owner. Reset them to a neutral default so
          // no attacker-supplied content survives on the reclaimed account.
          await internalAdapter.updateUser(user.id, {
            name: user.email.split("@")[0],
            image: null,
          });
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
