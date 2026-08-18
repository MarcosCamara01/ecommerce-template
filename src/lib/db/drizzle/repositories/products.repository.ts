import "server-only";

import { and, eq, desc, isNotNull, isNull, sql } from "drizzle-orm";
import { db } from "../connection";
import {
  catalogSyncOperations,
  productsItems,
  productsVariants,
} from "../schema";
import { restorableVariantIdsFromArchiveTarget } from "./catalog-archive";
import type {
  ProductWithVariants,
  ProductCategory,
  ProductVariant,
} from "@/lib/db/drizzle/schema";

export const productsRepository = {
  async findAll(): Promise<ProductWithVariants[]> {
    const result = await db.query.productsItems.findMany({
      where: isNull(productsItems.archivedAt),
      with: { variants: { where: isNull(productsVariants.archivedAt) } },
      orderBy: [desc(productsItems.createdAt)],
    });

    return result.map(transformProduct);
  },

  async findById(id: number): Promise<ProductWithVariants | null> {
    const result = await db.query.productsItems.findFirst({
      where: and(eq(productsItems.id, id), isNull(productsItems.archivedAt)),
      with: { variants: { where: isNull(productsVariants.archivedAt) } },
    });

    return result ? transformProduct(result) : null;
  },

  async findByIdIncludingArchived(id: number): Promise<ProductWithVariants | null> {
    const result = await db.query.productsItems.findFirst({
      where: eq(productsItems.id, id),
      with: { variants: true },
    });

    return result ? transformProduct(result) : null;
  },

  async findEditableById(id: number): Promise<ProductWithVariants | null> {
    const result = await db.query.productsItems.findFirst({
      where: and(eq(productsItems.id, id), isNull(productsItems.archivedAt)),
      with: { variants: { where: isNull(productsVariants.archivedAt) } },
    });

    return result ? transformProduct(result) : null;
  },

  async findArchivedByIdForRestoration(
    id: number,
  ): Promise<ProductWithVariants | null> {
    const result = await db.query.productsItems.findFirst({
      where: and(eq(productsItems.id, id), isNotNull(productsItems.archivedAt)),
      with: { variants: true },
    });
    if (!result) return null;
    const [archiveOperation] = await db
      .select({ target: catalogSyncOperations.target })
      .from(catalogSyncOperations)
      .where(
        and(
          eq(catalogSyncOperations.productId, id),
          eq(catalogSyncOperations.action, "archive"),
          eq(catalogSyncOperations.state, "succeeded"),
        ),
      )
      .orderBy(
        desc(catalogSyncOperations.completedAt),
        desc(catalogSyncOperations.createdAt),
      )
      .limit(1);
    const restorableIds = archiveOperation
      ? restorableVariantIdsFromArchiveTarget(archiveOperation.target)
      : null;
    if (!restorableIds) return null;
    const allowed = new Set(restorableIds);
    const product = transformProduct(result);
    return {
      ...product,
      variants: product.variants.filter((variant) => allowed.has(variant.id)),
    };
  },

  async findVariantById(id: number): Promise<ProductVariant | null> {
    const [result] = await db
      .select({ variant: productsVariants })
      .from(productsVariants)
      .innerJoin(productsItems, eq(productsVariants.productId, productsItems.id))
      .where(
        and(
          eq(productsVariants.id, id),
          isNull(productsVariants.archivedAt),
          isNull(productsItems.archivedAt),
        ),
      );

    return result ? transformVariant(result.variant) : null;
  },

  async findVariantByIdIncludingArchived(id: number): Promise<ProductVariant | null> {
    const result = await db.query.productsVariants.findFirst({
      where: eq(productsVariants.id, id),
    });
    return result ? transformVariant(result) : null;
  },

  async findByCategory(
    category: ProductCategory,
  ): Promise<ProductWithVariants[]> {
    const result = await db.query.productsItems.findMany({
      where: and(
        eq(productsItems.category, category),
        isNull(productsItems.archivedAt),
      ),
      with: { variants: { where: isNull(productsVariants.archivedAt) } },
      orderBy: [desc(productsItems.createdAt)],
    });

    return result.map(transformProduct);
  },

  async search(query: string): Promise<ProductWithVariants[]> {
    const result = await db.query.productsItems.findMany({
      where: and(
        sql`${productsItems.name} ILIKE ${"%" + query + "%"}`,
        isNull(productsItems.archivedAt),
      ),
      with: { variants: { where: isNull(productsVariants.archivedAt) } },
      orderBy: [desc(productsItems.createdAt)],
    });

    return result.map(transformProduct);
  },

  async findRandom(limit: number = 4): Promise<ProductWithVariants[]> {
    const result = await db.query.productsItems.findMany({
      where: isNull(productsItems.archivedAt),
      with: { variants: { where: isNull(productsVariants.archivedAt) } },
      orderBy: sql`RANDOM()`,
      limit,
    });

    return result.map(transformProduct);
  },
};

function transformProductBase(row: typeof productsItems.$inferSelect) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: Number(row.price),
    category: row.category,
    img: row.img,
    archivedAt: row.archivedAt?.toISOString() ?? null,
    createdAt: row.createdAt?.toISOString() ?? new Date().toISOString(),
    updatedAt: row.updatedAt?.toISOString() ?? new Date().toISOString(),
  };
}

function transformVariant(row: typeof productsVariants.$inferSelect) {
  return {
    id: row.id,
    productId: row.productId,
    stripeId: row.stripeId,
    color: row.color,
    sizes: row.sizes,
    images: row.images,
    archivedAt: row.archivedAt?.toISOString() ?? null,
    createdAt: row.createdAt?.toISOString() ?? new Date().toISOString(),
    updatedAt: row.updatedAt?.toISOString() ?? new Date().toISOString(),
  };
}

function transformProduct(
  row: typeof productsItems.$inferSelect & {
    variants: (typeof productsVariants.$inferSelect)[];
  },
): ProductWithVariants {
  return {
    ...transformProductBase(row),
    variants: row.variants.map(transformVariant),
  };
}
