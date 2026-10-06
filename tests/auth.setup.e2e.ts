import { expect } from "e2e";

import { HAS_ADMIN, HAS_CUSTOMER, SHOPPERS, WRITES, newAccount, signIn, signUp, test } from "./support/store";

// Sessions are opened through the auth API, not the forms: it is quick, it
// waits out the rate limit, and the forms have tests of their own in
// auth.e2e.ts. Each session is saved once and restored by the tests that
// name it.

if (WRITES) {
  for (const shopper of SHOPPERS) {
    test.setup(`a new shopper signs up (${shopper})`, { sessions: [shopper] }, async ({ app, screen, browser, session }) => {
      await browser.setCookies(await signUp(app, newAccount(shopper)));
      await app.open("/");
      await expect(screen.getByRole("banner").getByRole("button", "Account")).toBeVisible();
      await session.save(shopper);
    });
  }
}

const returning = [
  { session: "customer", wanted: HAS_CUSTOMER, prefix: "E2E_USER_CUSTOMER" },
  { session: "admin", wanted: HAS_ADMIN, prefix: "E2E_USER_ADMIN" },
] as const;

for (const { session: name, wanted, prefix } of returning) {
  if (!wanted) continue;
  test.setup(`the ${name} signs in`, { sessions: [name] }, async ({ app, screen, browser, session }) => {
    await browser.setCookies(
      await signIn(app, {
        email: process.env[`${prefix}_USERNAME`] ?? "",
        password: process.env[`${prefix}_PASSWORD`] ?? "",
      }),
    );
    await app.open("/");
    await expect(screen.getByRole("banner").getByRole("button", "Account")).toBeVisible();
    await session.save(name);
  });
}
