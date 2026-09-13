# PR 40 local T3 browser QA — 2026-08-24

This document defines and records browser testing for pull request
[`#40`](https://github.com/MarcosCamara01/ecommerce-template/pull/40). The
original audit baseline was
`1358ce0624039d88c1c80f65b19bcc50fe47ea0f`.

A local remediation follow-up produced six commits on
`t3code/pr-40-audit-fixes` on 2026-08-25. That stack was later published to the
PR branch at `3e79c37f5c5fb59bd1fbc96f5e0d76ea7ffdf0d3`. This report keeps the
original findings and adds the evidence produced by that follow-up. A second
local code follow-up completed on 2026-08-30 at
`d3304ef00fe222b9cf195f95bad6bd791b3916af`; the documentation-only commit that
records it follows that code tip.

Legend: `[ ]` pending, `[x]` passed, `[!]` defect, and `[-]` blocked or not
applicable to the disposable local environment.

## Scope and safety boundary

- Remediation branch: `t3code/pr-40-audit-fixes`.
- Original PR head under audit:
  `1358ce0624039d88c1c80f65b19bcc50fe47ea0f`.
- First published remediation tip:
  `3e79c37f5c5fb59bd1fbc96f5e0d76ea7ffdf0d3`.
- Second local follow-up code tip:
  `d3304ef00fe222b9cf195f95bad6bd791b3916af`.
- Base: `master`.
- PR state at the start of testing: open, draft, and blocked from merging.
- Change size: 361 files, 79,952 additions, and 19,522 deletions.
- GitHub quality, dependency-review, React Doctor, CodeQL, and GitGuardian
  checks were green. The Vercel status was still a historical failure.
- Browser surface: the collaborative T3 Code browser at
  `http://127.0.0.1:3000`.
- Initial mutating cases used disposable loopback services. A later, explicit
  request to test Stripe deeply authorized test-mode Stripe writes only.
- Hosted Supabase, live-mode Stripe, production data, credentials, and Vercel
  configuration must not be changed by this run.
- The first remediation stack was published after the local run. This report
  does not authorize another push, deployment, migration of a hosted database,
  cron execution against a hosted target, or PR merge.

## Planned local environment

- Next.js server on `127.0.0.1:3000`; T3 Code reaches the local
  port through `127.0.0.1`, so the server was bound to that exact canonical
  host to avoid a harness-induced redirect loop.
- Disposable PostgreSQL 17 database on loopback with the repository migrations.
- Local Stripe emulator for the first pass, followed by isolated Stripe Test
  mode fixtures for the explicitly requested end-to-end payment pass.
- Static repository images for catalog fixtures.
- Disposable Better Auth users created only in the local database.
- SMTP and Supabase Storage mutations remain blocked unless a loopback adapter
  is available and proven isolated before use.

## Test plan

### Environment and startup

- [x] **ENV-001 P0 — Historical source capture.** At the start of the audit,
  the local branch, remote PR head, and tested commit all resolved to
  `1358ce0624039d88c1c80f65b19bcc50fe47ea0f`; the worktree contained only the
  evidence file. This records the initial state and does not claim that those
  refs remain equal. The first remediation stack was subsequently published at
  `3e79c37f5c5fb59bd1fbc96f5e0d76ea7ffdf0d3`.
- [x] **ENV-002 P0 — Isolated dependencies.** PostgreSQL is loopback-only;
  Stripe credentials are test-mode keys and every inspected Stripe object has
  `livemode: false`.
- [x] **ENV-003 P0 — Canonical origin.** The application uses
  `http://127.0.0.1:3000` consistently for app, auth, and public origins.
- [x] **ENV-004 P1 — Startup.** The development server reaches ready state on
  port 3000 without configuration exceptions.
- [x] **ENV-005 P1 — Initial render.** The first page returns usable HTML and
  hydrates without an uncaught client error.
- [x] **ENV-006 P1 — Diagnostics capture.** Unexpected console errors, failed
  requests, and server-side 5xx responses are recorded with their route.
- [x] **ENV-007 P0 — Email isolation.** Email remains disabled without an
  explicit SMTP host; enabled delivery requires explicit port, user, password,
  sender, and contact recipient. Partial and residual Gmail credentials fail
  before a transport is created, and no configuration test opens a network
  connection.

### Global navigation and routing

- [x] **NAV-001 P1 — Home.** The catalog recovery navigation returns to `/`.
- [x] **NAV-002 P1 — Desktop collections.** T-shirts, Pants, Sweatshirts, and
  View All navigate to their correct routes.
- [x] **NAV-003 P1 — Mobile menu.** The menu opens, is named, traps focus,
  closes with Escape, and its links work.
- [x] **NAV-004 P1 — Search navigation.** Typing updates `/search?q=...`
  without a full-page failure; clearing produces `/search`.
- [x] **NAV-005 P1 — Cart and wishlist links.** Both icons have accessible
  names, correct destinations, and stable counts through navigation.
- [x] **NAV-006 P2 — Footer internal links.** Product and assistance links open
  real pages rather than placeholders.
- [x] **NAV-007 P2 — Footer external links.** External destinations open safely
  with an explicit opener policy.
- [x] **NAV-008 P1 — Invalid route.** An unknown URL renders the safe 404 state
  without disclosing implementation details.
- [x] **NAV-009 P1 — Canonical category redirect.** A real product requested
  under the wrong category redirects to its stored category and keeps variant.
- [x] **NAV-010 P1 — Invalid identifiers.** Zero, negative, fractional, text,
  and missing product/order identifiers fail safely.

### Storefront catalog and search

- [x] **CAT-001 P0 — Home catalog.** Active products render with image, name,
  price, and wishlist control.
- [x] **CAT-002 P1 — Stable ordering.** Products render in the documented
  alphabetical order without duplicate cards.
- [x] **CAT-003 P1 — Category filtering.** Each category contains only matching
  active products.
- [x] **CAT-004 P1 — Empty category.** An empty collection has a heading,
  explanation, and Browse All Products recovery action.
- [x] **CAT-005 P1 — Search match.** Search is case-insensitive and returns all
  expected name matches.
- [x] **CAT-006 P1 — Search encoding.** Spaces and reserved characters remain
  encoded safely in the URL and visible query.
- [x] **CAT-007 P1 — No search results.** A missing term produces a truthful
  no-results state and no stale cards.
- [x] **CAT-008 P1 — Archived visibility.** Archived products and variants do
  not appear on home, collection, search, recommendations, or new selection.
- [x] **CAT-009 P2 — Image behavior.** Product images decode, retain aspect
  ratio, expose useful alt text, and avoid layout shift or optimizer warnings.

### Product detail

- [x] **PDP-001 P0 — Product facts.** Name, description, price, selected color,
  sizes, and images agree with the fixture.
- [x] **PDP-002 P1 — Default variant.** A product URL without a variant redirects
  to the first active color.
- [x] **PDP-003 P1 — Variant selection.** Changing color updates the URL and all
  visible images and availability without losing the chosen product.
- [x] **PDP-004 P1 — Unknown variant.** An invalid color falls back through the
  canonical first-variant redirect.
- [x] **PDP-005 P1 — Size availability.** Available sizes are selectable;
  unavailable sizes are disabled and cannot be submitted.
- [x] **PDP-006 P1 — Variant state isolation.** Switching color never retains a
  size that the new variant does not stock.
- [x] **PDP-007 P1 — Hydration guard.** Add to Cart is disabled until its client
  handler is ready and one click creates at most one unit.
- [x] **PDP-008 P1 — Anonymous actions.** Add to Cart and wishlist actions give
  useful login feedback without creating data.
- [x] **PDP-009 P2 — Product information.** Composition, Care, and Origin
  accordions expand and collapse by pointer and keyboard.
- [x] **PDP-010 P2 — Recommendations.** Recommendations exclude the current
  product and link to a valid active variant.

### Authentication and session security

- [x] **AUTH-001 P0 — Native form safety.** Login and registration use POST and
  never place email or password in the URL, history, or redirect query.
- [x] **AUTH-002 P1 — Required fields.** Browser validation blocks missing name,
  malformed email, and missing password values.
- [x] **AUTH-003 P1 — Password control.** Visibility toggles by pointer and
  keyboard, has an accessible name, and exposes pressed state.
- [x] **AUTH-004 P0 — Registration.** A valid local registration creates an
  unverified user and no authenticated Principal.
- [x] **AUTH-005 P0 — Unverified login.** Login is rejected until the local user
  becomes verified, without revealing whether another account exists.
- [x] **AUTH-006 P1 — Invalid credentials.** A wrong password stays on Login,
  gives generic feedback, and leaks no credential into URLs or logs.
- [x] **AUTH-007 P0 — Verified login.** A verified local user signs in and the
  session survives reload and client navigation.
- [x] **AUTH-008 P1 — Safe callback.** `/orders` is preserved as a local callback;
  absolute URLs and backslash variants resolve safely to `/`.
- [x] **AUTH-009 P1 — Duplicate registration.** Reusing an email does not corrupt
  the account or disclose its existence.
- [x] **AUTH-010 P1 — Profile dialog.** Name is editable, email is disabled,
  dialog semantics are complete, and a local update persists after reload.
- [x] **AUTH-011 P0 — Logout.** Logout removes the session and clears private
  navigation plus user-scoped client caches.
- [x] **AUTH-012 P1 — Google opt-in.** Google controls are absent while both
  feature flags are false and the provider endpoint fails closed.

### Authorization and principal isolation

- [x] **SEC-001 P0 — Anonymous orders.** `/orders` requires login and exposes no
  order data.
- [x] **SEC-002 P0 — Anonymous admin.** Product create/edit pages require login.
- [x] **SEC-003 P0 — Normal user admin denial.** A verified normal user cannot
  render or invoke catalog-management actions.
- [x] **SEC-004 P0 — Admin capability.** A locally bootstrapped admin can open
  create/edit UI after refreshing its session.
- [x] **SEC-005 P0 — Cross-user order isolation.** User B cannot read User A's
  numeric order route.
- [x] **SEC-006 P0 — Cross-user result isolation.** User B cannot read or trigger
  fulfillment for User A's Checkout Session.
- [x] **SEC-007 P0 — Cross-user cache isolation.** Cart and wishlist state from
  User A never appears after logging out and signing in as User B.

### Wishlist

- [x] **WISH-001 P1 — Add once.** A user can add an active product and repeated
  clicks do not create duplicates.
- [x] **WISH-002 P1 — Persistence.** Header count and wishlist content survive
  reload and navigation.
- [x] **WISH-003 P1 — Correct deep link.** The saved card opens the expected
  product and active variant.
- [x] **WISH-004 P1 — Remove.** Removing updates the card, list, and count.
- [x] **WISH-005 P1 — Empty state.** The empty wishlist has useful copy and a
  working Start action.
- [x] **WISH-006 P0 — Archive invalidation.** Archiving a saved product removes
  it from the server result and invalidates the client cache.

### Cart

- [x] **CART-001 P1 — Add line.** An available variant and size create one line
  with the server-owned price and selected facts.
- [x] **CART-002 P1 — Idempotent increment.** Re-adding the same variant and size
  increments quantity instead of duplicating the line.
- [x] **CART-003 P1 — Distinct size.** A different size creates a separate line.
- [x] **CART-004 P1 — Quantity controls.** Increase and decrease update line
  totals, cart total, and count exactly once.
- [x] **CART-005 P1 — Remove one.** Removing one line preserves unrelated lines.
- [x] **CART-006 P1 — Clear cart.** Clearing removes every line and resets count.
- [x] **CART-007 P1 — Persistence.** Cart facts survive reload and navigation.
- [x] **CART-008 P1 — Empty state.** Empty cart copy and Start action are usable.
- [x] **CART-009 P0 — Server authority.** Client price or Stripe identifiers
  cannot override the current server catalog mapping.
- [x] **CART-010 P0 — Archived rejection.** Archived products or variants cannot
  be added and existing cached rows disappear after invalidation.

### Checkout, fulfillment, and orders

- [x] **PAY-001 P0 — Stripe Test only.** Checkout used an `sk_test_...` key;
  every Product, Price, Customer, Session, PaymentIntent, and Charge inspected
  was test mode and no live funds were reachable.
- [x] **PAY-002 P0 — Checkout creation.** Continue creates one bound Checkout
  Intent and one open Session with canonical success and cancel URLs.
- [x] **PAY-003 P1 — Checkout facts.** Hosted checkout shows the expected items,
  quantities, EUR total, and customer collection fields.
- [x] **PAY-004 P1 — Cancel.** Cancel returns to `/cart` with contents preserved.
- [x] **PAY-005 P0 — Payment.** Completing a test-mode payment redirects to the
  owned `/result?session_id=...` URL without real funds. Both ordinary success
  and a 3DS-required card were exercised.
- [x] **PAY-006 P0 — Truthful pending state.** A paid but unfinished session does
  not claim that an order already exists.
- [x] **PAY-007 P0 — Fulfillment.** Result-triggered or cron-triggered work creates
  exactly one order from the durable checkout snapshot.
- [x] **PAY-008 P0 — Idempotency.** Duplicate signed webhooks, reloading result,
  and rerunning fulfillment create no duplicate receipt, Work, effect, or order.
- [x] **PAY-009 P1 — Cart cleanup.** Successful fulfillment eventually removes
  only purchased quantities and refreshes the browser count.
- [x] **PAY-010 P1 — Result errors.** Missing, malformed, expired, foreign, and
  unpaid session identifiers reveal no private facts.
- [x] **PAY-011 P1 — Order list.** The order appears once with truthful status,
  number, total, and date.
- [x] **PAY-012 P0 — Order detail snapshot.** Name, color, image, size, quantity,
  unit amount, currency, address, and total are the immutable purchase facts.
- [x] **PAY-013 P1 — Historical catalog independence.** Editing or archiving the
  product does not rewrite the order-line snapshot.
- [x] **PAY-014 P0 — Order ownership.** Invalid and foreign order IDs return the
  same safe not-found behavior.

### Product administration and catalog synchronization

- [x] **ADM-001 P0 — Authorization before parsing.** Anonymous and normal-user
  admin calls fail before accepting or parsing mutation data.
- [x] **ADM-002 P1 — Create validation.** Missing product fields, main image,
  variant color, size, price, and final variant image receive field-level errors.
- [x] **ADM-003 P1 — Error clearing.** Correcting a field removes its stale error
  without requiring another unrelated mutation.
- [x] **ADM-004 P1 — Variant controls.** Add, remove, move, size, and image controls
  retain their state and have accessible names.
- [x] **ADM-005 P1 — Reset.** Clear or Reset restores the intended initial state.
- [-] **ADM-006 P0 — Create synchronization.** A complete product remains hidden
  until local Stripe and finalization succeed, then appears once.
- [x] **ADM-007 P1 — Edit preload.** Edit loads durable text, price, image, variant,
  and size state without losing identity.
- [-] **ADM-008 P0 — Update synchronization.** Text, price, variants, and media
  change through one durable operation and republish only after success.
- [x] **ADM-009 P0 — Archive confirmation.** Cancel is inert; Confirm Archive hides
  the product while preserving its durable identity and history.
- [x] **ADM-010 P1 — Explicit restore.** Archived editor explains restoration and
  Restore Product republishes the same identity.
- [x] **ADM-011 P0 — Cart/wishlist invalidation.** Archive and update refresh all
  embedded product caches for the current user.
- [x] **ADM-012 P0 — Catalog cron credential.** Missing or invalid bearer
  token is rejected; the loopback secret starts only the intended sweep.
- [x] **ADM-013 P0 — Replay authorization.** Replay endpoints require an admin
  Principal, a terminal operation, and an explicit reason.
- [-] **ADM-014 P1 — Storage isolation.** Upload and deletion cases run only with
  a proven loopback Storage adapter; otherwise they remain blocked.

### Accessibility, responsive layout, and diagnostics

- [x] **UX-001 P1 — Desktop layout.** Store, product, auth, cart, order, and admin
  layouts are usable at 1440 by 900 without clipping or overlapping controls.
- [x] **UX-002 P1 — Mobile layout.** The same primary flows are usable on an
  iPhone-sized viewport without horizontal page overflow.
- [x] **UX-003 P1 — Keyboard path.** Header, menus, forms, dialogs, accordions,
  product controls, and footer are reachable in a logical order.
- [x] **UX-004 P1 — Focus visibility.** Interactive controls display visible focus
  and closed overlays restore focus to their trigger.
- [x] **UX-005 P1 — Accessible names.** Icon-only menu, password, wishlist, cart,
  variant, image, quantity, archive, and dialog controls are named.
- [x] **UX-006 P1 — Dialog semantics.** Mobile menu, profile, and archive dialogs
  expose title and description without Radix warnings.
- [x] **UX-007 P1 — Heading structure.** Every page and empty/error state exposes
  a meaningful primary heading without skipped hierarchy that hides context.
- [x] **UX-008 P1 — Images.** Informative images have useful alt text and decorative
  icons do not add noise to the accessibility tree.
- [-] **UX-009 P2 — Reduced motion and appearance.** Controls remain usable with
  reduced motion and both supported color-scheme settings. Light and dark
  appearance passed; T3 Code has no reduced-motion emulation control.
- [x] **UX-010 P1 — Zoom and long text.** At 200% zoom and narrow width, critical
  content and actions remain visible and operable.
- [x] **UX-011 P1 — Loading transitions.** Suspense skeletons do not expose private
  content, trap the page indefinitely, or cause destructive layout shifts.
- [x] **UX-012 P1 — Runtime diagnostics.** Successful flows finish without new
  console exceptions, hydration errors, image warnings, or unexpected 4xx/5xx.

### PR and deployment follow-up

- [x] **DEP-001 P0 — Vercel rerun.** Vercel successfully completed GitHub
  Preview deployment `6127491975` on 2026-08-27, superseding the historical
  Hobby-plan cron failure for the first remediation tip.
- [x] **DEP-002 P0 — GitHub deployment identity.** The READY deployment names
  the exact pushed PR commit
  `3e79c37f5c5fb59bd1fbc96f5e0d76ea7ffdf0d3`, not an uncommitted local tree.
  Any later follow-up commit still requires its own rerun.
- [ ] **DEP-003 P0 — Preview auth origin.** Better Auth callbacks and trusted origin
  must resolve to the exact Preview host while production remains fail-closed.
  Local resolution tests pass; the published Preview run remains pending.
- [ ] **DEP-004 P0 — Cron availability.** Both five-minute cron definitions are
  accepted by Vercel Pro and invoke only authenticated endpoints.
- [ ] **DEP-005 P0 — Release evidence.** Restore/cutover rehearsal, hosted exposure,
  and credential-rotation evidence remain mandatory before merging.

## Execution results

### Outcome

- Total planned checks: 116.
- Passed: 109.
- Defect markers: 0. Five local defects are retained below with their
  remediation evidence rather than erased from the history.
- Blocked by an intentionally isolated adapter or missing browser capability: 4.
- Still pending and requiring hosted or deployment evidence: 3.
- External services changed: Stripe Test mode plus the mailer incident below.
  Three Products and four Prices were created and then archived; one disposable
  Customer was created and then deleted. Successful test Sessions and payments
  remain in Stripe's immutable test history. Gmail transport also accepted two
  unintended test messages before email variables were removed. No live-mode
  Stripe, hosted database object, credential, or provider configuration changed.
- The 2026-08-25 follow-up changed no external service. It used only the existing
  disposable PostgreSQL container, loopback requests, synthetic users and order
  data, and temporary read-only Unsplash image fixtures. The catalog fixture was
  restored to `/main-image.webp` after the image diagnostic.
- Local application state: running on `127.0.0.1:3000` with disposable
  PostgreSQL and email disabled. New checkout attempts intentionally remain out
  of scope because the historical temporary Stripe Prices are archived.

### Environment evidence

- Historical source capture: the local branch, `origin` branch, and PR head all
  resolved to `1358ce0624039d88c1c80f65b19bcc50fe47ea0f` before the original
  audit. This statement does not describe their current equality. The first
  published remediation tip is
  `3e79c37f5c5fb59bd1fbc96f5e0d76ea7ffdf0d3`.
- PostgreSQL 17 ran in a disposable Docker container on `127.0.0.1:55432`.
- The repository role bootstrap and all 19 Drizzle migrations completed.
- `npm run db:verify` passed every role, ownership, ACL, schema, grant,
  idempotency, guarded-binding, least-privilege, and DDL-denial probe.
- Stripe emulator 0.9.0 ran on `127.0.0.1:4000` for the first pass. The later
  end-to-end pass used the account's test-mode key; mode prefixes were checked
  without printing credential values.
- A production Next.js build completed successfully and ran through
  `next start` for the real Stripe Test pass. Supabase and every email-related
  variable were removed from that server process after the mailer isolation
  issue described below was discovered.
- T3 Code exercised desktop at 1440 by 900 and mobile at 390 by 844.
- Initial browser recording: `browser-recording-mt7lie3f.mp4`.
- Stripe Test browser recording: `browser-recording-mt7n4ggz.mp4`.
- Distinct-image diagnostic recording: `browser-recording-mt8y7cfz.mp4`.
- Local coverage and regression recording: `browser-recording-mt8yqymg.mp4`.
- Final production-build recording: `browser-recording-mt8z492b.mp4`.
- Remediation-branch headings and focus recording:
  `browser-recording-mt95wk1p.mp4`.
- Remediation-branch distinct-image recording:
  `browser-recording-mt95wfpu.mp4`.

These names identify local T3 Code artifacts. The recordings are not versioned
in this repository and GitHub reviewers cannot access them until they are
published or attached to a review-accessible location.

### Follow-up remediation evidence — 2026-08-25

- Vercel Preview origin regressions cover branch URL preference, deployment URL
  fallback, divergent Production configuration, strict Production equality,
  and invalid or incomplete Preview configuration.
- Mailer tests replace Nodemailer with an in-memory double. The first
  remediation disabled implicit Gmail service mode and covered several partial
  configurations, but a later review found remaining port, sender, and
  recipient fallbacks. See the 2026-08-30 follow-up below.
- Heading contracts cover every route shell and dynamic state. T3 accessibility
  trees at 1440 by 900 and 390 by 844 exposed exactly one level-one heading for
  Home, Search, Cart, Wishlist, Orders, order detail, product detail, errors,
  authentication, help, admin, and Checkout result states. A later review found
  the category heading text was generic; see the 2026-08-30 follow-up below.
- Profile-dialog pointer and keyboard runs on desktop and mobile kept focus on
  the Name input while open, closed with Escape, and returned focus to Account
  or Open navigation menu. The `Blocked aria-hidden` count did not increase.
- `NODE_OPTIONS=--trace-warnings` attributed `TimeoutNegativeWarning` to
  `postgres@3.4.7` reconnect scheduling. `postgres@3.4.9` contains the upstream
  zero-floor guard; a local fulfillment sweep processed two disabled-email
  effects and a post-idle reconnect completed without a warning.
- Three distinct, realistic image URLs produced no LCP warning or failed image
  request on Home or PDP in desktop and mobile. One above-fold image was
  preloaded and the remaining images were lazy. The remediation-branch repeat
  logged only an unused-preload warning after an immediate route transition,
  not the original LCP diagnostic. The repeated local fixture is therefore the
  cause of the historical LCP warning.
- Invalid IDs, categories, variants, hydration, anonymous actions, duplicate
  registration, duplicate wishlist operations, cart clearing, client tampering,
  archived rows, order ownership, terminal replay with a reason, keyboard order,
  light/dark appearance, 200% zoom, and long text were exercised locally.
- T3 Code exposes color-scheme emulation but not reduced-motion emulation.
  Reduced-motion behavior remains blocked as a browser-tool limitation; no
  speculative product change was made.
- The final production server repeated the corrected desktop/mobile heading,
  invalid-ID, and profile-focus flows. It produced no `aria-hidden`, hydration,
  or application exception. Local Vercel Analytics and Speed Insights script
  paths returned expected 404s outside Vercel, and the restored repeated image
  fixture produced the already-classified unused-preload warning.

### Follow-up local-commit evidence — 2026-08-30

This evidence applies to the four local code commits after `3e79c37…`, ending
at immutable code tip `d3304ef00fe222b9cf195f95bad6bd791b3916af`. The
documentation-only commit that contains this record follows that code tip:

- SMTP delivery now requires explicit host, port, user, password, sender, and
  contact recipient. `ADMIN_EMAIL` remains an accepted explicit recipient.
  Host plus credentials alone, each missing required value, residual public
  usernames, and invalid ports fail before transport creation. Complete Gmail
  and generic SMTP configurations still pass. All 14 focused mailer tests use
  an in-memory double and passed without network access.
- Category pages derive the accessible `<Category> products` heading from the
  validated route category while retaining the product query under Suspense.
  All 12 focused source contracts, typecheck, lint, and build passed; T-shirts,
  Pants, and Sweatshirts retained Partial Prerendering. A production-runtime
  T3 Code check exposed exactly one `h1` on each route with the respective text
  `T-shirts products`, `Pants products`, and `Sweatshirts products`, without an
  application error.
- Missing main images return `errors.img`, and missing final variant images
  return `errors["variants.<index>.images"]`. Both validations run before
  catalog planning, persistence, or file upload. A declared multipart image
  that is omitted or empty uses that same UI-consumed field path. The focused
  admin-validation regression passed 16 of 16 tests.
- The Postgres dependency regression now checks the declared and locked minimum
  fixed version rather than reading private driver source from `node_modules`.
  Its focused test passed.
- The shared full suite passed 314 of 314 tests. Typecheck, lint, the
  architecture boundary check, the local/non-Production release gate, the
  Drizzle schema check, Markdown lint, and `git diff --check` also passed. A
  production build generated all 36 static/PPR pages with only loopback or
  deliberately unreachable fixtures. React Doctor scanned 327 files at
  100/100 with no issues, and both dependency audits found zero
  vulnerabilities.
- The run used no hosted Storage object or other external service.

### Validation of the first remediation tip

The following results apply to the tree first published at
`3e79c37f5c5fb59bd1fbc96f5e0d76ea7ffdf0d3`; they do not certify later
uncommitted working-tree changes.

- `npm test`: 303 passed, 0 failed.
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm run verify:architecture`: `Architecture boundary: PASS`.
- `npm run verify:release`: `Release evidence gate: PASS` in local/non-Production
  mode; hosted evidence is not certified by this result.
- `npm run build`: passed after removing the development-only loopback Stripe
  emulator URL from the Production build environment; 36 static/PPR pages were
  generated. The guarded first attempt failed before page collection and made
  no Stripe request.
- `npm audit` and `npm audit --omit=dev`: 0 vulnerabilities.
- `npm run doctor`: 326 files, score 100/100, no issues.
- `markdownlint-cli2`: 0 issues in the two evidence files.
- `git diff --check`: passed.

### Confirmed findings

#### QA-T3-001 — Primary heading disappears or starts at the wrong level

Severity: P1 accessibility and document-structure defect.

Observed in the T3 accessibility tree and visible DOM:

- Home has product-card `h2` elements but no route-level `h1`.
- Search has no route-level `h1`; the no-results message starts at `h3`.
- An authenticated non-empty cart and wishlist start at `h2`.
- The authenticated empty Orders state starts at `h2`.
- Order detail starts at `h2` and then uses `h3` sections.
- Product detail has an `h1` on desktop, but that subtree is `display: none` on
  mobile and the fixed mobile product title is an `h2`.

Impact: screen-reader heading navigation and page-outline consumers cannot
reliably identify the current page. Search no-results additionally skips two
heading levels.

Suggested direction: give every route one accessible `h1`, visually hidden
where a visible title would not fit the design. Keep the product name as the
same semantic heading across responsive render paths.

Resolution verified 2026-08-25: stable route-shell headings now remain outside
dynamic empty/non-empty branches, product detail exposes one responsive-safe
product-name `h1`, and the product accordions use level-two headings. Source
contracts, TypeScript, the full test suite, and T3 accessibility trees passed in
desktop and mobile. A later review found that category pages still shared the
generic `Product collection` heading. The 2026-08-30 follow-up derives
`<Category> products` from the validated route while preserving Suspense and
Partial Prerendering; its 12 focused contracts and build passed.

#### QA-T3-002 — Profile dialog hides the element that retains focus

Severity: P1 accessibility defect.

Reproduction:

1. Sign in and open the desktop Account dropdown.
2. Choose Edit profile.
3. Inspect focus and the accessibility tree.

The dialog has a valid title and description, but focus returns to the Account
button while the header containing that button is `aria-hidden`. Chromium logs:

```text
Blocked aria-hidden on an element because its descendant retained focus.
Element with focus: Account button
Ancestor with aria-hidden: header
```

Impact: keyboard and assistive-technology focus can remain on content that the
modal explicitly removes from the accessibility tree.

Suggested direction: coordinate DropdownMenu close and Dialog open so focus
moves into the dialog after the menu closes, without the menu restoring focus
to Account after the dialog has already hidden the page.

Resolution verified 2026-08-25: menu and sheet teardown complete before the
profile dialog opens. The Name input receives focus, Escape closes the dialog,
and focus returns to the visible desktop or mobile trigger. Pointer and keyboard
runs added no new `Blocked aria-hidden` warning.

#### QA-T3-003 — PR head still uses the production origin in Vercel Preview

Severity: P0 deployment/authentication blocker for Preview verification.

The tested PR head still resolves the canonical origin only from `APP_URL`,
`BETTER_AUTH_URL`, and `NEXT_PUBLIC_APP_URL`. It has no `VERCEL_ENV=preview`
branch and does not read `VERCEL_BRANCH_URL` or `VERCEL_URL`.

Upgrading Vercel to Pro resolves the five-minute cron plan restriction, but it
does not resolve this independent Better Auth origin mismatch. The previously
reconstructed local fix was explicitly discarded and is not present in this
evidence run or the remote PR head.

Required direction before relying on Preview auth:

- Prefer `https://${VERCEL_BRANCH_URL}` when `VERCEL_ENV=preview`.
- Fall back to `https://${VERCEL_URL}` only when the branch URL is absent.
- Preserve strict matching of configured production origins outside Preview.
- Trust only the resolved concrete Preview origin, never a global
  `*.vercel.app` wildcard.

Resolution verified locally 2026-08-25: the origin resolver now prefers the
concrete branch URL in Preview, falls back to the concrete deployment URL, and
preserves strict configured-origin validation outside Preview. Better Auth uses
that one resolved origin for both `baseURL` and `trustedOrigins`. A published
Preview-host authentication run remains pending and is still tracked by
DEP-003.

#### QA-T3-004 — Implicit Gmail fallback enabled unintended delivery

Severity: P1 operational safety defect.

The historical mailer incident below showed that residual credentials could
activate Nodemailer's Gmail service mode without `EMAIL_SERVER_HOST`.

The first remediation removed implicit Gmail service mode but still defaulted
the port, sender, and recipient. The 2026-08-30 follow-up requires explicit
host, port, user, password, sender, and contact recipient before transport
creation; `ADMIN_EMAIL` is an accepted explicit recipient. Fourteen focused
tests cover every missing value, residual public usernames, invalid ports, and
complete Gmail and generic SMTP configurations without opening a network
connection. The incident and its two accepted messages remain documented
below.

#### QA-T3-005 — Fractional and text order IDs reached PostgreSQL

Severity: P1 safe-error-handling defect found during follow-up coverage.

`/orders/1.5` and `/orders/not-a-number` originally passed `Number(id)` into a
bigint query and rendered the global error boundary. A shared positive-safe-
decimal parser now rejects incompatible product and order identifiers before
data access. Unit, source-contract, and T3 regressions verify the same safe
Order Not Found response as other invalid and foreign IDs.

### Browser-validated behavior

- Storefront rendering, alphabetical products, decoded images, category menu,
  encoded and case-insensitive search, no-results state, help routes, 404s,
  wrong-category redirect, variant URL state, sizes, and accordions worked.
- Native authentication forms used POST. A forced native submission returned
  `/login?error=invalid_credentials` without email or password in the URL.
- Local registration created an unverified account without a session.
  Unverified login returned 403; invalid credentials returned a generic 401;
  verified login persisted through reload and navigation.
- External and backslash callback attempts both resolved to `/`.
- Google UI remained hidden and the disabled provider endpoint returned
  `404 PROVIDER_NOT_FOUND`.
- Profile name changes persisted in the local database and email stayed
  disabled. Dialog title, description, and field labels were present.
- Logout cleared session UI and immediately reset cart and wishlist counts.
- User B saw neither User A's cached cart/wishlist state, numeric order, nor
  application-owned Checkout Session. User A saw its open session as Payment
  Pending, while User B received Session Not Found.
- Wishlist add, reload persistence, deep link, remove, badge, and empty state
  worked in the local database.
- Cart add, same-line increment, distinct size, quantity increase/decrease,
  exact totals, selective deletion, reload persistence, badge, and empty state
  worked. The server stored one Black/M row at quantity two after two adds.
- A seeded immutable order rendered once with Confirmed status, exact total,
  delivery address, and snapshotted name, color, image, size, quantity, unit
  amount, and currency. Archiving and restoring the catalog product did not
  change those order facts.
- Stable-ID admin bootstrap worked. Anonymous routes redirected to Login and a
  normal user was denied before admin UI or replay payload parsing.
- Create-form field validation, stale-error clearing, main-image validation,
  variant color/size/final-image validation, variant add/reorder/remove state,
  reset, edit preload, archive cancellation, archive confirmation, cache
  invalidation, historical-order preservation, and explicit restore worked
  locally.
- Missing and bad cron bearer credentials returned 401. The loopback secret
  returned 200 for both sweeps with zero queued work.
- Replay routes returned 401 anonymously, 403 for a normal user, and 400 for
  malformed input from the admin, proving authorization precedes execution.
- Mobile storefront, product controls, fixed Add to Cart area, cart, login,
  help pages, and footer had no horizontal page overflow at 390 by 844.
- The mobile menu exposed a name and description, closed with Escape, and
  restored focus to the menu trigger. Login keyboard order and focus indicators
  were usable.

### Stripe Test end-to-end evidence

The second pass used Stripe-hosted Checkout and the account's test mode, never
live mode. The official Stripe test cards were entered only in the T3 Code
browser:

- `4000 0000 0000 0002` produced the expected generic decline and kept the
  Session open without creating an order.
- `4242 4242 4242 4242` completed a normal card payment.
- `4000 0000 0000 3220` opened the Stripe 3D Secure 2 test challenge. Choosing
  Complete produced a succeeded PaymentIntent and an authenticated 3DS result.
- All cards used the future test expiry `12/34` and test CVC `123`. No personal
  payment credential was supplied to the agent or application.

Stripe-hosted Checkout exposed Card, Klarna, Bancontact, and EPS dynamically,
confirming that the application does not freeze the account to a hard-coded
payment-method list. Apple Pay was also offered when available in the browser.
The application supplied the expected Product, quantity, customer email, phone,
billing-address fields, EUR amount, 30-minute expiry, and canonical loopback
success and cancel URLs.

#### Stripe's agent-aware Checkout path

Checkout detected browser automation and exposed the control labelled
`I am an AI agent acting on behalf of someone else`. Selecting it enabled the
agent-safe test flow and revealed Stripe's Link CLI guidance. `link-cli` was not
installed in this environment, and installing it was unnecessary because this
run used public Stripe test-card values rather than a buyer's underlying payment
credentials. The T3 Code recording captures the agent declaration and both
hosted card flows.

#### Sessions and payment state

- Normal payment Session
  `cs_test_a1IqQT6ZeOGskIDqzgfipv2qzffgRNMD1UzJpy1hKKWpjUWGix7HbixCcc`
  completed and was paid for `5990` EUR cents. Its single line had quantity two
  at `2995` cents and created local order `302` exactly once.
- Cancelled Session
  `cs_test_a1bxxwulj9N4JB4clynG9Q4rdOHx0Zo3IJXLFNlEtBAFWt972g54fRRTaq`
  returned to `/cart` with the Black/S line intact. After explicit test expiry,
  `/result` displayed `Session Expired` and still preserved the cart.
- 3DS Session
  `cs_test_a1aJWNfXVUQa1db2JI3L4ZSGXaSUxuoHiIr5yqxYYYe8IBfhKzjSA7yWH8`
  completed and was paid for `2995` EUR cents. PaymentIntent
  `pi_3U83dQRlmLwIQgAK14lbKGdH` and Charge
  `ch_3U83dQRlmLwIQgAK1UwBindl` both succeeded; the inspected Charge reported
  `three_d_secure.result: authenticated` and test-card last four `3220`.
- All three Sessions reported `livemode: false`, used Customer
  `cus_V8Jy0nkI6kFB0c`, and retained the same application user and email. This
  proves Customer lookup and reuse rather than creating one Customer per retry.

The initial result view truthfully said `Payment Received` while fulfillment
was pending. A signed `checkout.session.completed` payload with event ID
`evt_qa_pr40_3ds_20260824` was sent twice. Both requests returned 200, while the
database retained exactly one receipt, one Work row, one order (`303`), and
three effects. The Work succeeded on attempt one, the cart-cleanup effect
succeeded once, and the cart count moved from one to zero. Repeated result loads
and two no-op cron sweeps created nothing else.

The two order-email effects failed safely when mail configuration was absent.
The UI therefore said `Email delivery is delayed, but your order is confirmed
and safe.` A later cron sweep retried exactly those two effects: each remained
pending at attempt two with a future backoff, while order and cart cleanup were
unchanged. This validates truthful partial-success reporting and bounded retry
separation between durable order creation and external email delivery.

#### Temporary Stripe Test objects and cleanup

Temporary objects were tagged with `qa_run=pr40_t3_20260824` where their API
supports metadata. The run created Products
`prod_V8JvcDzIhSAt2H`, `prod_V8JvsMvrZhnlys`, and
`prod_V8JvBNQ3EBAZzH`, plus Prices
`price_1U83HqRlmLwIQgAK6CPL27VH`,
`price_1U83HqRlmLwIQgAKlaKBKEFK`,
`price_1U83HqRlmLwIQgAKvuMf8uOZ`, and
`price_1U83HrRlmLwIQgAKumpIouPV`.

Cleanup re-read all three Sessions, confirmed two complete/paid and one
expired/unpaid, archived all four Prices and three Products, and deleted the
disposable Customer. Stripe does not delete completed test Sessions,
PaymentIntents, or Charges, so those remain as auditable test-mode history.

#### Mailer isolation incident

The first normal-payment fulfillment inherited the original environment's
Gmail variables. Although `EMAIL_SERVER_HOST` was absent, the mailer falls back
to Gmail service mode and reported two accepted outbound messages: customer and
owner confirmation. This was an unintended external effect outside the desired
Stripe-only isolation boundary. No credential or provider configuration was
changed. As soon as it was observed, the application was stopped and restarted
with every email variable removed; the 3DS flow then proved the intended
no-email failure and retry behavior. Treat the two accepted messages as test
mail that may need deletion from the recipient mailbox.

The 2026-08-25 fix does not rewrite this history. Regression tests prove that
the same residual-credential configuration now fails before Nodemailer creates
a transport. No follow-up email was sent.

### Blocked, resolved diagnostics, and non-defect limitations

- The initial emulated Checkout was blocked by `emulate` 0.9.0. Its
  `/v1/customers/search` request is treated as retrieval of customer `search`,
  producing `No such customer: 'search'` before Session creation. The later
  real Stripe Test pass covered Checkout, cancel, payment, 3DS, webhook,
  fulfillment, email failure/retry, and paid idempotency despite this emulator
  compatibility gap.
- A directly seeded open emulated Checkout Session plus an application-owned
  local intent was used only to verify Payment Pending and cross-user result
  isolation.
- SMTP was intended to remain absent, but the first Stripe Test fulfillment
  discovered the Gmail fallback documented above. Subsequent server execution
  had every email variable removed. Account creation and unverified-login
  behavior were tested, then test users were marked verified directly in
  disposable PostgreSQL. Verification-link navigation and sandbox mail receipt
  remain blocked.
- Supabase Storage was intentionally absent. No hosted object was uploaded or
  removed. Field-level validation reached main image, product fields, variant
  color, variant sizes, and missing final variant images without an adapter.
  Full create/update upload and deletion behavior remains blocked without a
  loopback Storage adapter.
- The first T3 navigation used `localhost` while the browser reached the port as
  `127.0.0.1`, causing a redirect loop and Next.js dev-origin 403 responses.
  Binding both the server and canonical origin to `127.0.0.1` resolved the
  harness mismatch before functional testing began.
- All seeded products reused `/main-image.webp`. Next.js therefore emitted an
  LCP eager-loading warning for that repeated fixture URL. Images decoded and
  retained layout. The distinct-image follow-up produced no warning, so this is
  a fixture diagnostic rather than an application-image defect.
- The earlier `TimeoutNegativeWarning` was reproduced with a full stack in
  `postgres@3.4.7`. Version 3.4.9 contains the upstream reconnect-delay guard;
  local fulfillment and a post-idle reconnect then completed without warning.
- T3 Code could emulate light and dark appearance but exposed no
  `prefers-reduced-motion` control. Reduced-motion behavior remains blocked by
  that browser-tool capability and was not converted into a speculative change.
- Vercel deployment and GitHub-sourced READY identity were verified for
  `3e79c37f5c5fb59bd1fbc96f5e0d76ea7ffdf0d3`. Preview authentication, hosted
  Supabase exposure, restore/cutover rehearsal, credential rotation, and SMTP
  sandbox delivery were not executed. Real Stripe test-mode payment is now
  covered; live-mode payment remains intentionally out of scope. The second
  follow-up stack needs a fresh GitHub-sourced deployment check after push.

### Merge decision

Do not merge from this evidence alone. The first remediation stack for
QA-T3-001 through QA-T3-005 was published at
`3e79c37f5c5fb59bd1fbc96f5e0d76ea7ffdf0d3`. Any later correction still needs
its own authorized commit and push followed by CI. Preview authentication, cron
acceptance, migration/restore rehearsal, hosted exposure, credential rotation,
SMTP sandbox delivery, and cutover evidence remain mandatory.
