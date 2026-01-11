import { ProductWithVariants } from "@/schemas";

type CreateProductResponse = {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
  data?: ProductWithVariants;
};

export async function createProduct(
  formData: FormData
): Promise<CreateProductResponse> {
  try {
    const response = await fetch("/api/admin/products", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: result.error || "Error creating product",
      };
    }

    return {
      success: true,
      message: result.message || "Product created successfully",
      data: result.data,
    };
  } catch (error) {
    console.error("Unexpected error:", error);
    return { success: false, message: "Unexpected error creating product" };
  }
}

export async function deleteProduct(productId: number): Promise<boolean> {
  try {
    const response = await fetch(`/api/admin/products?id=${productId}`, {
      method: "DELETE",
    });

    return response.ok;
  } catch (error) {
    console.error("Error deleting product:", error);
    return false;
  }
}
