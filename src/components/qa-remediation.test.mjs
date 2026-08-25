import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = (path) => readFile(path, "utf8");

test("auth forms have a safe native POST fallback", async () => {
  const [login, register, nativeRoute] = await Promise.all([
    source("src/app/(auth)/login/page.tsx"),
    source("src/app/(auth)/register/page.tsx"),
    source("src/app/api/auth/email-form/route.ts"),
  ]);
  assert.match(login, /action="\/api\/auth\/email-form"/);
  assert.match(login, /name="mode" value="sign-in"/);
  assert.match(login, /name="callbackURL" value=\{callbackURL\}/);
  assert.match(register, /action="\/api\/auth\/email-form"/);
  assert.match(register, /name="mode" value="sign-up"/);
  assert.match(register, /name="callbackURL" value=\{callbackURL\}/);
  assert.match(nativeRoute, /status:\s*303/);
  assert.match(nativeRoute, /getSetCookie/);
  assert.match(nativeRoute, /\/login\?error=/);
  assert.match(nativeRoute, /\/register\?error=/);
});

test("cart actions stay disabled until client hydration", async () => {
  const addToCart = await source("src/components/cart/AddToCart.tsx");
  assert.match(addToCart, /useHydrated/);
  assert.match(addToCart, /disabled=\{[^}]*!isHydrated/);
  assert.doesNotMatch(addToCart, /type="submit"/);
});

test("icon-only controls expose accessible names and sheet descriptions", async () => {
  const [password, navbar, variant] = await Promise.all([
    source("src/components/ui/form/PasswordInput.tsx"),
    source("src/components/layout/navbar/Navbar.tsx"),
    source("src/components/admin/VariantForm.tsx"),
  ]);
  assert.match(password, /aria-label=\{showPassword \? "Hide password" : "Show password"\}/);
  assert.match(password, /aria-pressed=\{showPassword\}/);
  assert.match(navbar, /aria-label="Open navigation menu"/);
  assert.match(navbar, /<SheetDescription/);
  assert.match(variant, /aria-label=\{`Move variant \$\{index \+ 1\} up`\}/);
  assert.match(variant, /aria-label=\{`Remove variant \$\{index \+ 1\}`\}/);
});

