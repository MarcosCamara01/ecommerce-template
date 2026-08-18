# Database cutover runbook

This runbook covers both a fresh database and the one-time conversion of an existing
public-schema installation. Production execution always requires an approved maintenance
window, a tested restore point, and human review of the captured evidence.

## Invariants

- `app_owner` is `NOLOGIN` and owns every application table, sequence, enum, and schema.
- `app_migrator` is `NOINHERIT` and is the only login that may explicitly
  `SET ROLE app_owner`; direct private DDL before role assumption is denied.
- `app_runtime` is the application login and never receives ownership, DDL, role membership,
  broad default privileges, or direct mutation rights for immutable event receipts.
- `app_owner` owns the pre-created `drizzle` migration-ledger schema. `app_runtime` has no
  access to that schema; migration tools authenticate as `app_migrator` and assume `app_owner`.
- `DATABASE_URL` authenticates as `app_runtime`.
- `MIGRATION_DATABASE_URL` authenticates as `app_migrator`; `npm run db:migrate` verifies
  that identity and assumes `app_owner` for the migration session.
- `VERIFY_DATABASE_URL` authenticates as `app_runtime`.
- Drizzle migrations are the only forward schema mechanism. `npm run db:push` is disabled.
- The hosted PostgREST/Data API remains disabled, or exposes an empty schema.
- `AUTH_DATABASE_LAYOUT=public` is a temporary compatibility mode used only while all
  non-authentication application traffic is paused.

`bootstrap-roles.sql` deliberately aborts if any role other than `app_migrator` is a
direct or transitive member of `app_owner`, if another role can inherit through
`app_migrator`, or if `app_migrator` has `ADMIN OPTION`. Treat that as a privilege incident:
inspect `pg_auth_members`, revoke the unexpected membership at the level where it was
granted, confirm the intended path is only `app_migrator -> app_owner`, and rerun bootstrap.
The script never removes unexpected role memberships automatically.

## Fresh database

1. As the database administrator, execute `scripts/database/bootstrap-roles.sql` after
   supplying strong passwords for `app_migrator` and `app_runtime`. Bootstrap pre-creates
   both `app_private` and the `drizzle` migration-ledger schema as `app_owner`.
2. Set `MIGRATION_DATABASE_URL` to the `app_migrator` credential and run
   `npm run db:migrate`.
3. Set `DATABASE_URL` and `VERIFY_DATABASE_URL` to the `app_runtime` credential, and set
   `AUTH_DATABASE_LAYOUT=app_private`.
4. Set the immutable Better Auth user id in `ADMIN_USER_ID`, then run
   `npx tsx scripts/bootstrap-admin.ts`.
5. Run `npm run db:verify` and retain the complete output as release evidence.
6. Run `npm run db:verify-hosted` with a read-only Supabase Management API token and
   retain the exact allowlist result before accepting traffic.

## Existing database cutover

### Rehearsal and preparation

1. Restore the latest production backup into a disposable database.
2. Record table row counts, foreign keys, uniqueness constraints, order totals, and the
   current administrator user id.
3. Execute this entire runbook against the restore, including authentication smoke tests,
   fulfillment retry tests, the database verifier, and rollback rehearsal.
4. Review the resulting evidence and schedule the production maintenance window.
5. Prepare a build of this release. It supports the temporary public Better Auth layout and
   the final private layout through `AUTH_DATABASE_LAYOUT`; do not split those modes into
   different code versions.

### Production sequence

Use one **same legacy-owner/cutover actor** for evidence preparation and the first cutover:
the database-administrator login that currently owns every legacy public application table
and can transfer those objects to `app_owner`. Do not change roles or users between steps 4,
5, and 8. The temporary evidence table remains owned by this actor so it can populate, read,
archive, and drop the table without granting access to runtime roles.

1. Disable every source of application writes, including web traffic, background jobs,
   Stripe webhook delivery, cron fulfillment, and operator tools. Keep the pause active
   through the final verification.
2. Capture and identify the restore point. Re-record the pre-cutover row counts.
3. As the database administrator, execute `scripts/database/bootstrap-roles.sql` and
   provision the reviewed `app_migrator` and `app_runtime` credentials before any command
   that depends on them.
