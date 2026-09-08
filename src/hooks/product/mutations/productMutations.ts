import type { ProductApiResponse } from "@/types/admin";

type ProductMutationPayload = Partial<ProductApiResponse> & {
  error?: string;
};

export async function executeProductMutation(input: {
  method: "POST" | "PUT" | "DELETE";
  url: string;
  body?: FormData;
  errorMessage: string;
  unexpectedErrorMessage: string;
  successMessage: string;
  acceptedMessage?: string;
}): Promise<ProductApiResponse> {
  try {
    const response = await fetch(input.url, {
      method: input.method,
      body: input.body,
    });
    const result = (await response.json()) as ProductMutationPayload;
    if (!response.ok) {
      return {
        success: false,
        message: result.error || input.errorMessage,
        errors: result.errors,
        operationId: result.operationId,
        syncState: result.syncState,
        retryable: result.retryable,
      };
    }
    const accepted = response.status === 202 || result.accepted === true;
    return {
      success: true,
      message:
        result.message ||
        (accepted && input.acceptedMessage
          ? input.acceptedMessage
          : input.successMessage),
      data: result.data,
      accepted,
      operationId: result.operationId,
      syncState: result.syncState,
      retryable: result.retryable,
    };
  } catch (error) {
    console.error(input.unexpectedErrorMessage, error);
    return { success: false, message: input.unexpectedErrorMessage };
  }
}

export async function createProduct(
  formData: FormData
): Promise<ProductApiResponse> {
  return executeProductMutation({
    method: "POST",
    url: "/api/admin/products",
    body: formData,
    errorMessage: "Error creating product",
    unexpectedErrorMessage: "Unexpected error creating product",
    successMessage: "Product created successfully",
    acceptedMessage: "Product creation is being synchronized",
  });
}
export async function updateProduct(
  formData: FormData
): Promise<ProductApiResponse> {
  return executeProductMutation({
    method: "PUT",
    url: "/api/admin/products",
    body: formData,
    errorMessage: "Error updating product",
    unexpectedErrorMessage: "Unexpected error updating product",
    successMessage: "Product updated successfully",
    acceptedMessage: "Product update is being synchronized",
  });
}

export async function archiveProduct(productId: number): Promise<ProductApiResponse> {
  return executeProductMutation({
    method: "DELETE",
    url: `/api/admin/products?id=${productId}`,
    errorMessage: "Error archiving product",
    unexpectedErrorMessage: "Unexpected error archiving product",
    successMessage: "Product archived successfully",
    acceptedMessage: "Product archive is being synchronized",
  });
}
