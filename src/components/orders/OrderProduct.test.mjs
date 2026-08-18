import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { formatPriceFromMinorUnits } from "../../utils/formatters.ts";
import { orderProductLink } from "./order-product-link.ts";

test("minor-unit formatting respects the persisted currency exponent", () => {
  assert.match(formatPriceFromMinorUnits(2500, "eur"), /25/);
  assert.match(formatPriceFromMinorUnits(2500, "usd"), /25/);
  assert.match(formatPriceFromMinorUnits(2500, "jpy"), /2[.,]?500/);
});

test("order cards render the immutable order-line price", async () => {
  const [component, page] = await Promise.all([
    readFile(new URL("./OrderProduct.tsx", import.meta.url), "utf8"),
    readFile("src/app/(user)/orders/[id]/page.tsx", "utf8"),
  ]);
  assert.match(component, /formatPriceFromMinorUnits\(unitAmount, currency\)/);
  assert.doesNotMatch(component, /formatPriceFromEuros\(price\)/);
  assert.match(page, /unitAmount: orderProduct\.unitAmount/);
  assert.match(page, /currency: orderProduct\.currency/);
  assert.match(page, /archivedAt: variant\.archivedAt/);
  assert.match(component, /orderProductLink\(\{/);
  assert.match(component, /isArchived \?[\s\S]*?Archived item/);
});

test("archived order items have no public catalog href", () => {
  const active = {
    productId: 7,
    category: "t-shirts",
    productArchivedAt: null,
    variantColor: "Blue",
    variantArchivedAt: null,
  };
  assert.equal(orderProductLink(active), "/t-shirts/7?variant=Blue");
  assert.equal(
    new URL(orderProductLink({ ...active, variantColor: "Blue & Gold+" }), "https://shop.test")
      .searchParams.get("variant"),
    "Blue & Gold+",
  );
  assert.equal(
    orderProductLink({ ...active, productArchivedAt: new Date() }),
    null,
  );
  assert.equal(
    orderProductLink({ ...active, variantArchivedAt: new Date() }),
    null,
  );
});
