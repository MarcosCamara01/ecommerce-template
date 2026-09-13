export async function compensateUnpersistedCatalogCreate(input: {
  shellId: number | null;
  operationPersisted: boolean;
  uploadedImageUrls: string[];
  archiveShell(id: number): Promise<unknown>;
  deleteImage(url: string): Promise<unknown>;
}) {
  if (input.operationPersisted) return;
  const errors: unknown[] = [];
  if (input.shellId !== null) {
    try { await input.archiveShell(input.shellId); } catch (error) { errors.push(error); }
  }
  const cleanupResults = await Promise.allSettled(
    Array.from(new Set(input.uploadedImageUrls)).map(input.deleteImage),
  );
  for (const cleanup of cleanupResults) {
    if (cleanup.status === "rejected") errors.push(cleanup.reason);
  }
  if (errors.length) throw new AggregateError(errors, "Catalog create compensation failed");
}

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
