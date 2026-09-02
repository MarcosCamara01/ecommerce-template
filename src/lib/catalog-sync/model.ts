import type { ProductCategory, ProductSize } from "../db/drizzle/schema/products";

export const catalogSyncActions = ["upsert", "archive"] as const;
export const catalogSyncStates = [
  "preparing",
  "cancelling",
  "pending",
  "processing",
  "retry_wait",
  "needs_attention",
  "succeeded",
  "cancelled",
] as const;

export type CatalogSyncState = (typeof catalogSyncStates)[number];
export type CatalogProductDraft = {
  name: string;
  description: string;
  priceCents: number;
  category: ProductCategory;
  img: string;
};
export type CatalogVariantDraft = {
  id?: number;
  color: string;
  sizes: ProductSize[];
  images: string[];
};
export type CatalogSnapshot = {
  product: CatalogProductDraft & { archivedAt: string | null };
  variants: Array<{
    id: number;
    stripePriceId: string;
    color: string;
    sizes: ProductSize[];
    images: string[];
    archivedAt: string | null;
  }>;
};
export type CatalogSyncVariantTarget = {
  key: string;
  variantId: number | null;
  stripePriceId: string | null;
  color: string;
  sizes: ProductSize[];
  images: string[];
};
export type CatalogSyncTarget =
  | {
      kind: "preparing";
      expectedProductUpdatedAt: string;
      createdShell: true;
      product: CatalogProductDraft;
      variants: CatalogSyncVariantTarget[];
      uploadedImageUrls: string[];
      completedImageUrls: string[];
      priorSnapshot: CatalogSnapshot;
    }
  | {
      kind: "upsert";
      expectedProductUpdatedAt: string;
      createdShell: boolean;
      product: CatalogProductDraft;
      variants: CatalogSyncVariantTarget[];
      removedVariants: Array<{ variantId: number; stripePriceId: string }>;
      uploadedImageUrls: string[];
      priorSnapshot: CatalogSnapshot;
    }
  | {
      kind: "archive";
      expectedProductUpdatedAt: string;
      stripePriceIds: string[];
      priorSnapshot: CatalogSnapshot;
    };
export type CatalogSyncStripeResult =
  | {
      kind: "upsert";
      variants: Record<string, { productId: string; priceId: string }>;
      archivedPriceIds?: string[];
    }
  | { kind: "archive"; archivedPriceIds: string[] };
export type CatalogSyncOperationRecord = {
  id: string;
  productId: number;
  activeProductId: number | null;
  action: "upsert" | "archive";
  requestHash: string | null;
  state: CatalogSyncState;
  target: CatalogSyncTarget;
  stripeResult: CatalogSyncStripeResult | null;
  attemptCount: number;
  nextAttemptAt: Date;
  leaseOwner: string | null;
  leaseExpiresAt: Date | null;
  lastErrorCode: string | null;
  lastErrorDetail: string | null;
  lastOperatorUserId: string | null;
  lastOperatorReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
};

export class CatalogSyncError extends Error {
  readonly code:
    | "not_found"
    | "conflict"
    | "invalid_target"
    | "reconciliation_required";

  constructor(
    code:
      | "not_found"
      | "conflict"
      | "invalid_target"
      | "reconciliation_required",
    message: string,
  ) {
    super(message);
    this.code = code;
    this.name = "CatalogSyncError";
  }
}
