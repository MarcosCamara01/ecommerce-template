# Pentest fixes 2026-11-22

This file maps each finding in the 2026-11-22 pentest backlog (FIX-01 to FIX-13) to its commit, its files, and the evidence that proves it. The backlog itself stays out of the repository because it holds test credentials and Supabase keys.

Branch `fix/pentest-2026-11-22`, based on `master` at `dec8856` (the commit the pentest ran against). One commit per finding, P0 to P3. One stacked PR per phase.

| Phase | PR | Base |
|---|---|---|
| P0 (FIX-01, FIX-02) | https://github.com/MarcosCamara01/ecommerce-template/pull/117 | `master` |
| P1 (FIX-03, FIX-04, FIX-05) | https://github.com/MarcosCamara01/ecommerce-template/pull/118 | P0 |
| P2 (FIX-06 to FIX-09) | https://github.com/MarcosCamara01/ecommerce-template/pull/119 | P1 |
| P3 (FIX-10 to FIX-13) | https://github.com/MarcosCamara01/ecommerce-template/pull/120 | P2 |
| FIX-01 follow-up (Vercel finding `01M81NC83`) | https://github.com/MarcosCamara01/ecommerce-template/pull/121 | `master` |

## Findings

| ID | State | Commit | Files |
|---|---|---|---|
| FIX-01 | fixed | `abcc9f7` | `src/app/api/stripe/payment/route.ts` (+test), `src/lib/cart/checkout-intent-plan.ts` (+test), `src/lib/db/drizzle/repositories/checkout.repository.ts`, `src/lib/data-access/index.ts` |
| FIX-02 | fixed, applied in production | `bde5f1b` | `scripts/bootstrap-admin.ts`, `scripts/database/cutover-contract.test.mjs`, `README.md` |
| FIX-03 | fixed | `5ac2747` | `src/lib/db/drizzle/repositories/cart.repository.ts` (+test), `src/lib/data-access/index.ts`, `src/lib/data-access/cart-addition.test.mjs`, `src/lib/http/user-route.ts`, `src/app/api/user/cart/route.test.mjs` |
| FIX-04 | fixed | `0c27007` | `src/app/admin/products/create/page.tsx` (+test) |
| FIX-05 | already-correct, behavior pinned by tests | `d50d8f3` | `src/utils/auth-sign-up.test.mjs` |
| FIX-06 | fixed, live | `28e7763` | `next.config.js`, `next.config.test.mjs` |
| FIX-07 | fixed (safe variant), live | `1940eec` | `src/app/api/auth/[...all]/route.ts` (+test), `src/app/api/auth/email-form/route.test.mjs`, `src/lib/auth/form-errors.ts` (+test), `src/utils/auth.ts` |
| FIX-08 | fixed | `e7c23aa` | `src/lib/auth/verification-link.ts` (+test), `src/utils/auth.ts`, `src/utils/auth-sign-up.test.mjs` |
| FIX-09 | fixed; Storage applied in production, Supabase settings pending | `b888c2a` | `supabase/config.toml`, `supabase/migrations/20261122000000_product_images_storage_policies.sql`, `scripts/database/verify-hosted-exposure.mjs` (+test), `scripts/database/apply-hosted-exposure.test.mjs`, `README.md`, `docs/runbooks/database-cutover.md`, `docs/architecture/acceptance-evidence.md`, `.react-doctor/false-positives.md` |
| FIX-10 | already-correct, contract documented | `0042193` | `README.md` |
| FIX-11 | fixed | `a1ccb82` | `src/proxy.ts`, `src/proxy.test.mjs` |
| FIX-12 | fixed | `cad2105` | `src/app/robots.ts` (+test), `src/app/sitemap.ts` (+test), `src/lib/routing/unknown-path.ts` (+test), `src/proxy.test.mjs` |
| FIX-13 | already-correct, contract pinned and documented | `a47a51d` | `src/lib/identity/internal-request.test.mjs`, `README.md` |
| FIX-01 follow-up | fixed; migration 0019 pending in production | `948c4db` | `drizzle/migrations/0019_checkout-intent-retire.sql` (+meta), `src/app/api/stripe/payment/route.ts` (+test), `src/lib/db/drizzle/repositories/checkout.repository.ts`, `src/lib/data-access/index.ts`, `scripts/database/checkout-binding-contract.ts` (+test), `scripts/database/verify.ts`, `scripts/database/schema-contract.ts`, `scripts/database/cutover-existing.sql`, `scripts/database/bootstrap-roles.sql`, `scripts/database/cutover-contract.test.mjs`, `scripts/database/runtime-product-privileges.test.mjs` |

## Where the backlog's suggestion was not followed

