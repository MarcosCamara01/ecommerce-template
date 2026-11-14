interface VariantPricedCartItem {
  variantId: number;
  quantity: number | null;
  variant: { stripeId: string | null };
}

interface StripeLineItem {
  price: string;
  quantity: number;
}

/**
 * The charged price always comes from the variant's
 * `products_variants.stripe_id`, never from the cart row's own
 * `cart_items.stripe_id`. Clients once supplied that column, so a buyer could
 * pair an expensive variant with a cheap price id, pay the cheap price and get
 * an order for the expensive product. Pricing from the variant ties the charge
 * and the order to the same `variantId`.
 */
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
