"use client";

import { useRouter } from "next/navigation";
import { ProductForm } from "./ProductForm";

export function CreateProductForm() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push("/");
  };

  return <ProductForm mode="create" onSuccess={handleSuccess} />;
}
