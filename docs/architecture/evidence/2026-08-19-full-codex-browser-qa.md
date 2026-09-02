# Full Codex browser QA - 2026-08-19

Legend: `[ ]` pending, `[x]` passed, `[!]` defect, `[-]` blocked or not exposed
through the product UI.

## Environment and safety

- [x] Application starts on the canonical local origin and redirects aliases.
- [x] Fresh PostgreSQL 17 migrations and runtime-role verification pass.
- [x] Browser and application use only a Stripe test key, never live mode.
- [x] SMTP is loopback-only and captures verification and order email.
- [x] Storage is loopback-only and serves byte-valid uploaded images.
- [x] No production Supabase data, Storage objects, or credentials are mutated.

## Public storefront

- [x] Home renders the seeded catalog, prices, and wishlist controls.
- [x] Uploaded catalog images render as valid image bytes in the browser.
- [x] Collections navigation opens T-shirts, Pants, and Sweatshirts.
- [x] Each category shows only matching products and handles an empty category.
- [x] Navbar search navigates to matching results.
- [x] Search handles case-insensitive input and a no-results query.
- [x] Product detail shows name, description, price, images, color, and sizes.
- [x] Available sizes can be selected and unavailable sizes are disabled.
- [x] Product image/variant selection keeps the URL and visible state aligned.
- [x] Composition, Care, and Origin accordions expand and collapse.
- [x] Recommendations render without including the current product.
- [x] Invalid product/category routes show a safe not-found state.
- [x] Footer links have the expected destinations and safe external-link behavior.

## Authentication and profile

- [x] Anonymous access to Orders redirects to Login.
- [x] Anonymous access to Admin redirects to Login.
- [x] Registration enforces required fields and password constraints.
- [x] Email/password registration creates an unverified account without a session.
- [x] Unverified login is rejected with useful feedback.
- [x] Verification email arrives in loopback SMTP and contains a usable link.
- [x] Verification link activates the account and establishes the expected state.
- [x] Incorrect password is rejected without leaking account details.
- [x] Verified email/password login succeeds and survives reload.
- [x] Duplicate registration is handled without corrupting the existing account.
- [x] Profile dialog updates the display name and persists after reload.
- [x] Logout clears the application session and private navigation.
- [-] Google OAuth is hidden until its exact callback is registered and explicitly enabled.

## Authorization and isolation

- [x] Normal user cannot open the product administration UI.
- [x] Stable-ID admin bootstrap grants catalog access after session refresh.
- [x] Admin routes render only for a Principal with catalog capability.
- [x] User B cannot view User A order by guessing its numeric ID.
- [x] User B cannot view or trigger User A Checkout Session result.
- [x] User-specific cart and wishlist counts remain isolated.

## Wishlist

- [x] Anonymous favorite action gives useful login feedback without mutation.
- [x] Authenticated user can add a product once.
- [x] Repeated favorite action does not create a duplicate.
- [x] Wishlist badge and page persist after reload.
- [x] Wishlist detail links to the correct product variant.
- [x] Removing from favorites updates card, page, and badge.

## Cart

- [x] Anonymous add-to-cart gives useful login feedback without mutation.
- [x] Product can be added with an available selected size.
- [x] Re-adding the same variant/size increments instead of duplicating rows.
- [x] A different size creates a distinct cart line.
- [x] Increase and decrease quantity update line and total prices.
- [x] Cart badge and cart page persist accurately after reload.
- [x] Removing one line leaves other lines intact.
- [x] Clearing the cart removes all lines and updates the badge.
- [x] Server-authoritative Stripe price is used instead of client-supplied price data.
- [x] Archived catalog identities cannot be newly added to cart.

## Stripe checkout and fulfillment

- [x] Stripe account/key is confirmed to be test mode before writes.
- [x] Admin catalog creation produces a real test-mode Stripe Product and Price.
- [x] Checkout Session uses canonical success/cancel URLs and bounded expiration.
- [x] Checkout metadata contains only the opaque Checkout Intent reference.
- [x] Canceling hosted Checkout returns to the cart with contents preserved.
- [x] Declined test card remains in Checkout and creates no local order.
- [x] Successful test card completes hosted Checkout without real funds.
- [x] Paid result initially reports payment received while Work is pending.
- [x] Fulfillment cron turns the paid session into exactly one order.
- [x] Customer and owner email effects reach loopback SMTP.
- [x] Cart cleanup settles and invalidates the visible cart state.
- [x] Result page transitions to confirmed order and truthful email state.
- [x] Reloading/retriggering result and cron creates no duplicate Work or order.
- [x] Order list and detail preserve quantity, unit amount, currency, variant, and address.
- [x] Missing, malformed, and foreign Checkout Session IDs reveal no private data.
- [x] Signed duplicate webhook delivery remains idempotent (supporting API probe).

