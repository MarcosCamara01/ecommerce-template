import assert from "node:assert/strict";
import test from "node:test";

import { assertSystemPrincipal } from "../identity/principal-authority.ts";
import { getOrderFulfillmentSystemPrincipal } from "./system-principal.ts";

test("fulfillment owns the accepted System Principal factory", () => {
  const principal = getOrderFulfillmentSystemPrincipal();
  assert.equal(assertSystemPrincipal(principal, "order-fulfillment"), principal);
});
