import { z } from "zod";
import { ProductSizeEnum } from "./products";

export const CartItemSchema = z.object({
  id: z.number(),
  variant_id: z.number(),
  quantity: z.number(),
  size: ProductSizeEnum,
  stripe_id: z.string(),
  user_id: z.string(),
  created_at: z.string().default(() => new Date().toISOString()),
  updated_at: z.string().default(() => new Date().toISOString()),
});

export type CartItem = z.infer<typeof CartItemSchema>;