## Product administration and catalog synchronization

- [x] Create form blocks missing product, image, variant, size, and price fields.
- [x] Admin creates a product with main image, variant image, color, sizes, category, and price.
- [x] Uploaded Storage objects receive public catalog URLs and lifecycle updates.
- [x] Uploaded Storage images visibly decode in the browser with the QA adapter.
- [x] Created product appears on home, category, and search.
- [x] Edit form loads the durable product and variant state.
- [x] Admin updates product text and price through the catalog-sync operation.
- [x] Admin can add another color/variant with independent images and sizes.
- [x] Admin can remove/archive an omitted variant without deleting its history.
- [x] Product archive removes it from home, category, search, wishlist, and new cart additions.
- [x] Historical order still resolves the archived product and immutable price.
- [x] Explicit restore makes the durable identity public again.
- [x] Catalog cron rejects a bad credential and accepts the configured credential.
- [-] Operator replay endpoints have no product UI; supporting route/runtime tests are recorded separately.

## Responsive, accessibility, and diagnostics

- [x] Desktop navigation, dialogs, forms, and product/cart layouts are usable.
- [x] Mobile viewport exposes usable navigation, search, product, cart, and auth flows.
- [x] Form inputs have accessible labels and buttons have usable names.
- [x] Keyboard focus and password visibility controls work on auth forms.
- [x] Browser console has no unexpected application errors during successful flows.
- [x] Server logs have no unexpected 5xx responses during successful flows.
- [x] Any expected emulator/test failures are separated from application defects.

## Original test-adapter limitations

- Valid and duplicate account creation used the local Better Auth HTTP endpoint;
  browser registration validation, verification state, login, profile, and logout
  were exercised in the Codex browser. This avoids the browser's mandatory final
  confirmation for creating an account while still proving the local account state.
- Product archive used the protected local admin API because the application has
  no archive control. Its complete storefront and historical-order effects were
  verified in the browser.
- The loopback Storage adapter accepted upload/delete/public-object requests but
  intentionally lacked Supabase multipart decoding. It therefore served multipart
  envelopes instead of image bytes. Broken previews and Next image-optimizer
  `received null` errors are adapter limitations; the application's generated
  URLs and Storage lifecycle were still exercised.

## Fresh command verification

- `npm test`: 283 passed, 0 failed.
- `npm run lint`: exit 0.
- `npm run typecheck`: exit 0.
- `npm run build`: optimized Next.js production build completed and generated
  all 36 static/PPR pages. Warnings remain for inferred Turbopack workspace root
  and stale Browserslist data.
- `npm run verify:architecture`: `Architecture boundary: PASS`.
- `npm run db:verify`: every PostgreSQL 17 role, schema, ACL, idempotency,
  guarded-binding, and runtime-write probe passed.
- `npm run db:verify-concurrency`: fulfillment lease, SMTP failure,
  checkout-outcome, write-once binding, replay/audit, signed duplicate webhook,
  and cross-principal ownership evidence all passed.
- Migrations `0017` and `0018` passed on a fresh PostgreSQL 17 database and on
  an upgrade simulation containing a pre-existing order line.

## Remediation rerun - 2026-08-19

- QA-001 through QA-011 and QA-013 through QA-015 were fixed and reproduced
  successfully in a clean Codex browser session.
- Auth failures remain on `/login` without placing email or password in the URL.
- The first product interaction after navigation adds exactly one cart unit.
- A fresh real Stripe test Checkout created order `#4` with durable status
  `confirmed`, immutable name `QA Fixed Tee 20260819`, color `Fixed Black`,
  image URL, amount `4995`, and currency `eur`.
- Renaming the catalog product to `QA Fixed Tee Renamed 20260819`, archiving it,
  and restoring it did not change the order-line snapshot.
- Admin archive now has a confirmation dialog, and the archived editor exposes
  an explicit `Restore Product` action.
- PostgreSQL 17 fresh migration and an upgrade simulation with an existing
  legacy order both passed; the upgrade backfilled display fields before adding
  `NOT NULL` and set status to `confirmed`.
- QA-012 requires the external Google Cloud callback registration. The provider
  is now opt-in and hidden until `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true`.
- The replacement loopback Storage adapter parsed Supabase multipart uploads;
  browser images decoded correctly and the affected pages produced no new image
  or dialog warnings.
- Review follow-up: Google now requires matching server and public opt-in flags;
  a direct provider POST returns `PROVIDER_NOT_FOUND` while disabled.
- Review follow-up: native email forms post through an HTML adapter. Invalid
  credentials return `303` to `/login?error=...`; valid credentials return
  `303` to the requested local path while preserving `Set-Cookie`.
