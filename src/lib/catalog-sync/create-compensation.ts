export class CatalogUploadCompensationError extends AggregateError {
  readonly cause: unknown;

  constructor(originalError: unknown, cleanupErrors: unknown[]) {
    super(cleanupErrors, "Catalog upload compensation failed");
    this.name = "CatalogUploadCompensationError";
    this.cause = originalError;
  }
}

export async function compensateUploadedCatalogImages(input: {
  originalError: unknown;
  uploadedImageUrls: string[];
  deleteImage(url: string): Promise<unknown>;
}) {
  const cleanupResults = await Promise.allSettled(
    Array.from(new Set(input.uploadedImageUrls)).map(input.deleteImage),
  );
  const cleanupErrors = cleanupResults.flatMap((result) =>
    result.status === "rejected" ? [result.reason] : [],
  );

  if (cleanupErrors.length) {
    throw new CatalogUploadCompensationError(
      input.originalError,
      cleanupErrors,
    );
  }
}
