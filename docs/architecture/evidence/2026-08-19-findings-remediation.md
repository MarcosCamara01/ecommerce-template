# Findings remediation evidence - 2026-08-19

Environment: disposable PostgreSQL 17 container, local Next.js on port 3100,
and an in-memory Stripe emulator behind a loopback compatibility adapter. No
hosted credentials, payment data, or production payloads were used.

## Reproducible passes

- `npm test`: 283 tests passed after both review follow-up remediations.
- `npm run typecheck`, `npm run lint`, and `npm run verify:architecture` passed.
- `npm run build` passed while `DATABASE_URL` targeted an unreachable loopback
  port, proving that product route generation no longer queries the database at
  build time.
- Fresh migrations and `npm run db:verify` passed against PostgreSQL 17 with
  the owner, migrator, and runtime roles.
- `npm run db:verify-concurrency` passed its concurrency, expired lease,
  post-commit SMTP failure, truthful checkout outcome, write-once binding,
  replay audit, signed duplicate webhook, and cross-Principal ownership probes.
- Catalog cron probes returned `401` for an invalid bearer credential and `200`
  for the configured credential before executing through a `catalog-sync`
  System Principal.

## Browser observations

- Opening `http://127.0.0.1:3100` redirected to the configured canonical origin
  `http://localhost:3100` before authentication.
- A paid Checkout Session with pending Fulfillment Work displayed `Payment
  Received`; the database contained no order at that point.
- After the fulfillment sweep, the same page displayed a confirmed order and a
  delayed-email message while the customer email effect remained retryable.
- The completed cart-cleanup effect invalidated the browser cart queries; the
  header count changed from one to zero.
- `View Orders` linked directly to the durable order and displayed the immutable
  quantity, unit amount, currency, variant, delivery address, and total.

## Evidence still requiring an external environment

Hosted Supabase schema exposure, production-like restore/cutover rehearsal,
credential rotation, real Stripe test-mode delivery, and a real SMTP sandbox
remain deployment evidence. This local run does not claim those checks passed.
Production Vercel builds now execute `npm run verify:release` and fail closed
until references for the restore rehearsal, hosted exposure report, and
credential-rotation audit are configured. The gate prevents an unsupported
release; it does not substitute for the external evidence itself.