test("profile dialog coordinates menu teardown and restores visible focus", async () => {
  const [navbar, userMenu, editProfile] = await Promise.all([
    source("src/components/layout/navbar/Navbar.tsx"),
    source("src/components/layout/navbar/UserMenu.tsx"),
    source("src/components/layout/navbar/EditProfile.tsx"),
  ]);

  assert.match(userMenu, /onCloseAutoFocus=\{\(event\) =>/);
  assert.match(userMenu, /skipCloseAutoFocusRef\.current/);
  assert.match(userMenu, /event\.preventDefault\(\)/);
  assert.match(userMenu, /queueMicrotask\(onEditProfile\)/);
  assert.match(userMenu, /onSelect=\{\(\) =>/);
  assert.doesNotMatch(userMenu, /manager\.open|onClick=\{manager\.open\}/);
  assert.match(navbar, /mobileMenuTriggerRef/);
  assert.match(navbar, /profileReturnFocusRef/);
  assert.match(navbar, /onCloseAutoFocus=\{\(event\) =>/);
  assert.match(navbar, /queueMicrotask\(editProfileManager\.open\)/);
  assert.match(editProfile, /onOpenAutoFocus=\{\(event\) =>/);
  assert.match(editProfile, /nameRef\.current\?\.focus\(\)/);
  assert.match(editProfile, /onCloseAutoFocus=\{\(event\) =>/);
  assert.match(editProfile, /returnFocusRef\.current/);
});

test("empty categories and footer links provide real recovery paths", async () => {
  const [category, footer] = await Promise.all([
    source("src/app/(store)/[category]/page.tsx"),
    source("src/components/layout/footer/Footer.tsx"),
  ]);
  assert.match(category, /products\.length === 0/);
  assert.match(category, /No products available in/);
  assert.doesNotMatch(footer, /href="#"/);
  assert.match(footer, /rel="noopener noreferrer"/);
});

test("product images use one responsive render tree", async () => {
  const images = await source("src/components/product/ProductImages.tsx");
  assert.equal(
    (images.match(/selectedVariant\.images\.map\(\(image, index\)/g) ?? []).length,
    1,
  );
  assert.doesNotMatch(images, /quality=\{90\}/);
  assert.match(images, /priority=\{index === 0\}/);
});

test("primary routes keep exactly one accessible heading across data states", async () => {
  const files = {
    home: "src/app/page.tsx",
    search: "src/app/(store)/search/page.tsx",
    cartPage: "src/app/(user)/cart/page.tsx",
    cartContent: "src/components/cart/CartProducts.tsx",
    wishlistPage: "src/app/(user)/wishlist/page.tsx",
    wishlistContent: "src/components/wishlist/WishlistProducts.tsx",
    orders: "src/app/(user)/orders/page.tsx",
    orderDetails: "src/app/(user)/orders/[id]/page.tsx",
    product: "src/components/product/SingleProduct.tsx",
    error: "src/app/error.tsx",
  };
  const entries = await Promise.all(
    Object.entries(files).map(async ([name, path]) => [name, await source(path)]),
  );
  const sources = Object.fromEntries(entries);
  const h1Count = (value) => (value.match(/<h1\b/g) ?? []).length;

  for (const name of [
    "home",
    "search",
    "cartPage",
    "wishlistPage",
    "orders",
    "orderDetails",
    "product",
    "error",
  ]) {
    assert.equal(h1Count(sources[name]), 1, `${name} must own one h1`);
  }
  assert.equal(h1Count(sources.cartContent), 0);
  assert.equal(h1Count(sources.wishlistContent), 0);
  assert.match(sources.product, /<h1 className="sr-only">\{product\.name\}<\/h1>/);
  assert.doesNotMatch(sources.search, /<h3[^>]*>\s*No products found/);
});

test("remaining route shells and result states preserve heading hierarchy", async () => {
  const files = {
    category: "src/app/(store)/[category]/page.tsx",
    result: "src/app/(user)/result/page.tsx",
    success: "src/components/checkout/SuccessContent.tsx",
    status: "src/components/checkout/StatusContent.tsx",
    noSession: "src/components/checkout/NoSessionError.tsx",
    auth: "src/components/auth/AuthShell.tsx",
    help: "src/app/(store)/help/[topic]/page.tsx",
    admin: "src/components/admin/ProductForm.tsx",
    notFound: "src/app/not-found.tsx",
    productInfo: "src/components/product/ProductInfo.tsx",
    accordion: "src/components/ui/accordion.tsx",
  };
  const entries = await Promise.all(
    Object.entries(files).map(async ([name, path]) => [name, await source(path)]),
  );
  const sources = Object.fromEntries(entries);
  const h1Count = (value) => (value.match(/<h1\b/g) ?? []).length;

  for (const name of ["category", "result", "auth", "help", "admin", "notFound"]) {
    assert.equal(h1Count(sources[name]), 1, `${name} must own one h1`);
  }
  for (const name of ["success", "status", "noSession"]) {
    assert.equal(h1Count(sources[name]), 0, `${name} must use the result route h1`);
  }
  assert.doesNotMatch(sources.success, /<h3\b/);
  assert.equal(
    (sources.productInfo.match(/headingLevel=\{2\}/g) ?? []).length,
    3,
  );
  assert.match(sources.accordion, /<AccordionPrimitive\.Header asChild>/);
});

test("product editing exposes archive and explicit restore controls", async () => {
  const [edit, form, mutations] = await Promise.all([
    source("src/components/admin/EditProductForm.tsx"),
    source("src/components/admin/ProductForm.tsx"),
    source("src/hooks/product/mutations/productMutations.ts"),
  ]);
  assert.match(edit, /ArchiveProductButton/);
  assert.match(form, /restoreArchived \? "Restore Product"/);
  assert.match(mutations, /export async function archiveProduct/);
});

test("Google OAuth is opt-in and documents its exact callback", async () => {
  const [login, auth, env, readme] = await Promise.all([
    source("src/app/(auth)/login/page.tsx"),
    source("src/utils/auth.ts"),
    source(".env.example"),
    source("README.md"),
  ]);
  assert.match(login, /NEXT_PUBLIC_GOOGLE_AUTH_ENABLED/);
  assert.match(auth, /GOOGLE_AUTH_ENABLED === "true"/);
  assert.match(auth, /googleAuthEnabled[\s\S]*googleSocialProvider/);
  assert.match(auth, /NEXT_PUBLIC_GOOGLE_AUTH_ENABLED[\s\S]*throw new Error/);
  assert.match(env, /NEXT_PUBLIC_GOOGLE_AUTH_ENABLED="false"/);
  assert.match(env, /GOOGLE_AUTH_ENABLED="false"/);
  assert.match(readme, /\/api\/auth\/callback\/google/);
});

test("review follow-ups remove commercial promises and UI protocol state", async () => {
  const [help, productForm, adminMutations, orderStatus, orderCard, orderSummary, productMutations, authMutations] = await Promise.all([
    source("src/app/(store)/help/[topic]/page.tsx"),
    source("src/components/admin/ProductForm.tsx"),
    source("src/lib/catalog-sync/admin-mutations.ts"),
    source("src/lib/orders/status.ts"),
    source("src/components/orders/OrderCard.tsx"),
    source("src/components/orders/OrderSummary.tsx"),
    source("src/hooks/product/mutations/productMutations.ts"),
    source("src/hooks/auth/useAuthMutation.ts"),
  ]);
  assert.doesNotMatch(help, /14 days|1[–-]2 business days|tracking information/i);
  assert.doesNotMatch(productForm, /crypto\.subtle|sessionStorage|retryable|new FormData|formData\.append/);
  assert.match(productForm, /useCatalogCreateCommand/);
  assert.match(productForm, /encodeProductFormData/);
  assert.match(adminMutations, /finalizeCatalogMutation/);
  assert.match(orderStatus, /className:/);
  assert.match(orderCard, /orderViewModel/);
  assert.match(orderSummary, /orderViewModel/);
  assert.match(productMutations, /executeProductMutation/);
  assert.match(authMutations, /safeLocalCallback/);
  assert.doesNotMatch(authMutations, /callbackURL:\s*"\/"/);
});
