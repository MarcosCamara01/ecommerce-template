# Next.js Ecommerce Template

Modern ecommerce starter built with Next.js 16, React 19, App Router, Drizzle ORM, Supabase, Better Auth, Stripe, TanStack Query, Tailwind CSS, and Zod.

## Stack

- Next.js 16 with App Router and Cache Components
- React 19 and TypeScript strict mode
- Tailwind CSS and TanStack Query
- Drizzle ORM with Supabase PostgreSQL
- Better Auth, Stripe Checkout, Zod, and Nodemailer

## Features

- Product catalog with categories and variants
- Shopping cart and wishlist
- Stripe checkout and order history
- Admin product management
- Email notifications
- Type-safe validation and data access

## Getting Started

1. Install dependencies.

    npm install

2. Create .env.local from .env.example. Keep `NEXT_PUBLIC_APP_URL` and
   `BETTER_AUTH_URL` on the same canonical origin. `APP_URL` is an optional
   server-only override and, when set, must use that same origin.

   Google sign-in is opt-in. Register the exact callback
   `http://localhost:3000/api/auth/callback/google` (and the equivalent HTTPS
   production callback) in Google Cloud, configure `GOOGLE_CLIENT_ID` and
   `GOOGLE_CLIENT_SECRET`, then set both `GOOGLE_AUTH_ENABLED=true` and
   `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true`. The server fails closed when the
   flags differ. Keep both false until the callback is registered so neither
   the UI nor the auth endpoint advertises a provider that cannot complete.

3. Configure the database roles and URLs before applying migrations:

    DATABASE_URL is the app runtime connection.
    MIGRATION_DATABASE_URL authenticates as app_migrator; db:migrate then assumes app_owner.
    VERIFY_DATABASE_URL is the least-privileged connection used by db:verify.
    AUTH_DATABASE_LAYOUT must be app_private.
    The first-admin bootstrap uses MIGRATION_DATABASE_URL together with ADMIN_USER_ID.
    ADMIN_BOOTSTRAP_DATABASE_URL is only for the temporary legacy-public cutover described in the runbook.
    CRON_SECRET is required for scheduled operational flows.

4. For a fresh database, run migrations and verify the resulting schema.

    npm run db:migrate
    npm run db:verify

5. For an existing database, follow the [database cutover runbook](docs/runbooks/database-cutover.md) instead of applying ad-hoc schema changes.

6. Start the development server.

    npm run dev

7. Open http://localhost:3000.

## Environment Variables

The complete list is maintained in .env.example. The database variables above intentionally use separate credentials so application runtime access cannot run migrations.

Email delivery is disabled unless `EMAIL_SERVER_HOST` names an explicit SMTP
transport. A configured host requires a valid port, user, password, sender, and
contact recipient; partial configuration fails before Nodemailer creates a
transport. Gmail can be used explicitly with its SMTP host, but credentials
alone never enable Gmail service fallback.

## Scripts

    npm run dev
    npm run build
    npm run start
    npm run lint
    npm run typecheck

    npm run db:generate
    npm run db:migrate
    npm run db:verify
    npm run db:apply-hosted
    npm run db:verify-hosted
    npm run db:mark-cutover
    npm run db:studio
    npm run db:pull

`db:generate` uses the pinned Drizzle Kit. `db:migrate` uses the official Drizzle
ORM migrator through a role-aware wrapper so authentication as `app_migrator`,
the direct-DDL denial probe, `SET ROLE app_owner`, and migration application all
happen in the required order. `db:studio` and `db:pull` verify the
`app_migrator` session and assume `app_owner` only for their Drizzle Kit
subprocess; do not put `role=` in `MIGRATION_DATABASE_URL`.

db:push is intentionally disabled. Generate a reviewed migration with db:generate, apply it with db:migrate, and use the cutover runbook for an already populated database.

`db:apply-hosted` uses the lockfile-pinned Supabase CLI to push
`supabase/config.toml` to the explicit `SUPABASE_PROJECT_REF`, then runs the
Management API and read-only Storage verifier. It requires
`SUPABASE_ACCESS_TOKEN` for project configuration and
`SUPABASE_SERVICE_ROLE_KEY` for the exact `product-images` bucket check. The
service-role key is withheld from the CLI config-push subprocess and is used
only by the verifier; use credentials scoped to the reviewed target.

## Deployment Notes

- Configure every required environment variable in the deployment platform.
- Use a public webhook URL for Stripe.
- Apply npm run db:migrate before deploying application code that depends on a schema change.
- Never use db:push in any environment.
- Production builds run `npm run verify:release` and fail closed until
  `RELEASE_CUTOVER_EVIDENCE`, `RELEASE_HOSTED_EXPOSURE_EVIDENCE`, and
  `RELEASE_CREDENTIAL_ROTATION_EVIDENCE` reference the approved external
  restore rehearsal, hosted exposure report, and credential-rotation audit.
- Set NEXT_PUBLIC_APP_URL and BETTER_AUTH_URL to the same production origin. If
  APP_URL is set as a server-only override, it must match them.

## License

MIT. See [LICENSE](LICENSE).
