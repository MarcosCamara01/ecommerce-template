"use client";

import { useRouter } from "next/navigation";
import { ProductForm } from "./ProductForm";
import { revalidateProducts } from "@/app/actions";
import type { ProductWithVariants } from "@/schemas";

export function CreateProductForm() {
  const router = useRouter();

  const handleSuccess = async (createdProduct: ProductWithVariants) => {
    // Revalidate products cache (including new product) and redirect to home
    await revalidateProducts(createdProduct.id);
    router.push("/");
  };

  return <ProductForm mode="create" onSuccess={handleSuccess} />;
}
