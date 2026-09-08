# PR 40 known issues and QA gaps — 2026-08-24

This document inventories the defects, operational incidents, environment
limitations, and remaining QA gaps found while testing pull request
[`#40`](https://github.com/MarcosCamara01/ecommerce-template/pull/40). The
original audit baseline was
`1358ce0624039d88c1c80f65b19bcc50fe47ea0f`.

A follow-up on 2026-08-25 produced six remediation commits. That stack was first
published to `feat/verifiable-auth-catalog-fulfillment` at
`3e79c37f5c5fb59bd1fbc96f5e0d76ea7ffdf0d3`. A second local follow-up on
2026-08-30 produced four code commits, ending at
`d3304ef00fe222b9cf195f95bad6bd791b3916af`; the documentation-only commit that
records them follows that code tip. Publication-bound evidence remains open
unless a section explicitly records it.

The detailed test evidence is in the
[T3 browser QA report](./2026-08-24-pr-40-t3-browser-qa.md).

Update on 2026-08-31: the
[autonomous readiness report](./2026-08-31-pr-40-autonomous-readiness.md)
supersedes this file's publication anchors, incomplete-coverage list, and
remaining release checklist. The original findings and incidents below remain
as historical evidence.

## Contents

- [Confirmed application and PR defects](#confirmed-application-and-pr-defects)
- [Resolved runtime diagnostics](#resolved-runtime-diagnostics)
- [Deployment evidence and remaining release gaps](#deployment-evidence-and-remaining-release-gaps)
- [Test-environment limitations and incidents](#test-environment-limitations-and-incidents)
- [Incomplete coverage](#incomplete-coverage)
- [Recommended remediation order](#recommended-remediation-order)
- [Repository safety state and revision anchors](#repository-safety-state-and-revision-anchors)

## Confirmed application and PR defects

### ISSUE-001 — Missing or incorrect page heading hierarchy

Severity: P1 accessibility.

Status: initial defect remediated on 2026-08-25; category-heading follow-up
verified locally on 2026-08-30.

- Home has product-card `h2` elements but no route-level `h1`.
- Search has no route-level `h1`; its no-results message starts at `h3`.
- Authenticated non-empty cart and wishlist pages start at `h2`.
- The empty Orders state and order detail start at `h2`.
- Product detail has a desktop `h1`, but that subtree is hidden on mobile and
  the visible mobile title is an `h2`.

Impact: screen-reader heading navigation and other document-outline consumers
cannot reliably identify the current page.

Suggested direction: give every route one accessible `h1`, visually hidden
where necessary, and preserve the same semantic heading across responsive
render paths.

Resolution: stable route-shell headings cover loading, empty, non-empty, and
error branches. Product detail exposes one product-name `h1` outside responsive
subtrees, and its accordion headings no longer skip a level. Source contracts,
the full suite, and T3 accessibility trees passed in desktop and mobile. A
subsequent review found that every category still used the generic `Product
collection` heading. The 2026-08-30 follow-up now derives `<Category> products`
from the validated route category while keeping the product query inside
Suspense. Its 12 focused contracts, typecheck, lint, and build passed, and all
three category routes retained Partial Prerendering.

### ISSUE-002 — Profile dialog leaves focus inside hidden page content

Severity: P1 accessibility.

Status: resolved and verified locally on 2026-08-25.

Opening Edit profile from the desktop Account dropdown leaves focus on the
Account button after the dialog has applied `aria-hidden` to the surrounding
header. Chromium reports:

```text
Blocked aria-hidden on an element because its descendant retained focus.
```

Impact: keyboard and assistive-technology focus can remain on content removed
from the accessibility tree.

Suggested direction: coordinate DropdownMenu close and Dialog open so focus
moves into the dialog after menu teardown and returns to a visible trigger when
the dialog closes.

Resolution: DropdownMenu and mobile Sheet finish teardown before opening the
dialog. Focus enters the Name input and returns to Account or Open navigation
menu after Escape. Pointer and keyboard runs produced no new `aria-hidden`
warning.

### ISSUE-003 — Vercel Preview authentication uses the production origin

Severity: P0 deployment and authentication blocker.

Status: code resolved and locally verified on 2026-08-25; hosted Preview
verification remains pending.

The PR head resolves the canonical origin from `APP_URL`, `BETTER_AUTH_URL`, and
`NEXT_PUBLIC_APP_URL`. It does not give Preview deployments an explicit branch
for `VERCEL_BRANCH_URL` or `VERCEL_URL`.

Impact: Better Auth callbacks can use the production host when a Vercel Preview
has a different origin. The Vercel Pro upgrade fixes the cron-plan restriction,
but it does not fix this independent origin mismatch.

Required behavior:

1. When `VERCEL_ENV=preview`, prefer
   `https://${VERCEL_BRANCH_URL}`.
2. If the branch URL is absent, fall back to `https://${VERCEL_URL}`.
3. Outside Preview, keep strict fail-closed equality between the configured
   production origins.
4. Trust only the resolved concrete Preview origin. Do not add a global
   `*.vercel.app` trusted origin.
5. Add regression coverage where the configured production origin differs
   from the Preview origin.

Resolution: all five behaviors are covered. Better Auth continues to use only
the one resolved origin for `baseURL` and `trustedOrigins`. No wildcard trusted
origin was added.

### ISSUE-004 — Missing SMTP host does not disable Gmail delivery

Severity: P1 operational safety.

Status: the first remediation was incomplete; a 2026-08-30 working-tree
follow-up is verified without network access and awaits final integrated
validation plus an immutable commit.

The mailer can fall back to Gmail service mode when `EMAIL_SERVER_HOST` is
absent but Gmail credentials remain in the process environment. The first
Stripe Test fulfillment therefore reported two accepted outbound messages even
though the QA run intended to have no external mail transport.

Impact: local or Preview operations can send email unexpectedly when a partial
email configuration is inherited.

Suggested direction: make email enablement explicit and fail closed. Require a
complete, intentional mail configuration or an explicit provider selection;
do not infer Gmail delivery only from residual credentials. Add tests for
partial and disabled configurations.

No credential or provider configuration was changed during the incident. The
server was restarted with every email-related variable removed immediately
after discovery.

Resolution: commit `09625ab` made `EMAIL_SERVER_HOST` the enablement boundary
and removed the implicit Gmail service mode, but it still defaulted the port,
sender, and recipient. The 2026-08-30 follow-up removes those fallbacks. An
enabled transport now requires explicit host, port, user, password, sender, and
contact recipient; `ADMIN_EMAIL` is an accepted explicit contact recipient.
Missing values, residual public usernames, and invalid ports fail before
Nodemailer creates a transport. All 14 focused mailer tests passed with an
in-memory double and no network access. Complete generic and Gmail SMTP
configurations remain supported. The historical two-message incident remains
part of the record; no follow-up email was sent.

### ISSUE-005 — Invalid order identifiers reached PostgreSQL

Severity: P1 safe error handling.

Status: found, resolved, and verified locally on 2026-08-25.

Fractional and text order identifiers were coerced with `Number(id)` and passed
to a bigint query, rendering the global error state rather than the same safe
not-found response as missing or foreign orders.

Resolution: product and order detail routes share a positive-safe-decimal ID
parser and reject invalid identifiers before data access. Unit, source-contract,
and T3 browser regressions cover zero, negative, fractional, text, missing, and
foreign identifiers.

## Resolved runtime diagnostics

### DIAG-001 — Node emitted `TimeoutNegativeWarning`

Status: resolved through a verified dependency update on 2026-08-25.

The production server emitted one negative-duration timer warning after the
background 3DS fulfillment run. Order creation, effects, cart cleanup, and
idempotency state were correct, but the warning had no application stack.

Follow-up: `NODE_OPTIONS=--trace-warnings` attributed the negative timer to
`postgres@3.4.7` reconnect scheduling. The installed 3.4.9 release contains the
upstream `Math.max(0, ...)` guard. A local fulfillment sweep processed two
disabled-email effects, and a query after the 20-second idle timeout reconnected
without warning. The timer did not originate in Next.js `after()`, Stripe,
application retries, or application date arithmetic.

Test durability follow-up: the 2026-08-30 working tree replaces a source-text
assertion against Postgres internals in `node_modules` with a manifest and
lockfile minimum-version contract. The focused test passes without depending on
the driver's private file layout; the traced reconnect run above remains the
behavioral evidence.

### DIAG-002 — Repeated fixture image produced an LCP warning

Status: confirmed as a fixture-only diagnostic on 2026-08-25; no product-image
change required.

Every seeded product reused `/main-image.webp`, and Next.js emitted an eager
loading or Largest Contentful Paint warning for the repeated resource. Images
decoded and retained layout correctly.

Follow-up: three distinct realistic URLs produced no LCP warning or failed image
request on Home or product detail in desktop and mobile. The first above-fold
image was preloaded with responsive `sizes`; remaining images stayed lazy. A
repeat on the remediation branch logged only an unused-preload warning after an
immediate route transition, not the original LCP diagnostic. The database
fixture was restored to `/main-image.webp` after each test.

## Deployment evidence and remaining release gaps

### DEP-GAP-001 — Historical Vercel failure was superseded

The previous Vercel check failed while the project lacked the plan needed for
two five-minute cron jobs. On 2026-08-27, Vercel completed Preview deployment
`6127491975` successfully from GitHub commit
`3e79c37f5c5fb59bd1fbc96f5e0d76ea7ffdf0d3`, superseding that historical
failure. Any later follow-up commit still requires its own Vercel rerun.

### DEP-GAP-002 — GitHub deployment identity was verified

The READY Preview deployment above names the exact pushed PR commit rather than
an uncommitted local working tree. This closes the original identity gap for
`3e79c37f5c5fb59bd1fbc96f5e0d76ea7ffdf0d3`; it does not pre-certify later
working-tree changes.

### DEP-GAP-003 — Preview authentication and cron execution are unverified

The Preview-origin code and local regression suite are ready. After an
authorized commit and push, verify Better Auth against the exact Preview host
and confirm both authenticated cron endpoints:

- `/api/cron/fulfillment`
- `/api/cron/catalog-sync`

### DEP-GAP-004 — Release and cutover evidence remains incomplete

Before merging, the PR still needs:

- Manual functional testing in the intended hosted environment.
- A rehearsal of all 19 Drizzle migrations.
- Restore and rollback evidence.
- Cutover evidence.
- Hosted Supabase exposure review.
- Preview and Production secret-separation review.
- Credential-rotation planning where appropriate.

## Test-environment limitations and incidents

### ENV-001 — Stripe emulator cannot handle Customer Search

`emulate` 0.9.0 interprets `/v1/customers/search` as retrieval of a Customer
whose ID is `search`, returning:

```text
No such customer: 'search'
```

This blocked emulated Checkout Session creation. A later real Stripe Test-mode
pass successfully covered normal payment, decline, cancel, expiry, 3DS,
Customer reuse, signed duplicate webhooks, fulfillment, cart cleanup, and email
retry. The emulator incompatibility is not evidence of a Stripe integration
failure.

### ENV-002 — `localhost` and `127.0.0.1` caused an origin loop

T3 Code reached the app through `127.0.0.1`, while the initial app configuration
used `localhost`. The mismatch caused a redirect loop and Next.js development
origin 403 responses. Using `http://127.0.0.1:3000` consistently resolved the
problem.

### ENV-003 — Supabase Storage was not isolated locally

No hosted object was uploaded or deleted. Form validation, archive, restore,
and local catalog behavior were tested, but complete create/update media
synchronization remains blocked until a proven loopback Storage adapter exists.

### ENV-004 — No isolated SMTP sandbox was available

The QA run could not validate verification-link navigation, final email
rendering, or sandbox delivery. After the Gmail fallback incident, later
fulfillment ran with email completely disabled and correctly exposed delayed
email state with retry backoff. The fail-closed mailer fix is locally verified,
but actual SMTP sandbox delivery remains blocked.

### ENV-005 — Stripe Link CLI was unavailable

Stripe Checkout exposed its agent declaration and Link CLI guidance, but
`link-cli` was not installed. It was unnecessary for the completed tests because
the browser used public Stripe test-card values, not a buyer's underlying
credentials.

### ENV-006 — T3 browser automation needed agent-aware interaction

Stripe Checkout initially prevented an automated successful submission. After
selecting `I am an AI agent acting on behalf of someone else`, the normal and
3DS test flows completed. The 3DS challenge also required an explicit
cross-frame browser interaction. This is expected Stripe safety behavior, not
an application defect.

### ENV-007 — Temporary Stripe Test fixtures were archived

The Stripe Test Products and Prices created for QA were archived, and the
disposable Customer was deleted. Completed test Sessions, PaymentIntents, and
Charges remain as Stripe Test history. The local catalog still references the
archived temporary Prices, so the running local server is suitable for
inspection but not for starting another Checkout without new isolated fixtures.

### ENV-008 — T3 Code cannot emulate reduced motion

Light and dark appearance, focus visibility, keyboard order, 200% zoom, and
long text were exercised. The collaborative browser exposes color-scheme
emulation but no `prefers-reduced-motion` control. Reduced-motion behavior
remains a tool limitation rather than a confirmed defect.

## Incomplete coverage

The first remediation tip left ADM-002 blocked even though field-level create
validation is locally isolatable. A 2026-08-30 follow-up corrected that
classification and behavior: missing main and final variant images now return
the field keys consumed by the form before planning, persistence, or upload.
Multipart payloads that declare an image but omit it or provide an empty file
also report `variants.<index>.images`, rather than an unused `imageCount` field.
The focused regression passed 16 of 16 tests, and the shared full suite passed
314 of 314 tests. All locally isolatable cases in the original inventory now
pass or produced a remediated defect.

These items still require an external adapter, hosted evidence, or a browser
capability; they are not new confirmed defects:

- Complete product create/update synchronization with isolated Storage.
- Verification-link navigation, rendered-message inspection, and delivery in an
  isolated SMTP sandbox.
- Reduced-motion emulation in the collaborative T3 browser.
- Completed Klarna, Bancontact, EPS, and Apple Pay transactions. These methods
  appeared dynamically in Checkout but were not taken through completion.
- A new GitHub-sourced Vercel READY status for any later follow-up commit.
- Preview authentication after the origin fix.
- Hosted cron execution and final release evidence.

## Recommended remediation order

1. Review the follow-up working-tree diff against the first published
   remediation tip.
2. Commit and push any follow-up only under their separate explicit
   authorizations.
3. Re-run GitHub quality, dependency-review, React Doctor, CodeQL, GitGuardian,
   and GitHub-sourced Vercel verification for the resulting published commit.
4. Verify Better Auth and both authenticated cron endpoints on the exact Preview
   host without adding wildcard trusted origins.
5. Complete isolated SMTP, Storage, migration/restore, hosted exposure,
   credential-rotation, and cutover evidence before any merge decision.

## Repository safety state and revision anchors

- Working branch: `t3code/pr-40-audit-fixes`.
- Original audit baseline:
  `1358ce0624039d88c1c80f65b19bcc50fe47ea0f`.
- First published remediation tip:
  `3e79c37f5c5fb59bd1fbc96f5e0d76ea7ffdf0d3`.
- The first published remediation stack contains five code commits followed by
  one evidence commit.
- Second local follow-up code tip:
  `d3304ef00fe222b9cf195f95bad6bd791b3916af`.
- The second follow-up contains four code commits; the evidence-only commit that
  contains this document follows them and changes no runtime behavior.
- Do not discard the follow-up or mix it with unrelated changes.
- Publication of the first remediation stack is historical. This document does
  not authorize another commit, push, deployment, external credential change,
  or PR merge.
