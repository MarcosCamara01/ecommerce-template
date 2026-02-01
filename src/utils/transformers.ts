import type {
  CartItem,
  OrderProduct,
  Product,
  ProductVariant,
} from "@/lib/db/drizzle/schema";

export function transformCartItemToOrderProduct(
  cartItem: CartItem,
  orderId: number,
): OrderProduct {
  return {
    id: Math.random(),
    orderId: orderId,
    variantId: cartItem.variantId,
    quantity: cartItem.quantity,
    size: cartItem.size,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function transformProductPrice(
  product: Product,
): Product & { priceFormatted: string } {
  return {
    ...product,
    priceFormatted: new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(product.price / 100),
  };
}

export function transformVariantSelectOptions(variant: ProductVariant) {
  return {
    color: variant.color,
    sizes: variant.sizes.map((size) => ({
      value: size,
      label: size,
    })),
    images: variant.images,
  };
}

export function calculateCartTotal(
  items: CartItem[],
  products: Map<number, Product>,
): number {
  return items.reduce((total, item) => {
    const product = products.get(item.variantId);
    if (!product) return total;
    return total + product.price * item.quantity;
  }, 0);
}

export function transformPaginationParams(page?: string, limit?: string) {
  return {
    page: Math.max(1, parseInt(page || "1", 10)),
    limit: Math.min(100, Math.max(1, parseInt(limit || "20", 10))),
  };
}

export function getOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}
