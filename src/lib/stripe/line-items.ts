/**
 * Single point of truth for turning cart rows into Stripe line items.
 *
 * Security invariant (REPORT-1627): the price charged is ALWAYS read from the
 * joined `products_variants.stripe_id`, never from `cart_items.stripe_id`.
 * The cart row's own `stripe_id` was historically supplied by the client, so a
 * caller could pair an expensive `variantId` with a cheap price id and be
 * charged the cheap one while the webhook recorded the expensive product.
 * Deriving the price from the variant makes the charge and the resulting order
 * both functions of `variantId`, so they cannot diverge.
 *
 * Intentionally dependency-free so it can be unit tested in isolation.
 */

export interface VariantPricedCartItem {
  variantId: number;
  quantity: number | null;
  variant: { stripeId: string | null };
}

export interface StripeLineItem {
  price: string;
  quantity: number;
}

export function buildLineItems(
  cartItems: VariantPricedCartItem[],
): StripeLineItem[] {
  return cartItems.map((item) => {
    const price = item.variant.stripeId;
    if (!price) {
      throw new Error(`Missing stripeId for variant ${item.variantId}`);
    }
    return { price, quantity: item.quantity || 1 };
  });
}
