import type { E2EConfig } from "e2e";
import { web } from "@e2e-dev/web";

import { claudeCli } from "./tests/support/claude-cli";

// The store under test. It has to be the origin the app itself is served
// from (APP_URL): the proxy redirects every other host to that one.
const app = { url: process.env.E2E_APP_URL ?? "http://localhost:3000" };

// Accounts that already exist come from the environment and are declared
// here so that the runner keeps their values out of reports and model input.
const account = (prefix: string) => {
  const password = process.env[`${prefix}_PASSWORD`];
  return password
    ? { username: process.env[`${prefix}_USERNAME`] ?? "", password }
    : undefined;
};
const customer = account("E2E_USER_CUSTOMER");
const admin = account("E2E_USER_ADMIN");

export default {
  tests: "tests/**/*.e2e.ts",
  targets: [
    {
      name: "desktop",
      engine: web({ viewport: { width: 1440, height: 900 } }),
      app,
    },
  ],
  // A trace is only worth its weight when a test went wrong.
  trace: "retain-on-failure",
  // A test is a few goals, and the agent takes its time over each.
  timeout: 300_000,
  agents: {
    default: {
      // The agent steps are done by Claude through its CLI, with the account
      // `claude` is signed in to: see tests/support/claude-cli.ts.
      model: claudeCli(process.env.E2E_MODEL ?? "sonnet"),
      context: [
        "This is a clothing store. Its sections are New arrivals (every piece), T-shirts, Pants and Sweatshirts.",
        "A product is called a piece. The cart is called the Bag: the Bag button in the header opens it as a panel, and the bag page is at /cart.",
        "On a listing, each card is one piece. Moving the pointer over a card reveals its Quick add buttons, one per size, which add that size straight to the bag. The heart on a card saves the piece to the wishlist.",
        "On the page of a piece, choose a Color and a Size, then press the button that reads 'Add <size> to bag'.",
        "Only a signed-in shopper can add to the bag or save to the wishlist.",
      ].join(" "),
      system: [
        "Use the names written on screen.",
        "Do exactly what the goal asks and stop there: never add, remove, save or change anything else.",
        "Never start a checkout and never log out unless the goal asks for it.",
        "Before you finish, look at the screen and confirm that the goal is met.",
      ].join(" "),
    },
  },
  credentials: {
    ...(customer ? { customer } : {}),
    ...(admin ? { admin } : {}),
  },
} satisfies E2EConfig;
