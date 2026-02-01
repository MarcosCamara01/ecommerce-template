"use client";

import { useRouter } from "next/navigation";
import { ProductForm } from "./ProductForm";
import { revalidateProducts } from "@/app/actions";
import type { ProductWithVariants, ProductSize } from "@/lib/db/drizzle/schema";
import type { ProductFormData } from "@/types/admin";

interface EditProductFormProps {
  product: ProductWithVariants;
}

function mapProductToFormData(product: ProductWithVariants): ProductFormData {
  return {
    id: product.id,
    basicInfo: {
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
    },
    mainImageUrl: product.img,
    variants: product.variants.map((variant) => ({
      id: variant.id,
      color: variant.color,
      stripeId: variant.stripeId,
      sizes: variant.sizes as ProductSize[],
      images: variant.images,
    })),
  };
}

export function EditProductForm({ product }: EditProductFormProps) {
  const router = useRouter();

  const handleSuccess = async (updatedProduct: ProductWithVariants) => {
    await revalidateProducts(updatedProduct.id);
    router.push("/");
  };

  return (
    <ProductForm
      mode="edit"
      initialData={mapProductToFormData(product)}
      onSuccess={handleSuccess}
    />
  );
}
