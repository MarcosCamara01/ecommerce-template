import type { CatalogSyncOperationRecord } from "./model";

type CancellationInput = Readonly<{
  operation: CatalogSyncOperationRecord;
  beginCancellation: () => Promise<CatalogSyncOperationRecord | null>;
  removeImages: (imageUrls: string[]) => Promise<void>;
  completeCancellation: () => Promise<CatalogSyncOperationRecord | null>;
}>;

export async function runPreparationCancellation(
  input: CancellationInput,
): Promise<CatalogSyncOperationRecord | null> {
  let operation = input.operation;
  if (operation.target.kind !== "preparing") {
    throw new Error("Preparation cancellation requires a preparation target");
  }
  if (operation.state === "preparing") {
    const begun = await input.beginCancellation();
    if (!begun) return null;
    operation = begun;
  }
  if (operation.state !== "cancelling" || operation.target.kind !== "preparing") {
    return null;
  }
  await input.removeImages(operation.target.uploadedImageUrls);
  return input.completeCancellation();
}
