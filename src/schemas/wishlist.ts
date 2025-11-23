import { z } from "zod";

export const WishlistItemSchema = z.object({
  id: z.number(),
  product_id: z.number(),
  user_id: z.string(),
  created_at: z.string().default(() => new Date().toISOString()),
});

export type WishlistItem = z.infer<typeof WishlistItemSchema>;
