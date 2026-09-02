# PR 40 autonomous readiness evidence — 2026-08-31

This report records the autonomous, non-production verification and safe
remediation pass for pull request
[`#40`](https://github.com/MarcosCamara01/ecommerce-template/pull/40).
It separates repeatable local evidence from hosted observations and from work
that still requires a maintainer or an approved production operation.

This evidence does **not** authorize merging the pull request.

## Contents

- [Revision and safety boundary](#revision-and-safety-boundary)
- [Conclusion](#conclusion)
- [Local quality gate](#local-quality-gate)
- [Database and cutover rehearsal](#database-and-cutover-rehearsal)
- [Supabase Storage](#supabase-storage)
- [Stripe Test payments](#stripe-test-payments)
- [Vercel Preview and cron](#vercel-preview-and-cron)
- [GitHub and security checks](#github-and-security-checks)
- [Remaining merge blockers](#remaining-merge-blockers)
- [Deliberate exclusions](#deliberate-exclusions)

## Revision and safety boundary

- Pull request: `#40`, open, draft, target `master`, merge status `BLOCKED`.
- Published PR tip before this pass:
  `e8b65ebf1fe37f65910cf42f48355b5d5cad5bf1`.
- Database remediation commit:
  `caaef9c24d7f1f14d7dddf301236efeaa7fdb1da`.
- Storage and upload remediation commit:
  `13a183c331e67720009575d04623ba25a14cbe08`.
- Code tip covered by this report:
  `13a183c331e67720009575d04623ba25a14cbe08`.
- Local PR diff at that code tip: 383 files, 86,091 additions, 19,882
  deletions, 29 commits, and 19 Drizzle SQL migrations.
- All PostgreSQL, Supabase, browser, and fulfillment mutations used disposable
  local resources.
- Stripe mutations used Test mode only. Every inspected object reported
  `livemode: false`.
- No hosted Supabase schema, row, Storage object, credential, Stripe live
  object, Production Vercel setting, or external SMTP configuration was
  changed.
- No merge, force-push, credential rotation, or production cutover was
  performed.

## Conclusion

Every safe and locally reproducible item in the audit inventory is now covered
by executable evidence. The application code, database bootstrap, legacy
cutover, rollback behavior, Better Auth credentials, Storage contract, catalog
uploads, and Stripe Test fulfillment all pass locally.

The pull request is still **not merge-ready**. The current Preview database
does not contain the required `app_private` schema, environment isolation is
not demonstrated, cron and release evidence variables are absent, GitGuardian
still needs three test-credential classifications, and a trusted review
approval is missing. Those are external release controls, not reasons to weaken
the code or to mutate production autonomously.

## Local quality gate

The following commands passed on the code tip above:

- `npm test`: 352 passed, 0 failed.
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm run verify:architecture`: `Architecture boundary: PASS`.
- `npm run verify:release`: `Release evidence gate: PASS` in the local,
  non-Production mode.
- `npx --no-install drizzle-kit check --config=drizzle.config.ts`: passed.
- `npm run build`: passed with loopback or deliberately unreachable service
  values; all 36 static or Partial Prerendering pages were generated.
- `npm run doctor`: 335 files, score 100/100, no findings.
- `npm audit --audit-level=low`: 0 vulnerabilities.
- `npm audit --omit=dev --audit-level=low`: 0 vulnerabilities.
- `npm ls --all`: passed with a valid dependency tree.
- `git diff --check`: passed.
- CI workflow YAML parse: passed.
- Gitleaks scan of every added diff line: no finding.
- Both pre-commit hook executions passed React Doctor staged checks.

Node's existing `MODULE_TYPELESS_PACKAGE_JSON` warnings remain visible in the
test runner. They are pre-existing module-detection diagnostics and did not
change any test outcome.

## Database and cutover rehearsal

### Fresh database path

- PostgreSQL 17 roles bootstrapped successfully.
- All 19 Drizzle migrations applied to an empty database.
- `db:verify` passed every schema, owner, ACL, role, DDL-denial, runtime-DML,
  checkout-binding, and idempotency probe.
- A second migration run was a no-op.
- A custom-format backup contained 238 TOC entries and measured 88,946 bytes.
- Backup SHA-256:
  `16391b7b185b73c22183a45defb104c9ae2b443e615942f8dfedd8581d0f877f`.
- Two independent restores produced the same database fingerprint and both
  passed `db:verify`.

### Existing database path

The rehearsal found and fixed two real legacy-cutover defects:

1. PostgreSQL exposed inspected index columns as `name[]`, while the contract
   used `text[]`. The comparison now casts to `text[]`.
2. The legacy `order_items_user_id_fkey` cascaded user deletion into historical
   orders. Cutover now replaces a non-canonical constraint with the reviewed
   `ON DELETE RESTRICT ON UPDATE CASCADE` contract and leaves a canonical rerun
   untouched.

The resulting integration suite proves all of the following:

- User, Account, Session, and Verification fields preserve exact IDs, hashes,
  OAuth tokens, scopes, expirations, timestamps, impersonation data, IP, and
  user agent.
- Catalog, variant, cart, wishlist, order, customer, line snapshot, Stripe
  price evidence, currency, amount, and address fields preserve exact values.
- A real Better Auth handler signs in with the inherited credential, reads the
  resulting session, and signs out before and after cutover.
- The cutover and `db:verify` pass, and an idempotent rerun keeps the same
  foreign-key and index object identifiers.
- Missing, incomplete, and conflicting historical price evidence each abort
  atomically. Every legacy fingerprint remains identical, zero application
  tables move, and credential authentication still works.
- A PostgreSQL 17 database-owner actor with administration-only membership but
  `SET FALSE` cannot run cutover; the failure leaves all 11 public application
  tables and all data unchanged.
- PostgreSQL 17 suite: 6 passed, 0 failed.
- PostgreSQL 15 suite: 5 passed, 0 failed, with the PG16+-only membership-SET
  case skipped as designed.
- CI now runs PostgreSQL 17 through `npm test` and repeats only the cutover file
  on PostgreSQL 15.

PostgreSQL 17 automatically grants a non-superuser `CREATEROLE` creator an
administration-only membership in roles it creates. Bootstrap accepts only the
exact database-owner grant with `ADMIN TRUE`, `INHERIT FALSE`, `SET FALSE`, and
a superuser grantor. It uses a temporary self-grant inside one transaction for
owner-only setup, revokes that self-grant before commit, and rejects usable,
transitive, substituted, or otherwise non-canonical memberships. PostgreSQL 15
retains the original single-member contract.

The final rollback restore point measured 55,262 bytes with 158 objects.
SHA-256:
`0e7b21b4690a20116471db735abccf3bbe88e6de885f8e30ea4f761a0c1db936`.
Restoring it reproduced the pre-cutover fingerprint and passed the verifier.
No container created by either integration suite remained after execution.
Pre-existing local containers from other work were not modified.

## Supabase Storage

The isolated local stack used Supabase CLI 2.115.0, PostgreSQL 17.6.1.159, and
Storage API 1.69.11 on loopback ports.

Runtime evidence:

- The public `product-images` bucket was created from versioned
  `supabase/config.toml`.
- JPEG, PNG, and WebP were the only accepted MIME types.
- An object exactly 5 MiB was accepted; a 5 MiB plus 1 byte object was
  rejected.
- A `text/plain` upload was rejected.
- Upload, public read, upsert, and delete succeeded.
- A forced partial-upload failure ran compensation and left zero objects.
- The 19 Drizzle migrations coexisted with Supabase Storage tables and
  `db:verify` still passed.
- The disposable local Supabase stack was removed after the test.

Application and hosted-verifier remediation:

- File selection, server validation, Storage configuration, and documentation
  share the JPEG, PNG, and WebP contract.
- Server validation checks the declared MIME, size, and JPEG/PNG/WebP signature
  bytes before any durable mutation or upload.
- Create and update paths derive the object extension from the validated MIME,
  never from a client-controlled filename.
- New files are limited to 3 MiB per file and 3 MiB in aggregate for one
  catalog multipart request. Product description length is also bounded.
- The 3 MiB aggregate leaves more than 1 MiB for multipart headers and metadata
  under Vercel's documented 4.5 MB Function payload limit. Vercel recommends a
  direct-to-storage upload when larger payloads are required.
- Pickers expose real keyboard-operable buttons, associate errors with the file
  input, announce asynchronous errors, and keep remove controls visible on
  focus.
- Preview reads preserve `{file, preview}` pairing even when readers resolve
  out of order; generation guards prevent stale selection or reset races.
- `db:apply-hosted` validates the Management token, safe 20-character project
  reference, and service-role key before any config push.
- The service-role key is stripped from the Supabase CLI subprocess and passed
  only to the read-only verifier.
- The verifier checks the Data API allowlist first, then requires the exact
  public bucket, 5 MiB object limit, and MIME set. Timeouts, network failures,
  malformed responses, and HTTP errors expose neither credentials nor bodies.

Reference:
[Vercel Function limits](https://vercel.com/docs/functions/limitations).

A remaining low-risk limitation is explicit: signature sniffing does not fully
decode every image byte. A corrupt file with a valid header can still be
stored and later render as a broken image. Full decoding would require an
approved image-processing dependency or a direct upload pipeline and is not a
safe incidental change to this pull request.

## Stripe Test payments

Earlier browser QA already covered hosted Checkout cancellation, an ordinary
card success, generic decline, 3DS completion, customer reuse, signed duplicate
webhooks, fulfillment, cart cleanup, immutable order facts, and idempotent
retries with official Stripe test cards.

This pass added three non-card payment methods against a disposable local
catalog entry and Stripe Test mode:

- Bancontact Session:
  `cs_test_a10H3GWPGmHtV6MZV2IMA7fld6cNoTKSlQWfYhbyHjhH7uvlTjoKu2Bfbe`.
- EPS Session:
  `cs_test_a1GoikqGKP4kLvdORkW0K0qoV9OJwIPXtHn4UIzM3HGWRP9xY2VlgBNwPl`.
- Klarna Session:
  `cs_test_a18zlavDN2Otf87qyz7eZbX695VHRIRP6zVNtYemAUE1r6xYKzrwySKGH6`.

All three Sessions were complete and paid for 2,995 EUR cents, with succeeded
PaymentIntents and Charges and the exact selected payment method. They reused
one disposable Customer and produced local orders 305, 306, and 307.

For each method, one Work row and one order were retained, the cart cleanup ran
exactly once, and two disabled-email effects remained honestly pending without
opening an SMTP connection. A second cron sweep was a no-op.

Signed event delivery was repeated for:

- `evt_pr40_bancontact_async_20260830`.
- `evt_pr40_eps_async_20260830`.
- `evt_pr40_klarna_completed_20260830`.

Every POST returned 200. The database retained one receipt per event and no
duplicate Work, order, effect, or cart mutation. Two further cron calls remained
no-ops.

Cleanup archived the disposable Product and Price, deleted the disposable
Customer, restored the local variant's previous Stripe Price mapping, and left
the cart empty. Completed Stripe Test Sessions, PaymentIntents, Charges, and
local orders remain as immutable test evidence. No live-mode object or fund was
reachable.

Apple Pay could not be completed without a compatible wallet and physical or
properly provisioned device. It remains a manual device test, not an
application defect.

Reference: [Stripe testing](https://docs.stripe.com/testing).

## Vercel Preview and cron

The most recent published GitHub-sourced deployment inspected before these two
new commits was:

- GitHub deployment ID: `6171207629`.
- Vercel deployment ID: `dpl_5fw1Bg8GmYVC94R41bfkHADPJr6U`.
- Git commit:
  `e8b65ebf1fe37f65910cf42f48355b5d5cad5bf1`.
- Immutable deployment URL:
  `https://ecommerce-template-46nbefyf1.vercel.app`.
- State: `READY`.

Preview Deployment Protection uses Vercel SSO and Git Fork Protection. One
temporary protection-bypass token was created only to issue safe GET probes,
then revoked. The final bypass-token count was zero.

Observed behavior before revocation:

- `/api/auth/ok`: 200.
- `/`: 200 for the Partial Prerendering shell.
- Unauthenticated `/api/cron/fulfillment`: 503.
- Unauthenticated `/api/cron/catalog-sync`: 503.

The 200 shell is not functional catalog evidence. Vercel logs show PostgreSQL
SQLSTATE `42P01`: `app_private.products_items` does not exist in the Preview
database. The hosted database has not been brought to the schema required by
this branch, so functional Preview catalog and Better Auth testing cannot be
certified yet.

Environment metadata was inspected without reading or printing values:

- `CRON_SECRET` is absent.
- `RELEASE_CUTOVER_EVIDENCE` is absent.
- `RELEASE_HOSTED_EXPOSURE_EVIDENCE` is absent.
- `RELEASE_CREDENTIAL_ROTATION_EVIDENCE` is absent.
- Complete SMTP host, port, sender, and contact configuration is absent, so
  mail remains safely disabled.
- Database, Better Auth, Stripe, Supabase, and Google credential records are
  assigned across Development, Preview, and Production. Isolation has not been
  demonstrated.

Vercel reports cron enabled at project level but zero active cron jobs and zero
runs. Vercel cron invokes the Production deployment; `master` does not yet
contain this branch's `vercel.json`. The two five-minute schedules are valid on
the current Pro plan, but they cannot be certified until the branch is
deliberately released with `CRON_SECRET` and the database cutover complete.

The Preview-origin resolver itself is covered by eight regression tests. It
prefers `VERCEL_BRANCH_URL`, falls back to `VERCEL_URL`, uses only that concrete
origin for Better Auth, and preserves strict fail-closed origin equality
outside Preview. No wildcard Vercel trusted origin was added.

Reference: [Vercel cron jobs](https://vercel.com/docs/cron-jobs).

## GitHub and security checks

At final published commit
`5f6993c3d9beb248e58234f5faef4ded234ae93c`, the following completed
successfully:

- CI quality.
- Dependency Review.
- React Doctor.
- CodeQL.
- Vercel deployment and Preview comments. GitHub deployment `6172305559`
  points to that exact SHA, and Vercel deployment
  `dpl_EziMsXazQVMjnyA8nW62HVBRyoGx` is `READY` at
  `https://ecommerce-template-2ukbusezm.vercel.app`.

All 9 GitHub review threads are resolved. Seven were outdated discussions about
symbols removed by an earlier commit; each was checked before resolution.

GitGuardian is the only failed check. Its final scan found three test-only
incidents across the 30 pull-request commits:

- `36729768`, occurrence `294301259`: a synthetic Better Auth secret in commit
  `e83a6ed`.
- `36730798`, occurrence `294306229`: the deterministic local Better Auth smoke
  input declaration in commit `caaef9c`.
- `36730799`, occurrence `294306230`: the same local smoke input used to derive
  its deterministic scrypt fixture hash in commit `caaef9c`.

None can authenticate to an external service or was deployed as a credential.
The current Better Auth secret and hash are constructed at runtime. A local
post-push follow-up also generates the smoke input from `randomBytes(24)` on
every run and includes a regression that forbids a deterministic replacement.
Gitleaks reports no finding in the added lines, but GitGuardian scans the
complete commit history and therefore continues to report all three.

Without rewriting reviewed history, an authenticated GitGuardian workspace
member must classify all three as `Ignore` → `Test credential`, or use the
GitHub check action `Skip: test credential` if workspace managers enable skip
actions, then rerun the check. No GitGuardian session, API token, or enabled
check-run action was available. A force-push was deliberately rejected as a
disproportionate fix.

Reference:
[GitGuardian pull-request checks](https://docs.gitguardian.com/internal-monitoring/prevent/detect-secrets-in-real-time-in-github).

## Remaining merge blockers

The following work requires a maintainer, an approved hosted operation, or a
capability unavailable to this environment:

1. Classify GitGuardian incidents `36729768`, `36730798`, and `36730799` as test
   credentials and rerun the check.
2. Provision or select isolated Preview and Production databases and secrets.
   Do not reuse one credential set across environments without an explicit
   reviewed decision.
3. Rehearse the hosted target from a fresh backup, then execute the reviewed
   migration or existing-database cutover with the exact actor and retain the
   rollback artifact.
4. Run `db:apply-hosted` with credentials for the same reviewed Supabase target
   and retain its Data API plus Storage verification output.
5. Rotate or revoke broad legacy database credentials as required by the
   cutover plan, then set the three `RELEASE_*_EVIDENCE` references to real
   retained evidence.
6. Configure a distinct `CRON_SECRET`, deploy from GitHub, and verify both cron
   endpoints plus Vercel's Production cron run history.
7. Verify registration, sign-in, session, and callbacks on the exact GitHub
   Preview URL after its database is ready and while SSO remains enforced.
8. Configure an isolated SMTP sandbox and verify account-verification and order
   messages without using a real recipient.
9. Complete Apple Pay on a compatible Test-mode device or wallet.
10. Obtain one trusted reviewer or Code Owner approval. The PR author cannot
    supply the normal independent approval.
11. Review the full 384-file final PR and all 19 migrations, not only the
    remediations in this report.
12. Remove draft status only after the external evidence is attached. Do not
    merge from this report alone.

## Deliberate exclusions

- No Production or live-mode payment test.
- No hosted database migration, schema change, data write, backup deletion, or
  cutover.
- No Supabase hosted Storage upload or object deletion.
- No credential readout, rotation, or environment reassignment.
- No SMTP delivery to a real mailbox.
- No wildcard Better Auth trusted origin.
- No disabling of Vercel SSO, Git Fork Protection, release gates, GitGuardian,
  CodeQL, or branch protection.
- No history rewrite, force-push, PR merge, or change to `master`.
