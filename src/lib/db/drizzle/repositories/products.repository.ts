import { eq, desc, sql } from "drizzle-orm";
import { db } from "../connection";
import { productsItems, productsVariants } from "../schema";
import type {
  Product,
  ProductWithVariants,
  InsertProduct,
  InsertProductVariant,
  ProductCategory,
} from "@/schemas";

export const productsRepository = {
  async findAll(): Promise<ProductWithVariants[]> {
    const result = await db.query.productsItems.findMany({
      with: { variants: true },
      orderBy: [desc(productsItems.createdAt)],
    });

    return result.map(transformProduct);
  },

  async findById(id: number): Promise<ProductWithVariants | null> {
    const result = await db.query.productsItems.findFirst({
      where: eq(productsItems.id, id),
      with: { variants: true },
    });

    return result ? transformProduct(result) : null;
  },

  async findByCategory(category: ProductCategory): Promise<ProductWithVariants[]> {
    const result = await db.query.productsItems.findMany({
      where: eq(productsItems.category, category),
      with: { variants: true },
      orderBy: [desc(productsItems.createdAt)],
    });

    return result.map(transformProduct);
  },

  async create(data: InsertProduct): Promise<Product | null> {
    const [result] = await db
      .insert(productsItems)
      .values({
        name: data.name,
        description: data.description,
        price: String(data.price),
        category: data.category,
        img: data.img,
      })
      .returning();

    return result ? transformProductBase(result) : null;
  },

  async createWithVariants(
    product: InsertProduct,
    variants: Omit<InsertProductVariant, "productId">[]
  ): Promise<ProductWithVariants | null> {
    return await db.transaction(async (tx) => {
      const [newProduct] = await tx
        .insert(productsItems)
        .values({
          name: product.name,
          description: product.description,
          price: String(product.price),
          category: product.category,
          img: product.img,
        })
        .returning();

      if (!newProduct) return null;

      const newVariants = await tx
        .insert(productsVariants)
        .values(
          variants.map((v) => ({
            productId: newProduct.id,
            stripeId: v.stripeId,
            color: v.color,
            sizes: v.sizes,
            images: v.images,
          }))
        )
        .returning();

      return {
        ...transformProductBase(newProduct),
        variants: newVariants.map(transformVariant),
      };
    });
  },

  async update(id: number, data: Partial<InsertProduct>): Promise<Product | null> {
    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.price !== undefined) updateData.price = String(data.price);
    if (data.category !== undefined) updateData.category = data.category;
    if (data.img !== undefined) updateData.img = data.img;

    const [result] = await db
      .update(productsItems)
      .set(updateData)
      .where(eq(productsItems.id, id))
      .returning();

    return result ? transformProductBase(result) : null;
  },

  async delete(id: number): Promise<boolean> {
    const result = await db
      .delete(productsItems)
      .where(eq(productsItems.id, id))
      .returning({ id: productsItems.id });

    return result.length > 0;
  },

  async search(query: string): Promise<ProductWithVariants[]> {
    const result = await db.query.productsItems.findMany({
      where: sql`${productsItems.name} ILIKE ${"%" + query + "%"}`,
      with: { variants: true },
      orderBy: [desc(productsItems.createdAt)],
    });

    return result.map(transformProduct);
  },

  async findRandom(limit: number = 4): Promise<ProductWithVariants[]> {
    const result = await db.query.productsItems.findMany({
      with: { variants: true },
      orderBy: sql`RANDOM()`,
      limit,
    });

    return result.map(transformProduct);
  },
};

function transformProductBase(row: typeof productsItems.$inferSelect): Product {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: Number(row.price),
    category: row.category,
    img: row.img,
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
    createdAt: row.createdAt?.toISOString() ?? new Date().toISOString(),
    updatedAt: row.updatedAt?.toISOString() ?? new Date().toISOString(),
  };
}

function transformProduct(
  row: typeof productsItems.$inferSelect & {
    variants: (typeof productsVariants.$inferSelect)[];
  }
): ProductWithVariants {
  return {
    ...transformProductBase(row),
    variants: row.variants.map(transformVariant),
  };
}
