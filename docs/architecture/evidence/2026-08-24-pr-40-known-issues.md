# PR 40 known issues and QA gaps — 2026-08-24

This document inventories the defects, operational incidents, environment
limitations, and remaining QA gaps found while testing pull request
[`#40`](https://github.com/MarcosCamara01/ecommerce-template/pull/40) at commit
`1358ce0624039d88c1c80f65b19bcc50fe47ea0f`.

A local follow-up on 2026-08-25 remediated the confirmed code defects and closed
the locally isolatable coverage. The changes were reproduced and committed on
`t3code/pr-40-audit-fixes`; nothing was pushed, deployed, or changed in a hosted
system, so publication-bound evidence remains open.

The detailed test evidence is in the
[T3 browser QA report](./2026-08-24-pr-40-t3-browser-qa.md).

## Contents

- [Confirmed application and PR defects](#confirmed-application-and-pr-defects)
- [Resolved runtime diagnostics](#resolved-runtime-diagnostics)
- [Deployment and release verification gaps](#deployment-and-release-verification-gaps)
- [Test-environment limitations and incidents](#test-environment-limitations-and-incidents)
- [Incomplete coverage](#incomplete-coverage)
- [Recommended remediation order](#recommended-remediation-order)
- [Repository safety state](#repository-safety-state)

## Confirmed application and PR defects

### ISSUE-001 — Missing or incorrect page heading hierarchy

Severity: P1 accessibility.

Status: resolved and verified locally on 2026-08-25.

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
the full suite, and T3 accessibility trees passed in desktop and mobile.

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

Status: resolved and verified without network access on 2026-08-25.

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

Resolution: `EMAIL_SERVER_HOST` is now the explicit enablement boundary. Missing
host, partial configuration, and residual Gmail credentials fail before
Nodemailer creates a transport. Gmail remains supported through an explicit
Gmail SMTP host. The historical two-message incident remains part of the record;
no follow-up email was sent.

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

## Deployment and release verification gaps

### DEP-GAP-001 — Historical Vercel failure has not been superseded

The previous Vercel check failed while the project lacked the plan needed for
two five-minute cron jobs. The project is now on Pro, but a new GitHub-sourced
deployment must still prove recovery.

### DEP-GAP-002 — GitHub deployment identity is unverified

The successful local Vercel deployment was built from an uncommitted working
tree. It does not prove that a deployment originating from the PR commit becomes
READY.

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

All locally isolatable cases in the original inventory passed or produced the
remediated order-ID defect. These items remain blocked or external; they are not
new confirmed defects:

- Complete product create/update synchronization with isolated Storage.
- Verification-link navigation, rendered-message inspection, and delivery in an
  isolated SMTP sandbox.
- Reduced-motion emulation in the collaborative T3 browser.
- Completed Klarna, Bancontact, EPS, and Apple Pay transactions. These methods
  appeared dynamically in Checkout but were not taken through completion.
- GitHub-sourced Vercel READY status.
- Preview authentication after the origin fix.
- Hosted cron execution and final release evidence.

## Recommended remediation order

1. Review the six local commits and their total diff against the PR head.
2. Push only under a separate explicit authorization.
3. Verify GitHub quality, dependency-review, React Doctor, CodeQL, GitGuardian,
   and a GitHub-sourced Vercel READY deployment for the pushed commit.
4. Verify Better Auth and both authenticated cron endpoints on the exact Preview
   host without adding wildcard trusted origins.
5. Complete isolated SMTP, Storage, migration/restore, hosted exposure,
   credential-rotation, and cutover evidence before any merge decision.

## Repository safety state

- Worktree:
  `/Users/marcospenelascamara/.t3/worktrees/ecommerce-template/t3code-982bdeaf`
- Branch: `t3code/pr-40-audit-fixes`.
- Tested HEAD: `1358ce0624039d88c1c80f65b19bcc50fe47ea0f`.
- The remediation is organized as five code commits followed by one evidence
  commit; the final tree is expected to be clean.
- Do not discard or mix them with unrelated changes.
- Local commits were authorized for this branch. No push, deployment, external
  credential change, or PR merge is authorized by this document.
