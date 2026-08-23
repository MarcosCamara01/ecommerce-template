import { z } from "zod";

import {
  catalogProductNameSchema,
  catalogVariantColorSchema,
  catalogVariantImageCountSchema,
} from "./input-validation";
import { parseCatalogPriceCents } from "./money";
import { ProductCategoryZod, ProductSizeZod } from "@/lib/db/drizzle/schema";

export const productIdSchema = z.coerce.number().int().positive();
export const commandIdSchema = z.uuid();
export const productFormSchema = z
  .object({
    name: catalogProductNameSchema,
    description: z.string().trim().min(1),
    price: z.string().trim().transform((value, context) => {
      const cents = parseCatalogPriceCents(value);
      if (cents === null) {
        context.addIssue({
          code: "custom",
          message: "Price must be positive and use at most two decimal places",
        });
        return z.NEVER;
      }
      return cents;
    }),
    category: ProductCategoryZod,
  })
  .transform(({ price, ...product }) => ({ ...product, priceCents: price }));

const variantFormSchema = z.object({
  id: z.number().int().positive().optional(),
  color: catalogVariantColorSchema,
  sizes: z.array(ProductSizeZod).min(1),
  imageCount: catalogVariantImageCountSchema.optional(),
  existingImages: z.array(z.string()).optional(),
  removedImages: z.array(z.string()).optional(),
});

export type CatalogVariantInput = z.infer<typeof variantFormSchema>;

export function parseVariants(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    throw new z.ZodError([
      { code: "custom", message: "Variants are required", path: ["variants"] },
    ]);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new z.ZodError([
      { code: "custom", message: "Invalid variants payload", path: ["variants"] },
    ]);
  }
  const result = z.array(variantFormSchema).min(1).max(50).safeParse(parsed);
  if (result.success) return result.data;
  throw new z.ZodError(
    result.error.issues.map((issue) => ({
      ...issue,
      path: ["variants", ...issue.path],
    })),
  );
}