Each of these suggestions would have weakened a control the backlog's "Do not break" list or another finding depends on.

- **FIX-01.** Fulfillment still turns every paid session into an order. Suppressing the order of a session that was paid would hide a real charge. The fix stops the second charge earlier: one payable session per cart line.
- **FIX-05.** Sign-up of an existing email keeps its synthetic 200, and `role` stays refused at sign-up. Returning `USER_ALREADY_EXISTS` would allow account enumeration. Accepting `role` would allow anyone to become admin.
- **FIX-06.** `script-src` is `'self' 'unsafe-inline'`, not `'self'`. The App Router streams each page's RSC payload in inline scripts, and the theme bootstrap is inline too. Under Cache Components there is no per-request nonce, and a hash cannot cover per-page payloads. A bare `'self'` would break hydration on every page.
- **FIX-07.** `email-form` keeps forwarding the browser `Origin`. Rewriting it would let any site log a visitor into an attacker's account (login CSRF), and FIX-11 requires the opposite for every other write. A cross-site post now lands on the form with a clear error instead of `error=UNKNOWN`, and still gets no cookie. CORS headers are sent only for an exact trusted origin.
- **FIX-09.** `app_private` stays unexposed (`schemas = []`), and `authenticated` gets no UPDATE or DELETE policy. With GoTrue sign-up open, such a policy would let any self-registered stranger overwrite or delete catalog images. Instead GoTrue sign-up is closed and the `authenticated` INSERT policy is dropped. The app keeps writing with the service role.
- **FIX-13.** `x-vercel-cron: 1` is not accepted as a credential, because any client can send it. Vercel sends the bearer secret on every cron call.

## Verification

### What could not be run here

Credentials stay out of this verification. The hosted host is not a test-labeled environment, so no sign-in with a password was made on it. The checks that need a signed-in user or admin (FIX-01 end to end, FIX-02, FIX-03, FIX-04 with a user cookie, FIX-08 with a real mail link) are listed with the exact command to run and the result to expect. They are proven here by tests that drive the real code paths, and FIX-01 also by real Stripe test mode.

There is no local Postgres or Docker on this machine, so the app could not run locally against a non-production database.

The post-fix live checks below ran on `https://ecommerce-template-mpc.vercel.app/` after P0 to P2 merged.

### Baseline on production before the fixes

Unauthenticated probes, under 20 requests per second.

```text
### FIX-06 CSP (GET /login)
HTTP/1.1 200 OK
Access-Control-Allow-Origin: *
Content-Security-Policy: frame-ancestors 'none'; base-uri 'self'; object-src 'none'
### FIX-07 ACAO get-session trusted origin
HTTP/1.1 200 OK
### FIX-07 preflight
HTTP/1.1 204 No Content
Allow: GET, HEAD, OPTIONS, POST
### FIX-04 /admin/products/create anon
307 https://ecommerce-template-mpc.vercel.app/login
### FIX-11 cross-origin POST /api/user/cart (anon)
{"error":"authentication_required"} [401]
### FIX-11 cross-origin POST /api/stripe/payment (anon)
{"statusCode":401,"message":"Unauthorized"} [401]
### FIX-11 cross-origin DELETE /api/admin/products (anon)
{"error":"Unauthorized"} [401]
### FIX-12 robots/sitemap
robots.txt 404 text/html; charset=utf-8
sitemap.xml 404 text/html; charset=utf-8
### FIX-13 cron
{"error":"Unauthorized"} [401]
{"error":"Unauthorized"} [401]
### FIX-01 unauth payment
{"statusCode":401,"message":"Unauthorized"} [401]
```

### FIX-01

Command: the real `route.ts`, real Stripe test mode, an in-memory intent store with the per-user lock. 15 concurrent POSTs for the same cart, then a reuse, a quantity change, and a change back. The script is `fix01-stripe-race.mjs` in the session scratchpad. It refuses to run without an `sk_test_` key and expires every session it creates.

Before (the `dec8856` route):

```text
<claude-code-hint v="1" type="plugin" value="stripe@claude-plugins-official" />
(node:55028) [MODULE_TYPELESS_PACKAGE_JSON] Warning: Module type of file:///C:/Users/marco/proyectos/ecommerce-template/src/lib/cart/checkout-intent-plan.ts is not specified and it doesn't parse as CommonJS.
Reparsing as ES module because module syntax was detected. This incurs a performance overhead.
To eliminate this warning, add "type": "module" to \\?\C:\Users\marco\proyectos\ecommerce-template\package.json.
(Use `node --trace-warnings ...` to show where the warning was created)
same cart x15 concurrent: HTTP codes 200,200,200,200,200,200,200,200,200,200,200,200,200,200,200
same cart x15 concurrent: total responses 15; distinct session ids 15
Stripe sessions created: 15
cleanup: expired 15 open probe sessions
```

