export type ExistingCatalogVariant = Readonly<{
  id: number;
  color: string;
  archivedAt: Date | null;
}>;

export type IncomingCatalogVariant = Readonly<{
  id?: number;
  color: string;
}>;

export type CatalogVariantMutationPlan = Readonly<{
  archiveIds: readonly number[];
  mutations: readonly Readonly<{
    incomingIndex: number;
    existingId: number | null;
  }>[];
}>;

export function restorableVariantIdsFromArchiveTarget(target: {
  kind: string;
  priorSnapshot?: {
    variants: readonly { id: number; archivedAt: string | null }[];
  };
}): number[] | null {
  if (target.kind !== "archive" || !target.priorSnapshot) return null;
  return target.priorSnapshot.variants
    .filter((variant) => variant.archivedAt === null)
    .map((variant) => variant.id);
}

export class CatalogVariantIdentityConflictError extends Error {
  constructor(color: string, explicitId: number, ownerId: number) {
    super(
      `Variant ${explicitId} cannot use color ${color}; durable variant ${ownerId} already owns it`,
    );
    this.name = "CatalogVariantIdentityConflictError";
  }
}

export class CatalogVariantColorHandoffConflictError extends Error {
  constructor(color: string, ownerId: number) {
    super(
      `Color ${color} cannot be reassigned while durable variant ${ownerId} is explicitly retained in the same operation`,
    );
    this.name = "CatalogVariantColorHandoffConflictError";
  }
}

/**
 * Preserves durable variant identities. An explicit id always wins; a newly
 * submitted variant reuses the active or archived identity with the same
 * unique product/color key instead of colliding with it or replacing it.
 */
export function planCatalogVariantMutation(
  existing: readonly ExistingCatalogVariant[],
  incoming: readonly IncomingCatalogVariant[],
): CatalogVariantMutationPlan {
  const existingById = new Map(existing.map((variant) => [variant.id, variant]));
  const existingByColor = new Map(
    existing.map((variant) => [variant.color, variant]),
  );
  const retainedIds = new Set<number>();
  const explicitlyRetainedIds = new Set<number>();
  const explicitReservations = new Map<number, number>();

  for (let incomingIndex = 0; incomingIndex < incoming.length; incomingIndex += 1) {
    const variant = incoming[incomingIndex];
    if (!variant.id) continue;
    const explicit = existingById.get(variant.id);
    if (!explicit) continue;
    const colorOwner = existingByColor.get(variant.color);
    if (colorOwner && colorOwner.id !== explicit.id) {
      throw new CatalogVariantIdentityConflictError(
        variant.color,
        explicit.id,
        colorOwner.id,
      );
    }
    if (retainedIds.has(explicit.id)) {
      throw new Error(`Variant ${explicit.id} was submitted more than once`);
    }
    retainedIds.add(explicit.id);
    explicitlyRetainedIds.add(explicit.id);
    explicitReservations.set(incomingIndex, explicit.id);
  }

  const mutations = incoming.map((variant, incomingIndex) => {
    const explicitId = explicitReservations.get(incomingIndex);
    if (explicitId !== undefined) {
      return { incomingIndex, existingId: explicitId };
    }
    if (variant.id) return { incomingIndex, existingId: null };
    const colorOwner = existingByColor.get(variant.color);
    if (colorOwner && explicitlyRetainedIds.has(colorOwner.id)) {
      throw new CatalogVariantColorHandoffConflictError(
        variant.color,
        colorOwner.id,
      );
    }
    if (colorOwner && !retainedIds.has(colorOwner.id)) {
      retainedIds.add(colorOwner.id);
      return { incomingIndex, existingId: colorOwner.id };
    }
    return { incomingIndex, existingId: null };
  });

  return {
    archiveIds: existing
      .filter(
        (variant) =>
          variant.archivedAt === null && !retainedIds.has(variant.id),
      )
      .map((variant) => variant.id),
    mutations,
  };
}