4. As the same legacy-owner/cutover actor, execute
   `scripts/database/prepare-auth-adapter.sql`.
5. Still as that actor, execute `scripts/database/prepare-cutover-price-evidence.sql`, then
   populate exactly one evidence row for every historical `order_products` row from the
   corresponding Stripe Checkout Session line-item response. Reconcile session ids,
   line-item ids, unit amounts, currencies, and row coverage before continuing; never use
   current catalog prices. Do not transfer the temporary table to `app_owner` manually.
6. Deploy this release with `AUTH_DATABASE_LAYOUT=public`, but keep all non-authentication
   routes inaccessible. Perform only Better Auth sign-in, sign-out, and session smoke tests.
7. With `APP_DATABASE_SCHEMA=public`, `ADMIN_BOOTSTRAP_DATABASE_URL` authenticated as
   the legacy table owner, and the stable `ADMIN_USER_ID`, run
   `npx tsx scripts/bootstrap-admin.ts`. Verify that email changes do not affect admin
   authorization.
8. As the same legacy-owner/cutover actor, execute
   `scripts/database/cutover-existing.sql`. Do not run this script as `app_runtime` or as
   `app_migrator`; it transfers ownership before assuming `app_owner`.
   A rerun after a previously committed cutover may omit the temporary table only when the
   durable `app_private.historical_order_price_evidence` archive still completely and
   consistently covers every historical order line. Missing or conflicting evidence always
   aborts before migration-ledger marking.
9. Rotate `DATABASE_URL` and `VERIFY_DATABASE_URL` to `app_runtime`, set
   `AUTH_DATABASE_LAYOUT=app_private`, and keep `MIGRATION_DATABASE_URL` on
   `app_migrator`.
10. Deploy the final configuration while the write pause remains active. Re-run the admin
   bootstrap without `APP_DATABASE_SCHEMA=public`; the script now requires and uses
   `MIGRATION_DATABASE_URL` for `app_private` and ignores the legacy-owner credential.
11. Run `npm run db:verify`. It must prove the exact private table set, ownership, absence
    of RLS policies, role separation, exact grants, absence of broad default privileges,
    allowed runtime DML, immutable receipts, and denied runtime DDL.
12. Compare post-cutover row counts, foreign keys, order totals, auth behavior, and pending
    fulfillment work against the pre-cutover evidence.
13. Only after steps 11 and 12 pass, set
    `CONFIRM_DATABASE_CUTOVER=MARK_MIGRATIONS_APPLIED` and run
    `npm run db:mark-cutover` with `MIGRATION_DATABASE_URL`. This records the reviewed
    canonical migrations without executing them over the converted schema.
14. Run `npm run db:verify-hosted` and retain its Management API result, then re-enable
    Stripe webhook delivery and cron and reopen application traffic.

## Rollback boundary

Before traffic reopens, rollback means restoring the captured database, rotating the
credentials and auth layout back to the previous release, and redeploying that release.
Do not attempt to move partially converted objects back in place.

After any write reaches the private schema, an automatic rollback is not safe. Freeze
writes again, preserve webhook payloads and fulfillment receipts, and choose a reviewed
forward repair or a point-in-time restore. Never replay Stripe events until the receipt,
work, and effect ledgers have been reconciled.

## Catalog reconciliation

`GET /api/cron/catalog-sync` runs every five minutes with `CRON_SECRET`, claims due or
expired operations, and stops after eight attempts. Transient failures retry; deterministic
failures and exhausted retries become `needs_attention`. A `catalog:manage` operator may
POST an `operationId` and reason to `/api/admin/catalog-sync/replay`.

Stripe creates and replacements use durable operation-derived idempotency keys. The Stripe
result is stored before atomic local finalization, so a database failure reuses it. Keep
automatic retries inside Stripe's idempotency retention window; for an old unresolved row
without a stored result, inspect `catalog_sync_operation_id` metadata before replay. Never
delete historical media during reconciliation.

## Fulfillment replay

`needs_attention` is terminal for automatic retries. An authenticated administrator with
the `fulfillment:manage` capability may submit a specific Work Checkout Session id or Effect
id to `POST /api/admin/fulfillment/replay`. Result-page refreshes never reopen terminal work;
only a new successful asynchronous payment event or this explicit operator action can do so.
