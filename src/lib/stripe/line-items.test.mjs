import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildLineItems } from "./line-items.ts";

// Mirrors the REPORT-1627 PoC: "Camiseta PoC" (29,99 €) and
// "Chaqueta Cara PoC" (999 €).
const CHEAP_PRICE_ID = "price_camiseta_2999";
const EXPENSIVE_PRICE_ID = "price_chaqueta_99900";

const EXPENSIVE_VARIANT_ID = 42;

/**
 * A cart row as it exists after the attacker POSTed the expensive variantId
 * paired with the cheap product's stripeId. `stripeId` is the poisoned column
 * on cart_items; `variant.stripeId` is the authoritative mapping.
 */
function poisonedCartRow(overrides = {}) {
  return {
    id: 1,
    variantId: EXPENSIVE_VARIANT_ID,
    quantity: 1,
    size: "M",
    stripeId: CHEAP_PRICE_ID,
    variant: { id: EXPENSIVE_VARIANT_ID, stripeId: EXPENSIVE_PRICE_ID },
    ...overrides,
  };
}

describe("buildLineItems", () => {
  it("charges the variant's price, not the poisoned cart row price", () => {
    const lineItems = buildLineItems([poisonedCartRow()]);

    assert.deepEqual(lineItems, [
      { price: EXPENSIVE_PRICE_ID, quantity: 1 },
    ]);
  });

  it("never emits the poisoned price id, whatever the cart row claims", () => {
    const lineItems = buildLineItems([
      poisonedCartRow(),
      poisonedCartRow({ id: 2, quantity: 3 }),
    ]);

    const emitted = lineItems.map((item) => item.price);
    assert.ok(
      !emitted.includes(CHEAP_PRICE_ID),
      `line items leaked the poisoned price id: ${emitted.join(", ")}`,
    );
    assert.deepEqual(emitted, [EXPENSIVE_PRICE_ID, EXPENSIVE_PRICE_ID]);
  });

  it("keeps the quantity from the cart row", () => {
    const lineItems = buildLineItems([poisonedCartRow({ quantity: 3 })]);

    assert.equal(lineItems[0].quantity, 3);
  });

  it("defaults a missing quantity to 1", () => {
    const lineItems = buildLineItems([poisonedCartRow({ quantity: null })]);

    assert.equal(lineItems[0].quantity, 1);
  });

  it("passes through an honest cart row unchanged", () => {
    const honest = poisonedCartRow({ stripeId: EXPENSIVE_PRICE_ID });

    assert.deepEqual(buildLineItems([honest]), [
      { price: EXPENSIVE_PRICE_ID, quantity: 1 },
    ]);
  });

  it("throws when the variant has no Stripe price, rather than falling back to the cart row", () => {
    const orphan = poisonedCartRow({ variant: { stripeId: null } });

    assert.throws(
      () => buildLineItems([orphan]),
      /Missing stripeId for variant 42/,
    );
  });
});
