"use client";

import { useRouter } from "next/navigation";
import { ProductForm, type ProductFormData } from "./ProductForm";
import { revalidateProducts } from "@/app/actions";
import type { ProductWithVariants, ProductSize } from "@/schemas";

interface EditProductFormProps {
  product: ProductWithVariants;
}

export function EditProductForm({ product }: EditProductFormProps) {
  const router = useRouter();

  const initialData: ProductFormData = {
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

  const handleSuccess = async (updatedProduct: ProductWithVariants) => {
    // Revalidate products cache (including this specific product) and redirect to home
    await revalidateProducts(updatedProduct.id);
    router.push("/");
  };

  return (
    <ProductForm 
      mode="edit" 
      initialData={initialData}
      onSuccess={handleSuccess}
    />
  );
}
