import { expect, unique } from "e2e";

import { asShopper, NEEDS_WRITES, newAccount, settled, shopperInStore, test, WRITES } from "./support/store";

test.describe("signing in", { tags: ["auth", "agent"] }, () => {
  test("a wrong password is refused without saying which part was wrong", async ({ app, api, agent, browser }) => {
    await app.open("/login");

    await agent.act("sign in with the email {email} and the password {password}", {
      params: { email: "nobody@example.test", password: "not-the-password" },
    });

    await expect(browser).toHaveURL(/\/login(\?|$)/);
    await agent.assert(
      "the page says the sign-in was refused, in words that do not tell whether the email or the password was the wrong one",
    );
    expect(await shopperInStore(api)).toBeNull();
  });

  test("sign-in and sign-up point at each other", async ({ app, agent, browser }) => {
    await app.open("/login");

    await agent.act("I have no account yet: go to the page where one is created");
    await expect(browser).toHaveURL("/register");

    await agent.act("I do have an account after all: go back to the sign-in page");
    await expect(browser).toHaveURL("/login");
  });
});

test.describe("accounts", { tags: ["auth", "agent", "writes"], skip: WRITES ? undefined : NEEDS_WRITES }, () => {
  test("a visitor creates an account, logs out and signs back in", async ({ app, api, agent, browser }) => {
    // A shopper nobody has seen before, with a password made up for this run.
    // The values are new on every run: marked so, the recording still replays.
    const account = newAccount("signup");
    const email = unique(account.email);
    const password = unique(account.password);
    await app.open("/register");

    await agent.act("create an account for {name} with the email {email} and the password {password}", {
      params: { name: account.name, email, password },
    });
    // The new shopper lands in the store, already signed in.
    await expect(browser).toHaveURL("/");
    expect(await shopperInStore(api)).toMatchObject({ email: account.email, name: account.name });

    await agent.act("log out of the account");
    await settled(browser);
    await agent.assert("nobody is signed in: the store offers a way to sign in and no account menu");
    expect(await shopperInStore(api)).toBeNull();

    await app.open("/login");
    await agent.act("sign in with the email {email} and the password {password}", {
      params: { email, password },
    });
    await expect(browser).toHaveURL("/");
    expect(await shopperInStore(api)).toMatchObject({ email: account.email });
  });
});

// Who may see what is not a matter of judgment, and neither is a notice that
// comes and goes. These tests name the labels of today's interface.
test.describe("doors that stay shut", { tags: ["auth"] }, () => {
  test("orders and the admin area send a visitor to sign in", { tags: ["smoke"] }, async ({ app, browser }) => {
    for (const path of ["/orders", "/admin/products/create"]) {
      await app.open(path);
      await expect(browser).toHaveURL(/\/login(\?|$)/);
    }
  });

  test("the password can be shown while it is typed", async ({ app, screen }) => {
    await app.open("/login");
    await screen.getByLabel("Password").fill("a password to look at");

    await screen.getByRole("button", "Show password").tap();
    await expect(screen.getByRole("button", "Hide password")).toHaveAttribute("aria-pressed", "true");
    await screen.getByRole("button", "Hide password").tap();
    await expect(screen.getByRole("button", "Show password")).toHaveAttribute("aria-pressed", "false");
  });
});

test.describe("an email that is taken", { tags: ["auth", "writes"], skip: WRITES ? undefined : NEEDS_WRITES }, () => {
  test("cannot be used for a second account", async ({ app, api, screen, browser }) => {
    const account = newAccount("twice");
    for (const attempt of ["first", "second"]) {
      await app.open("/register");
      await screen.getByLabel("Full name").fill(account.name);
      await screen.getByLabel("Email").fill(account.email);
      await screen.getByLabel("Password").fill(account.password);
      await screen.getByRole("button", "Create account").tap();
      if (attempt === "first") {
        // Signed up and signed in: forget the session and come back as a stranger.
        await expect(browser).toHaveURL("/");
        await app.clearState();
      }
    }

    await expect(screen.getByText(/already/i).first()).toBeVisible();
    await expect(browser).toHaveURL(/\/register(\?|$)/);
    expect(await shopperInStore(api)).toBeNull();
  });
});

test.describe("a shopper who is not an admin", asShopper("account"), () => {
  test("is sent back to the store from the admin area", async ({ app, browser }) => {
    await app.open("/admin/products/create");
    await expect(browser).toHaveURL("/");
  });
});