- Review follow-up: removing the final variant image produces a Zod field error
  at `variants.<index>.images`, not an internal 500.
- Review follow-up: help pages contain configuration-neutral placeholders rather
  than delivery, tracking, sizing, return, or refund commitments.
- Review follow-up: production releases fail closed without external cutover,
  hosted-exposure, and credential-rotation evidence references.
- Second review follow-up: callback destinations are resolved against the
  canonical origin and reject backslashes or external origins. A real
  `/\\evil.example` login returned to `/`, while `/orders` returned to
  `/orders` for both native and hydrated sign-in.
- Second review follow-up: multipart encoding, order presentation projection,
  and product-mutation HTTP translation now live in dedicated modules rather
  than being duplicated across UI consumers.

## Original findings

### QA-001 - Empty category pages render a blank main region

Home has a `No products available` state, but `/t-shirts`, `/pants`, and
`/sweatshirts` render no heading, explanation, or recovery action when empty.

### QA-002 - Assistance footer links are placeholders

Size guide, Delivery, and Returns and refunds all use `href="#"`.

### QA-003 - External footer links omit an explicit opener policy

Portfolio, LinkedIn, GitHub, and Medium use `target="_blank"` without an
explicit `rel="noopener noreferrer"`.

### QA-004 - Pre-hydration auth submit leaks credentials into the URL

Submitting Login before the client handler attached performed the browser's
default GET form submission and navigated to
`/login?email=...&password=...`. Login and Register forms declare only a React
`onSubmit`; they have no safe HTML method/action fallback or pre-hydration
submission guard. Reproduction used disposable local credentials only.

### QA-005 - Password visibility toggle has no accessible name

The icon-only password button exposes no `aria-label`, visible text, or title,
so the browser accessibility tree reports an unnamed button.

### QA-006 - Product validation feedback is stale or overly generic

Basic-field errors remain rendered after the corresponding fields are corrected
until another submission occurs. An empty variant submission reports only
`Invalid product payload`, without identifying color or size, while later
missing-image validation is specific.

### QA-007 - Pre-hydration product actions can silently drop clicks

An immediate `Add to cart` click after product HTML became visible produced no
request, badge change, or feedback. Repeating the same action after client
hydration works. The control is present and enabled before its handler is ready.

### QA-008 - A just-confirmed order is immediately labelled In Transit

The successful result correctly says the order is confirmed and will be
processed shortly, but the first visit to both `/orders` and `/orders/1`
labels the same just-created order `In Transit`. No shipment event or carrier
transition occurred, so this communicates a stronger fulfillment state than
the durable evidence supports.

### QA-009 - Admin variant icon controls have no accessible names

The move-up, move-down, remove-variant, and remove-image buttons in the product
editor appear as unnamed buttons in the accessibility tree. Their hover
tooltips do not provide an accessible name, which makes keyboard and assistive
technology operation ambiguous.

### QA-010 - Historical order name changes after the catalog item is edited

Order `#1` retained the charged `39,95 EUR`, quantity, size, color, and address
after catalog edits and archive, but its displayed item name changed from the
purchased `QA Browser Tee 20260819` to the later catalog name
`QA Browser Tee Updated 20260819`. The UI therefore mixes immutable purchase
facts with a mutable catalog label.

### QA-011 - Product archive has no administrator UI action

The authenticated product editor exposes edit, reset, variant add/remove, and
image controls, but no Archive Product action or confirmation. The archive
behavior had to be exercised through the protected admin API; storefront,
cart, wishlist, Stripe Price, and historical-order effects were then verified
in the Codex browser.

### QA-012 - Google OAuth is blocked by redirect_uri_mismatch

`Continue with Google` reaches Google's real authorization endpoint but Google
returns error 400 `redirect_uri_mismatch`. The rejected redirect URI is
`http://localhost:3100/api/auth/callback/google`, so local OAuth cannot be
completed with the currently configured Google client.

### QA-013 - Product images emit several Next.js layout/performance warnings

The browser reports `quality="90"` while `images.qualities` only allows `75`,
`sizes="100vw"` for an image that is not full viewport width, a `fill` image
whose computed parent height is zero, and above-the-fold images without eager
loading. These warnings are independent of the loopback adapter's invalid image
bytes and indicate real configuration/layout work.

### QA-014 - DialogContent instances emit missing-description warnings

Opening the mobile menu and profile dialog repeatedly logs Radix warnings that
`DialogContent` is missing `Description` or an explicit
`aria-describedby={undefined}`. The profile has visible explanatory copy, but it
is not connected as the dialog description.

### QA-015 - Mobile menu trigger has no accessible name

At 390x844 the hamburger trigger is an unnamed expanded/collapsed button in the
accessibility tree. The dialog itself is named `Menu` and its links work, but a
screen-reader user cannot identify the control that opens it.
