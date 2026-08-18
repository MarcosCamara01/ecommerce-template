import type Stripe from "stripe";
import type { CatalogSyncOperationRecord, CatalogSyncStripeResult } from "./model";

type StripeCatalogClient = Pick<Stripe, "prices" | "products">;
const key = (operationId: string, step: string) => `catalog-sync:${operationId}:${step}`.slice(0, 255);
const productId = (price: Stripe.Price) => typeof price.product === "string" ? price.product : price.product.id;
const withLease = async <Result>(heartbeat: () => Promise<void>, operation: () => Promise<Result>) => {
  await heartbeat();
  return operation();
};

async function archiveByPrice(client: StripeCatalogClient, operationId: string, priceId: string, heartbeat: () => Promise<void>) {
  await withLease(heartbeat, () =>
    client.prices.update(
      priceId,
      { active: false },
      { idempotencyKey: key(operationId, `archive-price:${priceId}`) },
    )
  );
}

export async function applyCatalogSyncToStripe(client: StripeCatalogClient, operation: CatalogSyncOperationRecord, heartbeat: () => Promise<void>): Promise<CatalogSyncStripeResult> {
  const target = operation.target;
  if (target.kind === "preparing") {
    throw new Error("Catalog preparation must be activated before Stripe synchronization");
  }
  if (target.kind === "archive") {
    for (const priceId of target.stripePriceIds) await archiveByPrice(client, operation.id, priceId, heartbeat);
    return { kind: "archive", archivedPriceIds: target.stripePriceIds };
  }
  const results: Record<string, { productId: string; priceId: string }> = {};
  for (const variant of target.variants) {
    const metadata = { product_id: String(operation.productId), category: target.product.category, variant_color: variant.color, catalog_sync_operation_id: operation.id, catalog_variant_key: variant.key };
    const name = `${target.product.name} - ${variant.color}`;
    const amount = target.product.priceCents;
    if (!variant.stripePriceId) {
      const product = await withLease(heartbeat, () => client.products.create({ name, description: target.product.description || undefined, images: variant.images.slice(0, 8), active: true, metadata }, { idempotencyKey: key(operation.id, `${variant.key}:product`) }));
      const price = await withLease(heartbeat, () => client.prices.create({ product: product.id, unit_amount: amount, currency: "eur", active: true, metadata: { catalog_sync_operation_id: operation.id, catalog_variant_key: variant.key } }, { idempotencyKey: key(operation.id, `${variant.key}:price`) }));
      results[variant.key] = { productId: product.id, priceId: price.id };
      continue;
    }
    const oldPrice = await withLease(heartbeat, () => client.prices.retrieve(variant.stripePriceId!));
    const product = productId(oldPrice);
    await withLease(heartbeat, () => client.products.update(product, { name, description: target.product.description || undefined, images: variant.images.slice(0, 8), active: true, metadata }, { idempotencyKey: key(operation.id, `${variant.key}:product-update`) }));
    const canReusePrice =
      oldPrice.unit_amount === amount &&
      oldPrice.currency.toLowerCase() === "eur" &&
      oldPrice.type === "one_time";
    if (canReusePrice) {
      await withLease(heartbeat, () => client.prices.update(oldPrice.id, { active: true }, { idempotencyKey: key(operation.id, `${variant.key}:price-activate`) }));
      results[variant.key] = { productId: product, priceId: oldPrice.id };
    } else {
      const replacement = await withLease(heartbeat, () => client.prices.create({ product, unit_amount: amount, currency: "eur", active: true, metadata: { catalog_sync_operation_id: operation.id, catalog_variant_key: variant.key } }, { idempotencyKey: key(operation.id, `${variant.key}:price-replace`) }));
      await withLease(heartbeat, () => client.prices.update(oldPrice.id, { active: false }, { idempotencyKey: key(operation.id, `${variant.key}:price-retire`) }));
      results[variant.key] = { productId: product, priceId: replacement.id };
    }
  }
  for (const removed of target.removedVariants) await archiveByPrice(client, operation.id, removed.stripePriceId, heartbeat);
  return {
    kind: "upsert",
    variants: results,
    archivedPriceIds: target.removedVariants.map(
      (variant) => variant.stripePriceId,
    ),
  };
}
