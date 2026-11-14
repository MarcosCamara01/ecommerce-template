import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import test from "node:test";

import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

import { formatPriceFromMinorUnits } from "../../utils/formatters.ts";
import { orderProductLink } from "./order-product-link.ts";

const nativeRequire = createRequire(import.meta.url);

async function renderOrderLine({ quantity, unitAmount }) {
  const source = await readFile(new URL("./OrderProduct.tsx", import.meta.url), "utf8");
  const modules = {
    "next/image": { __esModule: true, default: () => null },
    "@/components/ui/link": { __esModule: true, default: "a" },
    "@/constants/colors": { swatchBackground: () => "transparent" },
    "@/utils/formatters": { formatPriceFromMinorUnits },
    "@/lib/images/blur.server": { getBlurDataURL: async () => null },
    "./order-product-link": { orderProductLink },
  };
  const compiled = ts.transpileModule(source, {
    compilerOptions: { esModuleInterop: true, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
    fileName: "OrderProduct.tsx",
  }).outputText;
  const componentModule = { exports: {} };
  new Function("require", "module", "exports", compiled)(
    (id) => modules[id] ?? nativeRequire(id),
    componentModule,
    componentModule.exports,
  );
  const line = await componentModule.exports.OrderProduct({
    product: { category: "pants", id: 104, archivedAt: null, variants: [{ archivedAt: null }] },
    size: "M",
    quantity,
    unitAmount,
    currency: "eur",
    productName: "Pleated baggy fit pants",
    variantColor: "Black",
    imageUrl: "/pants.jpg",
  });
  return renderToStaticMarkup(line).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
}

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
  assert.match(page, /productName: orderProduct\.productName/);
  assert.match(page, /variantColor: orderProduct\.variantColor/);
  assert.match(page, /imageUrl: orderProduct\.imageUrl/);
  assert.match(component, /productName/);
  assert.match(component, /variantColor/);
  assert.match(component, /imageUrl/);
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

test("an order line shows what the line cost, and the unit price when it holds more than one", async () => {
  const pair = await renderOrderLine({ quantity: 2, unitAmount: 1995 });
  assert.match(pair, /Qty 2/);
  assert.match(pair, /€39\.90 €19\.95 each/);

  const single = await renderOrderLine({ quantity: 1, unitAmount: 1995 });
  assert.match(single, /€19\.95/);
  assert.doesNotMatch(single, /each/);
});
