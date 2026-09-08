# React Doctor — rejected findings

Each entry records a diagnostic that was investigated and **not** changed, with the
predicate that makes it a false positive and the evidence for it. Re-verify the
predicate before trusting an entry: it describes the code as of the review, not
a permanent waiver.

Reviewed against react-doctor 0.9.12, full scope.

Each rejection below is suppressed so the score reflects the verified state. Eleven
are `// react-doctor-disable-next-line` comments sitting on the occurrence itself; the
two that cannot carry one — a `.sql` file, and a JSX anchor that lands on the directive
line — are per-file, per-rule entries in `doctor.config.json`. Both rules still run
everywhere else in the repo.

To see the raw findings again, scan with inline disables neutralised:

```bash
npx react-doctor@0.9.12 --verbose --scope full   # add: respectInlineDisables:false in config
```

## `supabase-rls-policy-risk` — `scripts/database/cutover-existing.sql:377`

`DISABLE ROW LEVEL SECURITY` on the `app_private` tables.

**Predicate:** the rule's risk is `DISABLE ROW LEVEL SECURITY` *on a client-reachable
table*. These tables are not reachable by any client role.

**Evidence:**

- `supabase/config.toml:2-3` — `[api] enabled = false`, `schemas = []`. PostgREST is
  off and no schema is exposed.
- `scripts/database/verify-hosted-exposure.mjs:33-35` — fails the release if the hosted
  Data API ever exposes `public` or `app_private`. Runs via `verify:release` in
  `vercel-build`.
- `scripts/database/bootstrap-roles.sql:162-173` — `REVOKE ALL ON SCHEMA app_private
  FROM PUBLIC`; only the server-side `app_runtime` login role gets `USAGE`, with default
  privileges revoking tables and sequences.
- `scripts/database/cutover-contract.test.mjs:295-312` — asserts those REVOKEs stay.

The script also drops `app.current_user_id()`, so there is no `auth.uid()` context for a
policy to gate on. Access is through a server-side owner/runtime role, not PostgREST.

## `async-await-in-loop` — 6 occurrences

Sequential awaits, all deliberate:

- `src/lib/data-access/catalog-sync.repository.ts:475` and
  `src/lib/db/drizzle/repositories/cart.repository.ts:184` — inside `db.transaction`.
  Concurrent statements on one Postgres connection are not safe.
- `src/lib/catalog-sync/stripe-operations.ts:28,37,58` — Stripe calls wrapped in
  `withLease(heartbeat, …)` with per-step idempotency keys. The ordering renews the
  distributed lease between calls; parallelising would also risk Stripe rate limits.
- `src/lib/catalog-sync/service.ts:94` — `bucket.remove()` chunked at 1000 paths. The
  chunking *is* the API limit; issuing every chunk at once is the failure mode it avoids.

## `query-mutation-missing-invalidation` — 2 occurrences

- `src/hooks/product/mutations/useProductMutation.ts` (`create`) — a product that did not
  exist cannot be in a cached cart or wishlist. Listings are server components.
- `src/components/layout/navbar/EditProfile.tsx` — updates `user.name` only. That lives
  in the Better Auth session store, not in React Query; `router.refresh()` covers the
  server components that render it.

## `no-prevent-default` — `src/components/layout/navbar/EditProfile.tsx:73`

The rule wants a server action so the form works without JavaScript. This form is inside
a Radix dialog loaded with `dynamic(() => import("./EditProfile"), { ssr: false })`
(`src/components/layout/navbar/Navbar.tsx`), so it does not exist at all without
JavaScript. A server action would not make it progressively enhanced.

## `no-array-index-as-key` — `src/components/ui/carousel.tsx:302`

`scrollSnaps` is a positional list of embla snap offsets: dot *n* **is** slide *n*. The
index is the identity, and the offsets themselves are not guaranteed distinct.

## `async-defer-await` — `src/lib/db/drizzle/repositories/fulfillment.repository.ts:59`

The await is the `stripeEventReceipts` insert, not a data read. It is the idempotency
ledger for *every* Stripe event, so it must run before the early return that skips
non-checkout event types. Moving it below the guard would stop recording those events.

## `no-json-parse-stringify-clone` — `src/lib/db/drizzle/repositories/fulfillment.repository.ts:67`

`JSON.parse(JSON.stringify(event))` here is JSON normalisation before a `jsonb` write,
not a deep clone for mutation. `structuredClone` is not a substitute: it preserves
`Date`/`Map`/`Set`, which would then serialise differently into the column.
