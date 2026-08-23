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
