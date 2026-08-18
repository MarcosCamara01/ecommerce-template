import type { ProductApiResponse } from "@/types/admin";

export async function createProduct(
  formData: FormData
): Promise<ProductApiResponse> {
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
        errors: result.errors,
        operationId: result.operationId,
        syncState: result.syncState,
        retryable: result.retryable,
      };
    }

    return {
      success: true,
      message:
        result.message ||
        (response.status === 202
          ? "Product creation is being synchronized"
          : "Product created successfully"),
      data: result.data,
      accepted: response.status === 202 || result.accepted === true,
      operationId: result.operationId,
      syncState: result.syncState,
      retryable: result.retryable,
    };
  } catch (error) {
    console.error("Unexpected error:", error);
    return { success: false, message: "Unexpected error creating product" };
  }
}

export async function updateProduct(
  formData: FormData
): Promise<ProductApiResponse> {
  try {
    const response = await fetch("/api/admin/products", {
      method: "PUT",
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: result.error || "Error updating product",
        errors: result.errors,
        operationId: result.operationId,
        syncState: result.syncState,
        retryable: result.retryable,
      };
    }

    return {
      success: true,
      message:
        result.message ||
        (response.status === 202
          ? "Product update is being synchronized"
          : "Product updated successfully"),
      data: result.data,
      accepted: response.status === 202 || result.accepted === true,
      operationId: result.operationId,
      syncState: result.syncState,
      retryable: result.retryable,
    };
  } catch (error) {
    console.error("Unexpected error:", error);
    return { success: false, message: "Unexpected error updating product" };
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