After:

```text
<claude-code-hint v="1" type="plugin" value="stripe@claude-plugins-official" />
same cart x15 concurrent: HTTP codes 200,200,200,200,200,200,200,200,200,200,200,200,200,200,200
same cart x15 concurrent: total responses 15; distinct session ids 1
Stripe sessions created: 1
same cart again (sequential reuse): HTTP codes 200
same cart again (sequential reuse): total responses 1; distinct session ids 1
reused the open session: true
quantity changed to 2: HTTP codes 200
quantity changed to 2: total responses 1; distinct session ids 1
new session differs: true; superseded session status: expired
quantity back to 1: HTTP codes 200
quantity back to 1: total responses 1; distinct session ids 1
fresh session after expired match: true; quantity-2 session status: expired
Stripe sessions created: 3
cleanup: expired 1 open probe sessions
```

The pentest's "paying twice" needs two payable sessions. With one session per cart line, a second payment of the same lines cannot start. To confirm on the deployment once merged, sign in as a test user, put one line in the bag, and fire 15 concurrent `POST /api/stripe/payment {"cartItemIds":[<id>]}`. Expect 15 responses with the same `url`.

Unit and integration tests:

```text
$ node --test src/app/api/stripe/payment/route.test.mjs src/lib/cart/checkout-intent-plan.test.mjs
✔ malformed checkout JSON returns a clear 400
✔ Zod and unavailable cart items remain 400
✔ missing identity remains 401
✔ unexpected checkout failures remain 500
✔ resolved checkout snapshots are bounded before intent persistence
✔ Stripe aggregate charge limits are enforced before intent persistence
✔ Checkout Sessions carry the stable integration identifier
✔ checkout intent snapshots immutable product display facts
✔ Checkout return URLs use the configured canonical application origin
✔ concurrent checkouts of the same cart share one Checkout Session
✔ the session is created under the intent's idempotency key and expiry
✔ an open session for the same cart is returned instead of a new one
✔ a cart whose session is already paid goes to its result page
✔ superseded open sessions are expired before a new one is created
✔ a superseded session that was already paid stops the new charge
✔ a superseded session expired by a concurrent request is not an error
✔ an expired session for the same cart is replaced by a fresh intent
✔ an open intent for the same lines is reused whatever their order
✔ an unbound intent for the same lines is reused so its session is created once
✔ a changed quantity starts a new intent and supersedes the old session
✔ a changed price never reuses the old session
✔ a wider selection supersedes every open session sharing one of its lines
✔ an identical intent close to expiry is superseded instead of reused
✔ the newest matching intent wins and older duplicates are superseded
✔ stale intents are neither reused nor expired again
✔ an unbound overlapping intent has no session to expire
ℹ tests 26
ℹ pass 26
ℹ fail 0
```

### FIX-02

The code change is one line in `auth:bootstrap-admin`. For it to take effect, an operator runs it once against production:

```bash
ADMIN_USER_ID=<admin user id> MIGRATION_DATABASE_URL=<app_migrator URL> npm run auth:bootstrap-admin
# Admin bootstrap complete
```

Then expect `POST /api/auth/sign-in/email` for the admin to return 200 with `Set-Cookie`, `GET /admin` with that cookie to return 200 rather than 307, and `GET /api/auth/admin/list-users` to return 200.

Unit and integration tests:

```text
$ node --test scripts/database/cutover-contract.test.mjs
✔ SQL migrations use UTF-8 without a byte-order mark
✔ schema constraint identifiers fit PostgreSQL's 63-byte limit
✔ existing-database cutover backfills durable order status and display snapshots
✔ existing-database cutover materializes or structurally validates every canonical index
✔ existing-database cutover materializes durable catalog archive identity
✔ fresh migrations and existing-database cutover preserve catalog preparation commands
✔ missing index detection survives later PL/pgSQL queries
✔ fresh migrations and existing-database cutover enforce OAuth account uniqueness
✔ structural contract preserves and compares unique NULL semantics
✔ database inspection and cutover require PostgreSQL NULL-semantics metadata
✔ existing-database cutover preserves historical Stripe price evidence
✔ database bootstrap removes implicit PUBLIC function execution
✔ existing-database cutover removes every unrecognized private ACL
✔ migrator reaches private DDL only by assuming app_owner
✔ private admin bootstrap verifies migrator and assumes app_owner
✔ database CREATE belongs only to the explicit owner role
✔ database bootstrap pre-creates the app_owner migration ledger schema
✔ cutover marking certifies SQL-only checkout binding artifacts
✔ database bootstrap transfers every existing ledger relation before revoking access
✔ temporary price evidence remains with one documented cutover actor
✔ cutover accepts only complete archived evidence when prepared evidence is absent
✔ fresh migration and cutover expose identical sequence capabilities
✔ schema comparison rejects a constraint with the right name and wrong definition
✔ constraint contract rejects NOT VALID and wrong deferrability metadata
✔ cutover validates pre-existing checks and foreign keys before certification
✔ schema comparison rejects a same-named index with the wrong definition
✔ schema inspection includes extra indexes regardless of their name
✔ constraint-backed indexes are excluded structurally and not double-counted
✔ check expressions compare semantically across PostgreSQL rewrites
✔ cutover rejects non-canonical check definitions instead of trusting names
✔ default function ACL verification fails closed without a private-schema row
✔ default function ACL verification accepts only the canonical owner-only rows
✔ bootstrap accepts only PostgreSQL's exact creator administration grant
✖ bootstrap scopes temporary owner access to one transaction
✔ cutover auth smoke generates its input only at runtime
✔ app_owner verification distinguishes administration from usable membership
ℹ tests 36
ℹ pass 35
ℹ fail 1
✖ failing tests:
✖ bootstrap scopes temporary owner access to one transaction
```

The one failure in that file, `bootstrap scopes temporary owner access to one transaction`, is a known CRLF artifact of this Windows checkout and fails on `master` too.

### FIX-03

Expected on the deployment with a user cookie: `PATCH /api/user/cart {"id":<id>,"quantity":2147483647}` gives 200, then `POST /api/user/cart` with +1 gives `400 {"error":"Quantity limit exceeded"}`.

Unit and integration tests:

```text
$ node --test src/app/api/user/cart/route.test.mjs src/lib/data-access/cart-addition.test.mjs src/lib/db/drizzle/repositories/cart.repository.test.mjs
✔ malformed cart JSON returns 400
✔ cart preserves auth, Zod, and operational error mappings
✔ archived cart additions return 404
✔ adding past the cart line quantity limit returns 400
✔ cart and wishlist routes share HTTP behavior and call data access directly
✔ a cart addition past the line limit is a quantity limit error
✔ an unavailable cart addition stays not found
✔ an accepted cart addition returns the stored line
✔ a cart addition never sums a line past the int4 quantity column
ℹ tests 9
ℹ pass 9
ℹ fail 0
```

### FIX-04

Live, the proxy still redirects first, so the server check only matters when the proxy is bypassed. That case is what the test covers.

Unit and integration tests:

```text
$ node --test src/app/admin/products/create/page.test.mjs
✔ a user without catalog management never receives the create form
✔ a catalog manager receives the create form
ℹ tests 2
ℹ pass 2
ℹ fail 0
```

### FIX-05

Read-only query on the hosted database, giving aggregates only:

```text
{
  severity_local: 'WARNING',
  severity: 'WARNING',
  code: '25P01',
  message: 'SET TRANSACTION can only be used in transaction blocks',
  file: 'xact.c',
  line: '3577',
  routine: 'CheckTransactionBlock'
}
constraint user_email_unique: UNIQUE (email)
users=67 distinct_emails=67 distinct_lower_emails=67
connected as postgres
```

The `SET TRANSACTION` warning is harmless: the query ran outside a transaction block and wrote nothing.

Unit and integration tests:

```text
$ node --test src/utils/auth-sign-up.test.mjs
✔ signing up an existing email creates no row and answers like a new account
✔ sign-up refuses a role and creates nothing
✔ sign-up ignores client-chosen id, verification and ban fields
ℹ tests 3
ℹ pass 3
ℹ fail 0
```

### FIX-06

Unit and integration tests:

```text
$ node --test next.config.test.mjs
✔ the configured Supabase origin is allowed for Storage images
✔ photos are served as AVIF or WebP, at photo quality, and cached for a month
✔ every response refuses framing and sends the defensive headers
✔ in production, scripts, styles, fonts, requests and form posts stay on the store's origin
✔ only development allows eval and Vercel's debug scripts
✔ only a Preview deployment lets the Vercel toolbar load
✔ no remote image host is open at every path
ℹ tests 7
ℹ pass 7
ℹ fail 0
```

### FIX-07

Unit and integration tests:

```text
$ node --test src/app/api/auth/[...all]/route.test.mjs src/app/api/auth/email-form/route.test.mjs src/lib/auth/form-errors.test.mjs
✔ a successful sign-in follows callbackURL with every session cookie
✔ an unverified sign-in returns to /login with EMAIL_NOT_VERIFIED and keeps the destination
✔ a foreign callbackURL falls back to /
✔ a sign-up post cannot create an account through the sign-in fallback
✔ a sign-in posted from another site returns to the form with its refusal and no session cookie
✔ the same sign-in from the store's own login page signs in
✔ no error flags no field
✔ a wrong email or password flags both, and never the name
✔ a short password flags only the password
✔ an unverified email, an expired link or a rate limit flags no field
✔ a form sent from another site, or with no origin, says so and flags no field
✔ an error that names no field flags every field of the form
✔ a known code reads as the store's copy; an unknown one keeps its own message
✔ a query-string error is narrowed to a known code
ℹ tests 14
ℹ pass 14
ℹ fail 0
```

### FIX-08

Expected on the deployment with a fresh link from a pt- test inbox: the first `GET /api/auth/verify-email?token=<JWT>&callbackURL=%2Femail-verification` returns 302 to `/email-verification`. The second returns 302 to `/email-verification?error=INVALID_TOKEN`.

Unit and integration tests:

```text
$ node --test src/lib/auth/verification-link.test.mjs
✔ a verification link verifies the address once and is refused after that
✔ a link re-sent on sign-in verifies an unverified address, then every link is spent
✔ a token not signed with the auth secret verifies nothing and reads the same for every account
✔ a used link with an untrusted callbackURL still fails the origin check
ℹ tests 4
ℹ pass 4
ℹ fail 0
```

### FIX-09

`npm run db:verify-hosted`, as asked, needs a Supabase Management token, which this machine does not have:

```text
$ npm run db:verify-hosted

> store-template@0.1.0 db:verify-hosted
> node scripts/database/verify-hosted-exposure.mjs

SUPABASE_ACCESS_TOKEN, SUPABASE_PROJECT_REF, SUPABASE_SERVICE_ROLE_KEY are required
exit=1
```

Read-only snapshot of the hosted policies, showing the drift the migration removes:

```text
policy "Allow authenticated uploads" PERMISSIVE INSERT TO public USING null WITH CHECK ((bucket_id = 'product-images'::text) AND (auth.role() = 'authenticated'::text))
policy "Public read access" PERMISSIVE SELECT TO public USING (bucket_id = 'product-images'::text) WITH CHECK null
authenticator role config: session_preload_libraries=safeupdate | statement_timeout=8s | lock_timeout=8s
```

Unit and integration tests:

```text
$ node --test scripts/database/verify-hosted-exposure.test.mjs scripts/database/apply-hosted-exposure.test.mjs
✔ the pushed config exposes no Data API schema and closes GoTrue sign-up
✔ hosted exposure is verified only after the pinned config is pushed
✔ hosted exposure validates every verifier credential before config push
✔ hosted exposure reads Data API, Auth, Storage bucket, and Storage policies without mutating
✔ hosted exposure fails closed before Auth and Storage when PostgREST drifts
✔ hosted exposure rejects malformed PostgREST settings before Storage
✔ hosted exposure fails closed before Storage when GoTrue sign-up is open
✔ hosted exposure rejects malformed Auth settings before Storage
✔ hosted exposure requires the product-images bucket
✔ hosted exposure rejects every incorrect product-images bucket setting
✔ hosted exposure rejects malformed Storage success responses
✔ hosted exposure accepts only public read of product-images on storage.objects
✔ hosted exposure rejects malformed Storage policy rows
✔ hosted exposure times out Storage reads without exposing credentials
✔ hosted exposure sanitizes network and HTTP failures
✔ hosted exposure requires a service role and a safe hosted project ref
ℹ tests 35
ℹ pass 35
ℹ fail 0
```

### FIX-10

On production, six spoofed `X-Forwarded-For` values hit 429 on the fourth request, the same as with no header. The Vercel runtime logs for that window show the six requests and no "could not determine a client IP" warning, so Better Auth keyed each request on one client IP that Vercel had overwritten.

```text
### FIX-10 rotating X-Forwarded-For, POST /api/auth/sign-in/social (rule: 3 per 10s)
xff=203.0.113.1 -> 404
xff=203.0.113.2 -> 404
xff=203.0.113.3 -> 404
xff=203.0.113.4 -> 429
xff=203.0.113.5 -> 429
xff=203.0.113.6 -> 429
### FIX-10 no X-Forwarded-For
plain #1 -> 404
plain #2 -> 404
plain #3 -> 404
plain #4 -> 429
plain #5 -> 429
plain #6 -> 429
```

### FIX-11

Unit and integration tests:

```text
$ node --test src/proxy.test.mjs
✔ cookie-bearing writes from another origin or without one are refused
✔ same-origin writes and writes without a cookie reach the route
✔ reads are not origin-checked
✔ webhooks, cron jobs, and Better Auth keep their own credential checks
✔ unknown paths sharing a protected prefix reach 404 handling without auth
✔ robots.txt and sitemap.xml reach their metadata routes
✔ real protected paths still redirect anonymous visitors to login
✔ orders admit signed-in users while admin descendants require catalog capability
✔ scheduled jobs run on the deployment host instead of being redirected
✔ canonical host redirects still precede protected-route authorization
ℹ tests 10
ℹ pass 10
ℹ fail 0
```

### FIX-12

Unit and integration tests:

```text
$ node --test src/app/robots.test.mjs src/app/sitemap.test.mjs src/lib/routing/unknown-path.test.mjs
✔ crawlers may fetch the storefront
✔ crawlers are kept off private, transactional, and account pages
✔ robots.txt points at the sitemap on the canonical origin
✔ the sitemap lists the storefront pages and every live product on the canonical origin
✔ the sitemap reads the catalog at request time, never while prerendering
✔ a catalog change revalidates the sitemap
✔ pathShould404
ℹ tests 11
ℹ pass 11
ℹ fail 0
```

### FIX-13

Unit and integration tests:

```text
$ node --test src/lib/identity/internal-request.test.mjs
✔ cron credentials fail closed when the server is not configured
✔ cron credentials reject a missing or incorrect bearer token
✔ cron credentials accept only the configured bearer token
✔ the x-vercel-cron header is not a cron credential
✔ cron routes share one HTTP credential adapter
ℹ tests 5
ℹ pass 5
ℹ fail 0
```

### FIX-01 follow-up

Vercel's security review flagged the FIX-01 code on #120 (`01M81NC83`, medium, denial of service). Superseded intents stayed open until their TTL, so every later checkout re-read each of their Stripe sessions. The route now retires the sessions Stripe confirms expired through `app_private.retire_checkout_intents`.

The new route test drives 50 quantity changes and then 10 identical retries. Without the retire call it fails with `actual: 1225, expected: 49`. With it:

```text
$ node --test src/app/api/stripe/payment/route.test.mjs scripts/database/checkout-binding-contract.test.mjs
✔ the canonical checkout intent functions are accepted (0.7761ms)
✔ cutover marking rejects body, owner, security, search path, and ACL drift (0.2916ms)
✔ a missing retirement function is rejected (0.1231ms)
✔ retirement can only shorten the caller's own unexpired intents (0.1117ms)
✔ malformed checkout JSON returns a clear 400 (108.8508ms)
✔ Zod and unavailable cart items remain 400 (17.5267ms)
✔ missing identity remains 401 (5.1454ms)
✔ unexpected checkout failures remain 500 (5.5517ms)
✔ resolved checkout snapshots are bounded before intent persistence (4.1745ms)
✔ Stripe aggregate charge limits are enforced before intent persistence (8.6082ms)
✔ Checkout Sessions carry the stable integration identifier (0.171ms)
✔ checkout intent snapshots immutable product display facts (4.7439ms)
✔ Checkout return URLs use the configured canonical application origin (0.1403ms)
✔ concurrent checkouts of the same cart share one Checkout Session (23.4581ms)
✔ the session is created under the intent's idempotency key and expiry (4.1838ms)
✔ an open session for the same cart is returned instead of a new one (3.9758ms)
✔ a cart whose session is already paid goes to its result page (3.7976ms)
✔ superseded open sessions are expired before a new one is created (3.7957ms)
✔ a superseded session that was already paid stops the new charge (3.7041ms)
✔ a superseded session expired by a concurrent request is not an error (3.5218ms)
✔ an expired session for the same cart is replaced by a fresh intent (4.6984ms)
✔ only sessions Stripe confirms expired are retired (3.4197ms)
✔ a paid superseded session is never retired (3.4784ms)
✔ each superseded session is read from Stripe until it is retired, not on every checkout (4.4633ms)
ℹ tests 24
ℹ pass 24
ℹ fail 0
```

Migration 0019 rehearsed on the hosted database in one transaction that always rolls back:

```text
PASS connected as app_migrator
PASS migration 0019 applies as app_owner
PASS function contracts hold []
PASS app_runtime can execute the retire function
PASS anon and authenticated cannot execute it
PASS app_runtime still cannot update expires_at directly
PASS another user's id retires nothing
PASS the owner's confirmed session leaves the open set, the other stays
PASS retiring twice is a no-op
PASS the repository's parameterised query retires by session id (3 params)
ROLLED BACK, nothing persisted
PASS function absent after rollback
```

### Post-fix live checks on production

