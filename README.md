# Next.js Ecommerce Template

Storefront starter with a public catalog, authenticated cart and checkout, Stripe
fulfillment, and an admin catalog that stays in sync with Stripe. Built for
App Router, a least-privilege Postgres layout, and a Principal-bound data layer.

Live demo: [ecommerce-template-mpc.vercel.app](https://ecommerce-template-mpc.vercel.app)

## Stack

| Layer | Choice |
| --- | --- |
| App | Next.js 16.3 (App Router, Cache Components), React 19, TypeScript |
| UI | Tailwind CSS, Radix UI, TanStack Query |
| Auth | Better Auth (email/password; Google is opt-in) |
| Data | Drizzle ORM on Supabase PostgreSQL (`app_private`) |
| Payments | Stripe Checkout (server-priced line items) |
| Media | Supabase Storage (`product-images`: JPEG, PNG, WebP) |
| Mail | Nodemailer over explicit SMTP (optional) |
| Validation | Zod |

Shared domain language lives in [`CONTEXT.md`](CONTEXT.md). Architecture and
invariants are in
[`docs/architecture/verifiable-auth-data-fulfillment.md`](docs/architecture/verifiable-auth-data-fulfillment.md).

## Features

- Catalog with categories, variants, search, and help pages
- Cart and wishlist (session required; data is scoped to the signed-in Principal)
- Stripe Checkout from a server-built cart snapshot, not a client-supplied price
- Order history and a result page that only loads a session the buyer owns
- Admin product create/edit with Stripe catalog sync and replay for failed work
- Background fulfillment and catalog-sync crons (Vercel, every 5 minutes)
- Optional order-confirmation and merchant-notification email

## Prerequisites

- Node.js 24 (what CI uses) and npm
- PostgreSQL 15 or newer, typically via [Supabase](https://supabase.com)
- A Stripe account, or the local Stripe emulator for development

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy [`.env.example`](.env.example) to `.env.local` and fill the values
   described below.

3. For a **fresh** database, bootstrap roles, migrate, verify, then promote the
   first admin. For a **populated** database, follow the
   [database cutover runbook](docs/runbooks/database-cutover.md) instead of
   applying ad-hoc schema changes.

   ```bash
   npm run db:migrate
   npm run db:verify
   npm run auth:bootstrap-admin
   ```

4. Start the app:

   ```bash
   npm run dev
   ```

5. Open <http://localhost:3000>.

`db:push` is disabled. Generate a reviewed migration with `db:generate`, apply
it with `db:migrate`.

## Configuration

Keep `NEXT_PUBLIC_APP_URL` and `BETTER_AUTH_URL` on the same canonical origin.
`APP_URL` is an optional server-only override; when set, it must use that same
origin.

The complete list of variables is in `.env.example`. These are the ones that
decide how the app boots:

| Variable | Role |
| --- | --- |
| `DATABASE_URL` | Runtime connection as `app_runtime` |
| `MIGRATION_DATABASE_URL` | `app_migrator`; `db:migrate` then assumes `app_owner` |
| `VERIFY_DATABASE_URL` | Least-privileged connection for `db:verify` |
| `AUTH_DATABASE_LAYOUT` | Must be `app_private` |
| `BETTER_AUTH_SECRET` | Session signing secret |
| `ADMIN_USER_ID` | Better Auth user id promoted by `auth:bootstrap-admin` |
| `CRON_SECRET` | Bearer secret for `/api/cron/*` |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Storage and project URL |
| `SUPABASE_PROJECT_REF`, `SUPABASE_ACCESS_TOKEN` | Hosted Data API / Storage apply (`db:apply-hosted`) |

`ADMIN_BOOTSTRAP_DATABASE_URL` is only for the temporary legacy-public cutover
in the runbook. Do not put `role=` in `MIGRATION_DATABASE_URL`.

### Auth

Email/password registration opens a session immediately. The app does not send
or require a verification email, because SMTP is optional and often unset.

Google sign-in is opt-in. Register the exact callback
`http://localhost:3000/api/auth/callback/google` (and the HTTPS production
equivalent) in Google Cloud, set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`,
then set both `GOOGLE_AUTH_ENABLED=true` and
`NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true`. The server fails closed when the flags
differ. Keep both `false` until the callback is registered.

OAuth cannot reclaim or rewrite an unverified credential account. Linking
another provider still requires the existing local account to be verified.

Promote the first administrator by user id, not by email:

```bash
ADMIN_USER_ID=<better-auth-user-id> npm run auth:bootstrap-admin
```

### Email

Delivery is disabled until `EMAIL_SERVER_HOST` names an explicit SMTP
transport. A configured host also needs a valid port, user, password, sender
(`EMAIL_FROM`), and contact recipient (`EMAIL_CONTACT_TO` or `ADMIN_EMAIL`).
Partial configuration fails before Nodemailer creates a transport. Gmail can be
used with its SMTP host; credentials alone never enable a Gmail fallback.

Without SMTP, sign-up still works. Order confirmation and merchant notification
emails do not.

### Local Stripe

In development, set `STRIPE_EMULATOR_URL` to a loopback HTTP origin (no path,
credentials, or query). Example:

```bash
npx emulate --service stripe
```

Then point `STRIPE_EMULATOR_URL` at the emulator origin (default
<http://localhost:4000> when Stripe runs alone). The variable is rejected in
`NODE_ENV=production`.

The live webhook endpoint is `/api/stripe/webhooks`.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Next.js dev server |
| `npm run build` / `npm start` | Production build and server |
| `npm test` | Node.js test runner |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run verify:architecture` | Import-boundary and layering checks |
| `npm run verify:release` | Production evidence gate |
| `npm run db:generate` | Drizzle Kit migration |
| `npm run db:migrate` | Role-aware migrator (`app_migrator` → `app_owner`) |
| `npm run db:verify` | Schema and privilege verifier |
| `npm run db:apply-hosted` / `db:verify-hosted` | Push and check Supabase Data API + `product-images` |
| `npm run db:mark-cutover` | Record applied migrations after a cutover |
| `npm run db:studio` / `db:pull` | Drizzle Kit as `app_owner` via the migrator session |
| `npm run auth:bootstrap-admin` | Grant `admin` to `ADMIN_USER_ID` |
| `npm run doctor` | React Doctor on the full tree |

`db:migrate` authenticates as `app_migrator`, proves that role cannot run
private DDL directly, then `SET ROLE app_owner` before applying the official
Drizzle journal.

`db:apply-hosted` uses the lockfile-pinned Supabase CLI to push
`supabase/config.toml` to `SUPABASE_PROJECT_REF`, then verifies the Data API
allowlist and the public `product-images` bucket (5 MiB, JPEG/PNG/WebP). It
needs `SUPABASE_ACCESS_TOKEN` and `SUPABASE_SERVICE_ROLE_KEY`. The service-role
key is withheld from the CLI config-push subprocess.

## Architecture

`src/lib/identity` is the only request-credential boundary. It returns opaque
user Principals (or purpose-limited system Principals for fulfillment and
catalog sync). UI role checks are advisory; writes repeat the authoritative
check.

`src/lib/data-access` is the application interface to repositories. Public
catalog reads are separate from Principal-bound cart, wishlist, order,
checkout, and admin operations.

Checkout persists a server-created snapshot (at most 100 lines). Stripe
metadata holds only an opaque checkout-intent id. Fulfillment reconciles the
charged amount against that snapshot; the live cart is never a fulfillment
input. Webhooks record an event receipt and work row, then a worker (or the
5-minute cron) completes the order.

## Deployment

- Set every required variable in the host (Vercel Production, Preview, and
  Development as needed).
- Point Stripe webhooks at `https://<origin>/api/stripe/webhooks`.
- Run `npm run db:migrate` before shipping code that depends on a new schema.
- Never use `db:push`.
- Production builds run `npm run verify:release` and fail until
  `RELEASE_CUTOVER_EVIDENCE`, `RELEASE_HOSTED_EXPOSURE_EVIDENCE`, and
  `RELEASE_CREDENTIAL_ROTATION_EVIDENCE` point at the approved restore
  rehearsal, hosted exposure report, and credential-rotation audit.
- Vercel crons call `/api/cron/fulfillment` and `/api/cron/catalog-sync` every
  five minutes. Both require `CRON_SECRET`.

## CI

Pull requests run `.github/workflows/ci.yml`: tests, a PostgreSQL 15 cutover
rehearsal, typecheck, lint, architecture and release-gate checks, `next build`,
and `npm audit` (all dependencies and production-only).

## License

MIT. See [LICENSE](LICENSE).
