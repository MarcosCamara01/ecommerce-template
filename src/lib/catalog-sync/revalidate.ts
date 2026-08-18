import "server-only";

import { revalidateTag } from "next/cache";

export async function revalidateProducts(productId?: number): Promise<void> {
  revalidateTag("products", { expire: 0 });
  if (productId) revalidateTag(`product-${productId}`, { expire: 0 });
}