P0 to P2 (#117, #118, #119) are merged, and production serves `dpl_7b4yyZgtUu2axHK3nrwCZDyjWuf3`. These are anonymous checks run with `live-after-p2.sh`, one request every 0.3 seconds:

```text
### deployment serving /
dpl_7b4yyZgtUu2axHK3nrwCZDyjWuf3
### FIX-06 CSP on /, /login, /cart, a product page
/ -> Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'self'; object-src 'none'
/login -> Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'self'; object-src 'none'
/cart -> Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'self'; object-src 'none'
/pants/66 -> Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'self'; object-src 'none'
### FIX-07 CORS, trusted origin
HTTP/1.1 200 OK
Access-Control-Allow-Credentials: true
Access-Control-Allow-Origin: https://ecommerce-template-mpc.vercel.app
Vary: Origin
### FIX-07 CORS, untrusted origin (expect no access-control-allow-*)
HTTP/1.1 200 OK
### FIX-07 preflight, trusted
HTTP/1.1 204 No Content
Access-Control-Allow-Credentials: true
Access-Control-Allow-Headers: content-type
Access-Control-Allow-Methods: GET, POST
Access-Control-Allow-Origin: https://ecommerce-template-mpc.vercel.app
### FIX-07 preflight, untrusted (expect no access-control-*)
HTTP/1.1 204 No Content
### FIX-04 /admin/products/create, anonymous
307 https://ecommerce-template-mpc.vercel.app/login
### Do not break
X-Frame-Options: DENY
webhook without signature -> {"error":"Webhook signature is required"} [400]
cron without secret -> {"error":"Unauthorized"} [401]
cron with x-vercel-cron only -> {"error":"Unauthorized"} [401]
admin products DELETE anonymous -> {"error":"Unauthorized"} [401]
cart GET anonymous -> {"error":"authentication_required"} [401]
orders anonymous -> 307 https://ecommerce-template-mpc.vercel.app/login
image optimizer to metadata host -> 400
unknown path -> 404
product page -> 200
```

FIX-06 acceptance in a real browser (the app's built-in browser, anonymous):

```text
Browser (built-in, anonymous) on production dpl_7b4yyZgtUu2axHK3nrwCZDyjWuf3:
/          34 images, 0 broken; Bag panel opens (client JS runs); CSP console messages: none
/pants/66  15 images, 0 broken; client redirect to ?variant=Khaki%20green ran; CSP console messages: none
/login     sign-in form renders; CSP console messages: none
/cart      bag page renders; CSP console messages: none
Only console entry on /: [warn] Feature-Policy and Permissions-Policy both set camera (pre-existing, not a CSP violation)
```

The previews could not be checked. They are behind Vercel Authentication, and no share link was created.

P3 (#120) merged as `febe3f7`, and production serves `dpl_FFzSK4tmK9D1vVyqto1nYvmdNYi8`. Same pacing, run with `live-after-p3.sh`:

```text
### deployment serving /
dpl_FFzSK4tmK9D1vVyqto1nYvmdNYi8
### FIX-11 cross-origin write with a cookie (expect invalid_origin 403)
{"error":"invalid_origin"} 403
### FIX-11 same-origin write with a cookie (expect 401, reaches the route)
{"error":"authentication_required"} 401
### FIX-11 webhook is exempt (expect 400 from the signature check)
{"error":"Webhook signature is required"} 400
### FIX-12 robots.txt and sitemap.xml
robots.txt 200 text/plain; charset=utf-8
User-Agent: *
Allow: /
Disallow: /admin
Disallow: /api/
Disallow: /cart
Disallow: /wishlist
Disallow: /orders
Disallow: /result
Disallow: /login
Disallow: /register
Disallow: /forgot-password
Disallow: /reset-password
Disallow: /email-verification

Sitemap: https://ecommerce-template-mpc.vercel.app/sitemap.xml

sitemap.xml 200 application/xml
sitemap urls: 32
### FIX-13 cron with x-vercel-cron only (expect 401)
{"error":"Unauthorized"} [401]
### Do not break
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; 
X-Frame-Options: DENY
cart GET anonymous -> {"error":"authentication_required"} [401]
orders anonymous -> 307 https://ecommerce-template-mpc.vercel.app/login
unknown path -> 404
product page -> 200
```

### Repository gates

```text
$ npm run typecheck

> store-template@0.1.0 typecheck
> tsc --noEmit

exit=0
$ npm test
exit=1
ℹ tests 584
ℹ suites 2
ℹ pass 576
ℹ fail 3
ℹ cancelled 0
ℹ skipped 5
ℹ todo 0
✖ failing tests:
✖ bootstrap scopes temporary owner access to one transaction (0.6482ms)
✖ the installed dependency contains the reviewed depth guards (3.1915ms)
✖ the theme has one control, in the navigation (19.2495ms)
$ npm run lint
✖ 376 problems (285 errors, 91 warnings)
  0 errors and 89 warnings potentially fixable with the `--fix` option.

exit=1
```

The 3 test failures are the known CRLF artifacts of this Windows checkout (`cutover-contract`, `braces`, `theme-store`), and they fail on `master` too. The lint errors all come from four older git worktrees nested under `.claude/worktrees/`. Without them, `npx eslint . --ignore-pattern ".claude/**"` exits 0. CI lints a clean checkout.

## Deploy notes

Production steps applied on 2026-11-22 with the owner's approval:

- **FIX-02.** `auth:bootstrap-admin` ran against production. The admin account now has `email_verified = true` and keeps its `admin` role.

  ```text
  $ ADMIN_USER_ID=<admin user id> npx tsx --env-file=.env.local scripts/bootstrap-admin.ts
  Admin bootstrap complete
  exit=0
  admin account: [{"id":"<admin user id>","role":"admin","emailVerified":true}]
  ```

- **FIX-09, Storage policies.** The migration ran once as `postgres`, in one transaction. Only the public read policy is left, and public product images still load.

  ```text
  applied 20261122000000_product_images_storage_policies.sql
  exit=0
  policy "Public read access" PERMISSIVE SELECT TO public USING (bucket_id = 'product-images'::text) WITH CHECK null
  authenticator role config: session_preload_libraries=safeupdate | statement_timeout=8s | lock_timeout=8s
  product page image via optimizer: 200 image/jpeg
  public image after policy change: 200 image/jpeg 77029
  ```

- **Pentest cleanup.** 11 test accounts on `@mailinator.com` were deleted, along with their sessions and credentials. None of them had a cart, wishlist, checkout intent or order. The run used `app_migrator` assuming `app_owner`, because `postgres` has no write access to `app_private`.

  ```text
  deleted users=11 sessions=3 accounts=11 verifications=0
    pt-x@mailinator.com
    pt-f1-browser@mailinator.com
    ptcheck123@mailinator.com
    pt.f8.1@mailinator.com
    pt.f8.3@mailinator.com
    pt-ma3@mailinator.com
    ptadmin.sufijo@mailinator.com
    ptadmin2@mailinator.com
    pt-mailtest@mailinator.com
    pt-f4-role@mailinator.com
    ptws1@mailinator.com
  app users whose email starts with pt: 1
  ```

  The pentest's Storage objects (`pt-f6/`, `outside.png`, `code42e.png`) and its GoTrue user were already gone. The only GoTrue user left is the owner's own account, and it was not touched.

Still for the operator:

1. #117 to #120 are merged and deployed. For #121, run `npm run db:migrate` on production first, then merge. Without the function, a checkout that supersedes a session fails with 500. Then run `npm run db:verify` with `VERIFY_DATABASE_URL` set to the runtime credential.
2. FIX-09, Supabase settings. Set `SUPABASE_PROJECT_REF` and `SUPABASE_ACCESS_TOKEN`, run `npm run db:apply-hosted`, then `npm run db:verify-hosted`. That closes GoTrue sign-up and aligns the Data API with `schemas = []`. Expect four `PASS` lines, and point `RELEASE_HOSTED_EXPOSURE_EVIDENCE` at that output.
3. Decide on `pt-mpc-a7c9de@euploading.com`. It has the `pt` prefix, but it is not on the pentest's `@mailinator.com` domain, so it was kept.

## Residual risks and follow-ups

- **FIX-01.** Two different but overlapping selections sent within about a second of each other can both get a session. The second request cannot expire a session the first has not created yet. Identical selections are fully serialized.
- **Rate limiting.** Better Auth keeps its counters in memory, so each serverless instance has its own budget. This was not in the backlog, and no fix was applied.
- **Checkout throttling.** After the FIX-01 follow-up, a checkout costs at most one session create plus one read and one expire for each superseded session Stripe has not yet confirmed expired. The cost no longer grows with the number of earlier intents. The Vercel finding also suggested a per-user checkout throttle. It was not added.
- **F6-2.** The `Public read access` SELECT policy still lets anyone list the public bucket. Public object URLs probably keep working without it, but that is untested. Dropping it is a separate decision.
- **Uncovered probes in the backlog.** The admin-authenticated probes (mass assignment, uploads, impersonation, replays) need the admin working, so they wait for FIX-02's operator step. The webhook replay, RSC cache and GraphQL/Realtime probes were not run.
- **Next.js notice.** The local `next build` printed a security notice asking the agent to run `next upgrade --agent=security`. It was not run. The installed Next is 16.4.3, older than the 16.4.6 the lockfile requires, so run `npm ci` locally.
