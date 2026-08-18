# Architecture acceptance evidence

Every row is pass/fail. Source inspection alone is not runtime evidence.

| Boundary | Command or observation | Pass condition |
|---|---|---|
| Imports | `npm run verify:architecture` | No application module bypasses `data-access`. |
| Types | `npm run typecheck` | Principal-bound interfaces compile without escape casts. |
| Unit behavior | `npm test` | Principal fabrication, snapshot reconciliation, price authority, and retry classification tests pass. |
| Empty database | `npm run db:migrate` on a disposable empty database | One baseline creates every auth, catalog, order, and fulfillment object in `app_private`. |
| Restored database | Rehearse `cutover-existing.sql` on a disposable restore | Migration commits with row counts and foreign keys preserved; pre-mark certification proves the checkout-binding body, owner, `SECURITY DEFINER`, fixed search path, and exact ACL. |
| Hosted schema exposure | Run `npm run db:verify-hosted` against Supabase Management API | Effective `db_schema` exactly matches the versioned allowlist and excludes `public` and `app_private`. |
| Runtime role | `npm run db:verify` using `app_runtime` | Required DML succeeds; DDL and public application-table access are denied; webhook receipts expose only the idempotency-key column, never payloads. |
| Owner role | Catalog query over `pg_class` | Every private table and sequence is owned by `app_owner`. |
| RLS | Catalog query over `pg_class.relrowsecurity` and `pg_policy` | No private table has RLS enabled and no legacy policy remains. |
| Admin | Anonymous, user, and bootstrapped-admin probes | Anonymous is 401, normal user is 403/hidden, stable-id admin succeeds. |
| Ownership | User A requests User B cart/order ids | No resource data is returned and no row changes. |
| System Principal | Unit test plus architecture import check | A structural object and User Principal are rejected; only fulfillment creates the accepted System Principal. |
| Duplicate event | `npm run db:verify-concurrency` with runtime/admin URLs for one disposable loopback database | Two deliveries with a real Stripe signature create one Event Receipt and one Work row. |
| Concurrent workers | `npm run db:verify-concurrency` on a disposable local database | Exactly one worker claims the pending Work row. |
| Expired lease | `npm run db:verify-concurrency` on a disposable local database | The second worker reclaims the same expired Work row with a fenced lease. |
| Partial effect failure | `npm run db:verify-concurrency` on a disposable local database | Order and successful Work remain; email effects retry; cleanup completes independently; no duplicate order is created. |
| Terminal replay | `npm run db:verify-concurrency` plus the authenticated route tests | Runtime replay transitions one terminal Work and appends exactly one operator audit record. |
| Credential cutover | Probe old and new runtime credentials after rotation | New `app_runtime` passes; previous broad credential is rejected/revoked. |
| Hosted exposure | Supabase project API settings export | Data API is disabled or only an explicit empty schema is exposed; `app_private` is absent. |
| Upgrades | Auth smoke, signed webhook, checkout retrieval, production build | Better Auth 1.6.28, Drizzle 0.45.2/Kit 0.31.10, and Stripe 22.5.0 work together. |

Store environment-bound outputs with deployment evidence; do not commit credentials, connection strings, or webhook payload PII.

Latest local evidence: [`evidence/2026-08-18-local-e2e.md`](evidence/2026-08-18-local-e2e.md).
