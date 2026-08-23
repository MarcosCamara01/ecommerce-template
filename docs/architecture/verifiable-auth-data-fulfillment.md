# Verifiable identity, data, and fulfillment architecture

This document materializes Wayfinder map #22 and decisions #23 through #33.

## Identity

`src/lib/identity` is the only request-credential boundary. It returns opaque runtime-marked User Principals, maps Better Auth's persisted `admin` role to `catalog:manage`, and exposes typed authentication/capability failures. Each trusted internal workflow owns only its purpose-limited System Principal factory: order fulfillment owns `order-fulfillment`, and catalog synchronization owns `catalog-sync`. A Principal for one purpose is rejected by the other workflow. UI role checks are advisory; data writes repeat the authoritative check.

The first administrator is promoted by stable Better Auth user id with `ADMIN_USER_ID npm run auth:bootstrap-admin`. Email addresses are not authorization keys.

Credential sign-in requires email verification, linking another provider requires the
existing local account to be verified, and an unverified session never becomes an
application Principal. OAuth callbacks never reclaim or rewrite an unverified credential
registration.

## Data

`src/lib/data-access` is the application interface to repositories. Public catalog reads are separate from Principal-bound cart, wishlist, order, checkout, and administrative operations. User ids come from the Principal. Repositories, Drizzle connection objects, runtime table objects, and transactions are internal and guarded by `npm run verify:architecture`; type-only schema imports and exported Zod validators remain public contracts. Raw catalog-saga repositories are importable only by their Principal-bound manager.

PostgreSQL provides least privilege through owners and grants, not request authorization. `app_runtime` receives schema usage plus required DML; it cannot own or create application objects.

## Fulfillment

Stripe webhook delivery first creates an immutable Event Receipt and one Work row per Checkout Session. The response schedules but does not await the worker. The result page may request the same Work row after verifying session ownership. A cron sweep recovers missed background execution and expired leases.

The application stores a server-created snapshot of at most 100 distinct cart lines, including variant, size, quantity, unit amount, and currency, in the durable Checkout Intent. Before persistence, the EUR aggregate must remain between Stripe's 50-cent minimum and 99,999,999-cent maximum. Stripe metadata contains only its opaque `checkoutIntentId` reference. Fulfillment resolves that immutable intent, re-fetches Stripe, and reconciles aggregate charged quantities, unit amounts, and currency against the snapshot and current stable catalog mappings. The live cart is never a fulfillment input.

One transaction creates or finds the idempotent order, marks Work succeeded, and enqueues durable email/cart-cleanup effects. Effects run after commit with independent leases and retries. Email is at-least-once with deterministic message ids; cleanup is idempotent.

## Catalog synchronization

Catalog mutations first persist one active operation per durable product identity and use
archive state as a publication gate. A leased worker applies Stripe with operation-derived
idempotency keys, records the external result, then atomically finalizes the local target
and operation. Cron recovers transient failures; `catalog:manage` operators may replay
`needs_attention`. Existing media remains preserved and only pre-enqueue uploads are
eligible for compensation cleanup.

Expired incomplete preparations enter durable `cancelling` before Storage cleanup. That
state rejects and compensates late stale uploads, survives cleanup failures for retry, and
becomes `cancelled` only after every planned object has been removed.

## Deployment

Drizzle owns the canonical schema and migration history. Better Auth CLI output is advisory only. Production/shared `db:push` is disabled. The exact empty-database, existing-database, role, cutover, rollback, and evidence procedures live under `scripts/database` and `docs/runbooks`.
