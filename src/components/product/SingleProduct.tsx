import { notFound, redirect } from "next/navigation";

import { getProduct } from "@/app/actions";
import { shopSections } from "@/constants/navigation";
import type { ProductVariant } from "@/lib/db/drizzle/schema";
import { getBlurDataURL } from "@/lib/images/blur.server";
import { tintForColor } from "@/lib/tint";

import { EditProductButton } from "./EditProductButton";
import { ProductInfo } from "./ProductInfo";
import { ProductView } from "./ProductView";

interface SingleProductProps {
  id: number;
  category: string;
  selectedVariantColor?: ProductVariant["color"];
}

export const SingleProduct = async ({
  id,
  category,
  selectedVariantColor,
}: SingleProductProps) => {
  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  if (product.category !== category) {
    const variantQuery = selectedVariantColor
      ? `?variant=${encodeURIComponent(selectedVariantColor)}`
      : "";

    redirect(`/${product.category}/${id}${variantQuery}`);
  }

  if (product.variants.length === 0) {
    notFound();
  }

  const selectedVariant = product.variants.find(
    (variant) => variant.color === selectedVariantColor,
  );

  if (!selectedVariant) {
    redirect(
      `/${product.category}/${id}?variant=${encodeURIComponent(product.variants[0].color)}`,
    );
  }

  const section = shopSections.find((entry) => entry.key === product.category);
  const tints = Object.fromEntries(
    product.variants.map((variant) => [variant.id, tintForColor(variant.color)]),
  );
  // Placeholders only for the photos on screen at first paint.
  const blurDataURLs = Object.fromEntries(
    await Promise.all(
      selectedVariant.images.map(
        async (image) => [image, await getBlurDataURL(image)] as const,
      ),
    ),
  );

  return (
    <ProductView
      key={`${product.id}-${selectedVariant.id}`}
      product={product}
      categoryLabel={section?.label ?? product.category}
      categoryHref={section?.href ?? `/${product.category}`}
      tints={tints}
      initialVariantId={selectedVariant.id}
      blurDataURLs={blurDataURLs}
      editButton={<EditProductButton productId={product.id} />}
      details={<ProductInfo />}
    />
  );
};
