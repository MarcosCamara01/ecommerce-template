"use client";

import { useRouter } from "next/navigation";
import { ProductForm } from "./ProductForm";
import type { ProductWithVariants, ProductSize } from "@/lib/db/drizzle/schema";
import type { ProductFormData } from "@/types/admin";

interface EditProductFormProps {
  product: ProductWithVariants;
  restoreArchived?: boolean;
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
      sizes: variant.sizes as ProductSize[],
      images: variant.images,
    })),
  };
}

export function EditProductForm({
  product,
  restoreArchived = false,
}: EditProductFormProps) {
  const router = useRouter();

  const handleSuccess = () => {
    router.push("/");
  };

  return (
    <ProductForm
      mode="edit"
      initialData={mapProductToFormData(product)}
      restoreArchived={restoreArchived}
      onSuccess={handleSuccess}
    />
  );
}
